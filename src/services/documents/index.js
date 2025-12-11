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

  async listDocuments() {
    const docs = await this.getAllDocuments();
    return docs.map((doc) => ({
      id: doc.id,
      templateId: doc.templateId,
      title: doc.metadata?.title || "Sin Título",
      updatedAt: doc.metadata?.updatedAt || new Date().toISOString(),
      createdAt: doc.metadata?.createdAt || new Date().toISOString(),
      // Pasamos metadatos visuales importantes para la lista
      icon: doc.metadata?.icon,
      color: doc.metadata?.color,
      templateName: doc.metadata?.templateName,
      ...doc,
    }));
  }

  // --- CREAR (Modificado: recibe explicitTitle) ---
  async createDocument(template, formData, explicitTitle) {
    console.log("🔒 Guardando nuevo documento...");

    // Usamos el título explícito del header
    const title = explicitTitle || "Nuevo Documento";

    const metadata = {
      title: title,
      templateName: template.name,
      icon: template.icon,
      color: template.color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const encryptedObject = await encryptionService.encryptDocument(formData);
    const { doc, setDoc } = window.firebaseModules;
    const docRef = doc(this.getCollection());

    const documentPayload = {
      id: docRef.id,
      templateId: template.id,
      encryptedContent: encryptedObject,
      encryptionMetadata: { version: 1, algo: "AES-GCM" },
      metadata: metadata,
    };

    await setDoc(docRef, documentPayload);
    return documentPayload;
  }

  // --- LEER (LISTA ORIGINAL) ---
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

  // --- LEER (DETALLE) ---
  async getDocumentById(id) {
    const { doc, getDoc } = window.firebaseModules;
    const snapshot = await getDoc(doc(this.getCollection(), id));
    if (!snapshot.exists()) throw new Error("No encontrado");
    return { id: snapshot.id, ...snapshot.data() };
  }

  // --- ACTUALIZAR (Modificado: recibe explicitTitle) ---
  async updateDocument(docId, template, formData, explicitTitle) {
    console.log("🔄 Actualizando documento...");
    const encryptedObject = await encryptionService.encryptDocument(formData);

    const title = explicitTitle || "Documento Actualizado";

    const { doc, setDoc } = window.firebaseModules;
    const docRef = doc(this.getCollection(), docId);

    const updatePayload = {
      encryptedContent: encryptedObject,
      "metadata.title": title, // <--- Actualizamos título explícito
      "metadata.updatedAt": new Date().toISOString(),
      "metadata.icon": template.icon,
      "metadata.color": template.color,
      "metadata.templateName": template.name,
    };

    await setDoc(docRef, updatePayload, { merge: true });
    return { id: docId, ...updatePayload };
  }

  // --- ELIMINAR ---
  async deleteDocument(id) {
    const { doc, deleteDoc } = window.firebaseModules;
    await deleteDoc(doc(this.getCollection(), id));
  }

  // --- CARGAR PARA EDICIÓN ---
  async loadDocumentForEditing(docId) {
    const doc = await this.getDocumentById(docId);
    const { templateService } = await import("../templates/index.js");
    const template = await templateService.getTemplateById(doc.templateId);
    if (!template) throw new Error("Plantilla no existe");
    const formData = await encryptionService.decryptDocument(
      doc.encryptedContent
    );
    return { document: doc, template, formData, metadata: doc.metadata };
  }

  // --- RE-CIFRADO MASIVO ---
  async reEncryptAllDocuments(newPassword) {
    // ... (Lógica de re-cifrado se mantiene igual)
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
}

export const documentService = new DocumentService();
