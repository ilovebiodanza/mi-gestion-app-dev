// src/services/documents/index.js
import { firebaseService } from "../firebase-cdn.js";
import { encryptionService } from "../encryption/index.js";
import { authService } from "../auth.js";
import { VaultDocument } from "../../models/firestore-models.js";

class DocumentService {
  constructor() {
    this.collectionPath = "vault"; // Subcolección dentro del usuario
  }

  /**
   * Crear y guardar un nuevo documento cifrado
   */
  async createDocument(template, formData) {
    const user = authService.getCurrentUser();
    if (!user) throw new Error("Usuario no autenticado");

    console.log("🔒 Iniciando proceso de guardado seguro...");

    const payload = {
      ...formData,
      _templateVersion: template.updatedAt,
    };

    // Crear: Solo pasamos el payload. El ID se genera internamente.
    const encryptedData = await encryptionService.encryptDocument(payload);

    const docModel = new VaultDocument({
      userId: user.uid,
      templateId: template.id,
      encryptedContent: encryptedData.content,
      encryptionMetadata: encryptedData.metadata,
      metadata: {
        title: this.generateDocumentTitle(template, formData),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        icon: template.icon || "📄",
        isFavorite: false,
      },
    });

    const docRef = firebaseService.doc(
      `artifacts/mi-gestion-v1/users/${user.uid}/vault/${docModel.id}`
    );

    await firebaseService.setDoc(docRef, docModel.toFirestore());

    console.log("✅ Documento guardado y cifrado exitosamente");
    return docModel;
  }

  /**
   * Obtener todos los documentos del vault del usuario
   */
  async getAllDocuments() {
    const user = authService.getCurrentUser();
    if (!user) throw new Error("Usuario no autenticado");

    console.log("📂 Cargando lista de documentos del vault...");

    const vaultPath = `artifacts/mi-gestion-v1/users/${user.uid}/vault`;
    const db = firebaseService.getFirestore();
    const { collection, getDocs, query, orderBy } = window.firebaseModules;

    try {
      const q = query(
        collection(db, vaultPath),
        orderBy("metadata.updatedAt", "desc")
      );

      const querySnapshot = await getDocs(q);

      const documents = [];
      querySnapshot.forEach((doc) => {
        documents.push(doc.data());
      });

      console.log(`✅ ${documents.length} documentos encontrados`);
      return documents;
    } catch (error) {
      console.error("❌ Error al obtener documentos:", error);
      return [];
    }
  }

  /**
   * Obtener un documento específico por ID
   */
  async getDocumentById(docId) {
    const user = authService.getCurrentUser();
    if (!user) throw new Error("Usuario no autenticado");

    try {
      const docRef = firebaseService.doc(
        `artifacts/mi-gestion-v1/users/${user.uid}/vault/${docId}`
      );
      const docSnap = await firebaseService.getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        throw new Error("Documento no encontrado");
      }
    } catch (error) {
      console.error("Error al obtener documento:", error);
      throw error;
    }
  }

  /**
   * Carga un documento cifrado para edición (Descifra y prepara)
   */
  async loadDocumentForEditing(docId) {
    const user = authService.getCurrentUser();
    if (!user) throw new Error("Usuario no autenticado");

    const { templateService } = await import("../templates/index.js");

    const encryptedDocument = await this.getDocumentById(docId);

    if (
      !encryptedDocument.encryptionMetadata ||
      !encryptedDocument.encryptedContent
    ) {
      throw new Error("Datos cifrados incompletos o corruptos.");
    }

    const decryptedData = await encryptionService.decryptDocument({
      content: encryptedDocument.encryptedContent,
      metadata: encryptedDocument.encryptionMetadata,
    });

    const template = await templateService.getTemplateById(
      encryptedDocument.templateId
    );
    if (!template) {
      throw new Error("Plantilla asociada no encontrada.");
    }

    return {
      template,
      formData: decryptedData,
      documentId: docId,
      metadata: encryptedDocument.metadata,
    };
  }

  /**
   * Actualizar un documento existente (CRUD - Update)
   */
  async updateDocument(docId, template, formData) {
    const user = authService.getCurrentUser();
    if (!user) throw new Error("Usuario no autenticado");

    console.log(
      `🔒 Iniciando proceso de actualización segura para ${docId}...`
    );

    const payload = {
      ...formData,
      _templateVersion: template.updatedAt,
    };

    // 👇👇👇 CORRECCIÓN CRÍTICA AQUÍ 👇👇👇
    // Eliminamos 'encryptionService.masterKey'. Solo pasamos (data, docId).
    // encryptionService usará su masterKey interna automáticamente.
    const encryptedData = await encryptionService.encryptDocument(
      payload,
      docId // Pasamos el ID para mantener la consistencia del cifrado (AAD)
    );

    // Ajuste para objeto plano en setDoc con merge
    const finalUpdate = {
      encryptedContent: encryptedData.content,
      encryptionMetadata: encryptedData.metadata,
      metadata: {
        ...template.metadata,
        title: this.generateDocumentTitle(template, formData),
        updatedAt: new Date().toISOString(),
        icon: template.icon || "📄",
        isFavorite: false,
      },
    };

    const docRef = firebaseService.doc(
      `artifacts/mi-gestion-v1/users/${user.uid}/vault/${docId}`
    );

    await firebaseService.setDoc(docRef, finalUpdate, { merge: true });

    console.log("✅ Documento actualizado y recifrado exitosamente");
    return { id: docId, ...finalUpdate };
  }

  /**
   * Eliminar un documento por su ID
   */
  async deleteDocument(docId) {
    const user = authService.getCurrentUser();
    if (!user) throw new Error("Usuario no autenticado");

    try {
      const docRef = firebaseService.doc(
        `artifacts/mi-gestion-v1/users/${user.uid}/vault/${docId}`
      );

      await firebaseService.deleteDoc(docRef);

      console.log(`🗑️ Documento ${docId} eliminado exitosamente`);
      return { success: true };
    } catch (error) {
      console.error("❌ Error al eliminar documento:", error);
      throw new Error("No se pudo eliminar el documento de la bóveda.");
    }
  }

  /**
   * Generar título automático basado en el primer campo
   */
  generateDocumentTitle(template, formData) {
    const firstField = template.fields[0];

    if (
      firstField &&
      formData[firstField.id] !== undefined &&
      formData[firstField.id] !== null
    ) {
      const firstValue = formData[firstField.id];
      let title = String(firstValue);

      if (title.length > 0 || firstValue === 0 || firstValue === false) {
        if (title.length > 50) {
          title = title.substring(0, 50) + "...";
        }
        return title;
      }
    }

    return `${template.name} - ${new Date().toLocaleDateString()}`;
  }
}

export const documentService = new DocumentService();
