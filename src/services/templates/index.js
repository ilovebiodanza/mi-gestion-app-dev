// src/services/templates/index.js

import { TemplateStorage } from "./template-storage.js";
import { templateBuilder } from "./template-builder.js"; // Importamos el builder AQUÍ, no en la vista

class TemplateService {
  constructor() {
    this.userId = null;
    this.appId = "mi-gestion-v1";
    this.userTemplates = [];
    this.isInitialized = false;
    this.storage = null;
  }

  async initialize(userId) {
    if (this.isInitialized && this.userId === userId) return;
    this.userId = userId;
    this.storage = new TemplateStorage(userId, this.appId);
    await this.loadUserTemplates();
    this.isInitialized = true;
  }

  async loadUserTemplates() {
    try {
      if (!this.userId) {
        this.userTemplates = [];
        return;
      }
      let templates = await this.storage.loadFromFirestore();
      if (templates === null) {
        templates = await this.storage.loadFromLocalStorage();
      }
      this.userTemplates = templates || [];

      if (templates && templates.length === 0) {
        // Inicializar almacenamiento si está vacío
        await this.storage.saveToFirestore(this.userTemplates);
      }
    } catch (error) {
      console.error("❌ Error al cargar plantillas:", error);
      this.userTemplates = [];
    }
  }

  // --- CRUD con Validación Centralizada ---

  async createTemplate(templateData) {
    if (!this.userId) throw new Error("Usuario no autenticado");

    // 1. VALIDACIÓN: Usando templateBuilder internamente
    templateBuilder.validateTemplateData(templateData);

    // 2. Construcción del objeto
    const newTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...templateData,
      settings: {
        allowDuplicates: false,
        maxEntries: 0,
        category: "custom",
        ...templateData.settings,
        isSystemTemplate: false, // Siempre falso para creadas por usuario
      },
    };

    this.userTemplates.push(newTemplate);
    await this.storage.saveToFirestore(this.userTemplates);
    return newTemplate;
  }

  async updateTemplate(templateId, updates) {
    const index = this.userTemplates.findIndex((t) => t.id === templateId);
    if (index === -1) throw new Error("Plantilla no encontrada");

    // 1. Fusión temporal para validación (Current + Updates)
    const mergedTemplate = {
      ...this.userTemplates[index],
      ...updates,
    };

    // 2. VALIDACIÓN: Validar el objeto resultante completo
    // Esto evita que una actualización parcial deje la plantilla inválida
    templateBuilder.validateTemplateData(mergedTemplate);

    // 3. Aplicar actualización
    this.userTemplates[index] = {
      ...mergedTemplate,
      updatedAt: new Date().toISOString(),
    };

    await this.storage.saveToFirestore(this.userTemplates);
    return this.userTemplates[index];
  }

  async deleteTemplate(templateId) {
    const initialLength = this.userTemplates.length;
    this.userTemplates = this.userTemplates.filter((t) => t.id !== templateId);

    if (this.userTemplates.length === initialLength) {
      throw new Error("Plantilla no encontrada");
    }

    await this.storage.saveToFirestore(this.userTemplates);
    return { success: true, message: "Plantilla eliminada" };
  }

  // --- Métodos de Consulta ---

  async getUserTemplates() {
    if (!this.isInitialized) throw new Error("Servicio no inicializado");
    return this.userTemplates;
  }

  async getTemplateById(templateId) {
    return this.userTemplates.find((t) => t.id === templateId) || null;
  }

  async getCategories() {
    // Aquí podrías usar los helpers si quisieras enriquecer la data,
    // pero generalmente devolvemos datos crudos o agregados simples.
    const templates = await this.getUserTemplates();
    // Importamos dinámicamente o usamos lógica simple para agrupar
    const categoriesSet = [
      ...new Set(templates.map((t) => t.settings.category)),
    ];

    // NOTA: El mapeo de nombres bonitos se hace en el Frontend con helpers.js
    // Aquí solo devolvemos los IDs de categorías y conteos.
    return categoriesSet.map((cat) => ({
      id: cat,
      count: templates.filter((t) => t.settings.category === cat).length,
    }));
  }

  // --- Sincronización ---
  async checkSyncStatus() {
    return this.storage.checkSyncStatus(this.userTemplates);
  }

  async syncTemplates() {
    const status = await this.storage.checkSyncStatus(this.userTemplates);
    if (status.needsSync) {
      if (status.cloudCount > status.localCount) {
        this.userTemplates = status.cloudTemplates;
        await this.storage.saveToLocalStorage(this.userTemplates);
        return {
          synced: true,
          message: `Descargadas ${status.cloudCount} plantillas.`,
        };
      } else if (status.localCount > status.cloudCount) {
        await this.storage.saveToFirestore(this.userTemplates);
        return {
          synced: true,
          message: `Subidas ${status.localCount} plantillas.`,
        };
      }
    }
    return { synced: true, message: "Sincronizado." };
  }
}

export const templateService = new TemplateService();
