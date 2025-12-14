// src/services/documents/index.js

import { authService } from "../auth.js";
import { encryptionService } from "../encryption/index.js";

class DocumentService {
  constructor() {
    this.db = null;
    this.collectionName = "documents";
    setTimeout(() => {
      if (window.firebaseModules) this.db = window.firebaseModules.db;
    }, 500);
  }

  getCollection() {
    if (!this.db || !window.firebaseModules)
      throw new Error("Firebase no inicializado");
    const user = authService.getCurrentUser();
    if (!user) throw new Error("Usuario no autenticado");
    const { collection } = window.firebaseModules;
    return collection(this.db, `users/${user.uid}/${this.collectionName}`);
  }

  // --- MÉTODOS PRINCIPALES (Refactorizados) ---

  /**
   * Obtiene un documento por ID
   */
  async getById(id) {
    const { doc, getDoc } = window.firebaseModules;
    const snapshot = await getDoc(doc(this.getCollection(), id));
    if (!snapshot.exists()) throw new Error("No encontrado");
    return { id: snapshot.id, ...snapshot.data() };
  }

  /**
   * Crea un documento nuevo
   * @param {Object} payload - { title, data, template, tags }
   */
  async create(payload) {
    console.log("🔒 Creando documento...");
    const { title, data, template, tags } = payload;

    const metadata = {
      title: title || "Sin Título",
      templateName: template.name,
      icon: template.icon,
      color: template.color,
      tags: tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const encryptedObject = await encryptionService.encryptDocument(data);

    const { doc, setDoc } = window.firebaseModules;
    const docRef = doc(this.getCollection());

    const documentData = {
      id: docRef.id,
      templateId: template.id,
      encryptedContent: encryptedObject,
      encryptionMetadata: { version: 1, algo: "AES-GCM" },
      metadata: metadata,
    };

    await setDoc(docRef, documentData);
    return documentData;
  }

  /**
   * Actualiza un documento existente
   * @param {string} docId
   * @param {Object} payload - { title, data, template, tags }
   */
  async update(docId, payload) {
    console.log("🔄 Actualizando documento...");
    const { title, data, template, tags } = payload;

    const encryptedObject = await encryptionService.encryptDocument(data);

    const { doc, setDoc } = window.firebaseModules;
    const docRef = doc(this.getCollection(), docId);

    const updatePayload = {
      encryptedContent: encryptedObject,
      metadata: {
        title: title,
        tags: tags || [],
        updatedAt: new Date().toISOString(),
        icon: template.icon,
        color: template.color,
        templateName: template.name,
      },
    };

    await setDoc(docRef, updatePayload, { merge: true });
    return { id: docId, ...updatePayload };
  }

  /**
   * Elimina un documento
   */
  async delete(id) {
    const { doc, deleteDoc } = window.firebaseModules;
    await deleteDoc(doc(this.getCollection(), id));
  }

  // --- MÉTODOS DE SOPORTE ---

  async listDocuments() {
    const docs = await this.getAllDocuments(); // Mantenemos getAllDocuments interno o lo renombramos a listAll? Dejémoslo interno por ahora.
    return docs.map((doc) => ({
      id: doc.id,
      templateId: doc.templateId,
      title: doc.metadata?.title || "Sin Título",
      updatedAt: doc.metadata?.updatedAt || new Date().toISOString(),
      createdAt: doc.metadata?.createdAt || new Date().toISOString(),
      icon: doc.metadata?.icon,
      color: doc.metadata?.color,
      templateName: doc.metadata?.templateName,
      tags: doc.metadata?.tags || [],
      ...doc,
    }));
  }

  async getAllDocuments() {
    try {
      if (!window.firebaseModules) return [];
      const { getDocs, query, orderBy } = window.firebaseModules;
      const q = query(
        this.getCollection(),
        orderBy("metadata.updatedAt", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error listar:", error);
      return [];
    }
  }

  /**
   * Carga documento completo para el editor
   */
  async loadDocumentForEditing(docId) {
    // Usamos el nuevo método getById
    const doc = await this.getById(docId);

    const { templateService } = await import("../templates/index.js");

    let template = doc.template;
    if (!template) {
      template = await templateService.getTemplateById(doc.templateId);
    }

    if (!template) throw new Error("Plantilla no existe");

    const formData = await encryptionService.decryptDocument(
      doc.encryptedContent
    );
    return { document: doc, template, formData, metadata: doc.metadata };
  }

  /**
   * Re-cifrado (Mantenimiento)
   */
  async reEncryptAllDocuments(newPassword) {
    const newMasterKey = await encryptionService.deriveTemporaryKey(
      newPassword
    );
    const allDocs = await this.getAllDocuments();
    if (allDocs.length === 0) return true;
    const { writeBatch, doc } = window.firebaseModules;
    const batch = writeBatch(this.db);
    for (const docData of allDocs) {
      try {
        const plainData = await encryptionService.decryptDocument(
          docData.encryptedContent
        );
        const newEncryptedContent = await encryptionService.encryptDocument(
          plainData,
          newMasterKey
        );
        const docRef = doc(this.getCollection(), docData.id);
        batch.update(docRef, {
          encryptedContent: newEncryptedContent,
          "encryptionMetadata.updatedAt": new Date().toISOString(),
        });
      } catch (err) {
        throw new Error(`Error integridad doc ${docData.id}`);
      }
    }
    await batch.commit();
    encryptionService.setNewMasterKey(newMasterKey);
    return true;
  }

  async getDocumentsByTemplateId(templateId) {
    if (!window.firebaseModules) return [];
    const { getDocs, query, where } = window.firebaseModules;

    try {
      const q = query(
        this.getCollection(),
        where("templateId", "==", templateId)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error buscando documentos asociados:", error);
      return [];
    }
  }

  async deleteDocumentsByTemplateId(templateId) {
    console.log(
      `🗑️ Eliminando documentos en cascada para plantilla: ${templateId}`
    );

    const docsToDelete = await this.getDocumentsByTemplateId(templateId);
    if (docsToDelete.length === 0) return 0;

    const { writeBatch, doc } = window.firebaseModules;
    const batch = writeBatch(this.db);

    docsToDelete.forEach((d) => {
      const docRef = doc(this.getCollection(), d.id);
      batch.delete(docRef);
    });

    await batch.commit();
    console.log(`✅ ${docsToDelete.length} documentos eliminados.`);
    return docsToDelete.length;
  }
}

export const documentService = new DocumentService();
