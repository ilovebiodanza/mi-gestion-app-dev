import { authService } from "../auth.js";
import { encryptionService } from "../encryption/index.js";

class DocumentService {
  constructor() {
    this.db = null;
    this.collectionName = "documents";

    // Esperar carga de Firebase
    setTimeout(() => {
      if (window.firebaseModules) {
        this.db = window.firebaseModules.db;
      }
    }, 500);
  }

  getCollection() {
    if (!this.db || !window.firebaseModules)
      throw new Error("Firebase no inicializado");
    const user = authService.getCurrentUser();
    if (!user) throw new Error("Usuario no autenticado");

    const { collection } = window.firebaseModules;
    // Estructura: users/{uid}/documents
    return collection(this.db, `users/${user.uid}/${this.collectionName}`);
  }

  // --- NUEVO MÉTODO PARA LA VISTA (ADAPTADOR) ---
  // Este es el método que VaultList.js está buscando
  async listDocuments() {
    const docs = await this.getAllDocuments();

    // Mapeamos los datos para que la Vista los entienda fácilmente
    // Sacamos 'title' y 'updatedAt' de 'metadata' hacia la raíz del objeto
    return docs.map((doc) => ({
      id: doc.id,
      templateId: doc.templateId,
      // Aplanamos los metadatos para la UI
      title: doc.metadata?.title || "Sin Título",
      updatedAt: doc.metadata?.updatedAt || new Date().toISOString(),
      createdAt: doc.metadata?.createdAt || new Date().toISOString(),
      // Mantenemos el resto por si acaso
      ...doc,
    }));
  }

  // --- CREAR ---
  async createDocument(template, formData) {
    console.log("🔒 Iniciando proceso de guardado seguro...");

    const titleField =
      template.fields.find((f) => f.type === "string") || template.fields[0];
    let title = formData[titleField.id];

    if (typeof title === "object" && title !== null)
      title = title.text || title.url || "Sin Título";

    const metadata = {
      title: title || "Nuevo Documento",
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
    console.log("✅ Documento guardado y cifrado exitosamente");
    return documentPayload;
  }

  // --- LEER (LISTA ORIGINAL) ---
  async getAllDocuments() {
    try {
      // Pequeña protección si se llama muy rápido antes de cargar módulos
      if (!window.firebaseModules) return [];

      const { getDocs, query, orderBy } = window.firebaseModules;
      const q = query(
        this.getCollection(),
        orderBy("metadata.updatedAt", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error al listar documentos:", error);
      return [];
    }
  }

  // --- LEER (DETALLE) ---
  async getDocumentById(id) {
    const { doc, getDoc } = window.firebaseModules;
    const docRef = doc(this.getCollection(), id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) throw new Error("Documento no encontrado");
    return { id: snapshot.id, ...snapshot.data() };
  }

  // --- ACTUALIZAR ---
  async updateDocument(docId, template, formData) {
    console.log("🔄 Actualizando documento cifrado...");

    const encryptedObject = await encryptionService.encryptDocument(formData);

    const titleField =
      template.fields.find((f) => f.type === "string") || template.fields[0];
    let title = formData[titleField.id];
    if (typeof title === "object") title = title.text || title.url;

    const { doc, setDoc } = window.firebaseModules;
    const docRef = doc(this.getCollection(), docId);

    const updatePayload = {
      encryptedContent: encryptedObject,
      "metadata.title": title || "Sin Título",
      "metadata.updatedAt": new Date().toISOString(),
      "metadata.icon": template.icon,
    };

    await setDoc(docRef, updatePayload, { merge: true });
    console.log("✅ Documento actualizado");

    return { id: docId, ...updatePayload };
  }

  // --- ELIMINAR ---
  async deleteDocument(id) {
    const { doc, deleteDoc } = window.firebaseModules;
    await deleteDoc(doc(this.getCollection(), id));
    console.log(`🗑️ Documento ${id} eliminado exitosamente`);
  }

  // --- CARGAR PARA EDICIÓN ---
  async loadDocumentForEditing(docId) {
    const doc = await this.getDocumentById(docId);

    const { templateService } = await import("../templates/index.js");
    const template = await templateService.getTemplateById(doc.templateId);

    if (!template) throw new Error("La plantilla de este documento no existe");

    const formData = await encryptionService.decryptDocument(
      doc.encryptedContent
    );

    return { document: doc, template, formData, metadata: doc.metadata };
  }

  // --- RE-CIFRADO MASIVO ---
  async reEncryptAllDocuments(newPassword) {
    console.log("🔄 Iniciando proceso de Re-Cifrado Masivo...");
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
        console.error(`❌ Falló re-cifrado del doc ${docData.id}`, err);
        throw new Error(`Error de integridad en documento. Proceso abortado.`);
      }
    }

    await batch.commit();
    encryptionService.setNewMasterKey(newMasterKey);
    console.log("✅ Re-cifrado completado con éxito.");
    return true;
  }
}

export const documentService = new DocumentService();
