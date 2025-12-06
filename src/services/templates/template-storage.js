// src/services/templates/template-storage.js

// Ruta corregida: un nivel hacia atrás
import { firebaseService } from "../firebase-cdn.js";

const APP_ID = "mi-gestion-v1";

/**
 * Servicio para manejar la persistencia de las plantillas (Firestore y LocalStorage)
 * Contiene la lógica original de loadUserTemplates, saveUserTemplates y sync/check.
 */
class TemplateStorage {
  constructor(userId, appId = APP_ID) {
    this.userId = userId;
    this.appId = appId;
  }

  // --- Métodos de LocalStorage (Backup) ---

  async loadFromLocalStorage() {
    const storageKey = `user_templates_${this.userId}`;
    const storedTemplates = localStorage.getItem(storageKey);
    return storedTemplates ? JSON.parse(storedTemplates) : [];
  }

  async saveToLocalStorage(templates) {
    try {
      if (!this.userId) return;
      const storageKey = `user_templates_${this.userId}`;
      localStorage.setItem(storageKey, JSON.stringify(templates));
    } catch (error) {
      console.error("❌ Error al guardar en localStorage:", error);
    }
  }

  // --- Métodos de Firestore (Fuente de Verdad) ---

  getTemplatesRef() {
    if (!this.userId) {
      throw new Error("ID de usuario no definido para Firestore.");
    }
    // Ruta: artifacts/{appId}/users/{userId}/metadata/templates
    return firebaseService.doc(
      `artifacts/${this.appId}/users/${this.userId}/metadata/templates`
    );
  }

  async loadFromFirestore() {
    console.log("🔥 Cargando plantillas desde Firestore...");
    try {
      const templatesRef = this.getTemplatesRef();
      const docSnap = await firebaseService.getDoc(templatesRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const templates = data.templates || [];
        console.log(
          `✅ ${templates.length} plantillas cargadas desde Firestore`
        );
        return templates;
      }

      // Si el documento no existe
      return [];
    } catch (error) {
      console.error("❌ Error al cargar de Firestore:", error);
      return null; // Retornar null para indicar un fallo que necesita fallback
    }
  }

  async saveToFirestore(templates) {
    try {
      if (!this.userId) return;

      console.log("💾 Guardando plantillas en Firestore...");

      const templatesRef = this.getTemplatesRef();
      const templatesData = {
        userId: this.userId,
        appId: this.appId,
        templates: templates,
        lastUpdated: new Date().toISOString(),
        count: templates.length,
      };

      await firebaseService.setDoc(templatesRef, templatesData, {
        merge: true,
      });

      console.log(`✅ ${templates.length} plantillas guardadas en Firestore`);
      await this.saveToLocalStorage(templates); // Backup local
    } catch (error) {
      console.error("❌ Error al guardar en Firestore:", error);
      throw new Error("Fallo al guardar plantillas en la nube.");
    }
  }

  // --- Lógica de Sincronización y Migración (Original) ---

  async migrateToFirestore() {
    console.log("🚚 Migrando plantillas a Firestore...");
    const localTemplates = await this.loadFromLocalStorage();

    if (localTemplates.length > 0) {
      await this.saveToFirestore(localTemplates);
      console.log(
        `✅ ${localTemplates.length} plantillas migradas a Firestore`
      );
      return { success: true, migrated: localTemplates.length };
    }

    return { success: true, migrated: 0 };
  }

  async checkSyncStatus(localTemplates) {
    if (!this.userId) return { synced: false, error: "Usuario no autenticado" };

    const templatesRef = this.getTemplatesRef();
    const docSnap = await firebaseService.getDoc(templatesRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const cloudTemplates = data.templates || [];

      return {
        synced: cloudTemplates.length === localTemplates.length,
        localCount: localTemplates.length,
        cloudCount: cloudTemplates.length,
        cloudTemplates: cloudTemplates,
        lastUpdated: data.lastUpdated,
        needsSync: cloudTemplates.length !== localTemplates.length,
      };
    }

    return {
      synced: false,
      localCount: localTemplates.length,
      cloudCount: 0,
      needsSync: true,
      cloudTemplates: [],
    };
  }
}

export { TemplateStorage };
