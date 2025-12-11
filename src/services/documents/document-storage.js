// src/services/documents/document-storage.js
import { authService } from "../auth.js";

class DocumentStorageService {
  constructor() {
    this.collectionName = "documents";
  }

  // Helper para obtener la referencia a la colección del usuario actual
  getUserCollection() {
    const user = authService.getCurrentUser();
    if (!user) throw new Error("Usuario no autenticado");

    const { db, collection } = window.firebaseModules;
    // Estructura: users/{uid}/documents
    return collection(db, "users", user.uid, this.collectionName);
  }

  /**
   * Obtiene la lista de documentos (solo metadatos) para la Bóveda.
   * NO descifra el contenido aquí, eso se hace al abrir el documento.
   */
  async listDocuments() {
    try {
      const colRef = this.getUserCollection();
      const { query, orderBy, getDocs } = window.firebaseModules;

      // Ordenar por fecha de actualización descendente (lo más nuevo arriba)
      const q = query(colRef, orderBy("updatedAt", "desc"));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        // Convertimos el Timestamp de Firebase a fecha JS si existe
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
    } catch (error) {
      console.error("Error listando documentos:", error);
      throw error;
    }
  }

  /**
   * Obtiene un documento específico por ID
   */
  async getDocument(docId) {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { db, doc, getDoc } = window.firebaseModules;
      const docRef = doc(db, "users", user.uid, this.collectionName, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error("Documento no encontrado");
      }
    } catch (error) {
      console.error("Error obteniendo documento:", error);
      throw error;
    }
  }

  /**
   * Guarda un nuevo documento (Cifrado)
   */
  async createDocument(docData) {
    try {
      const colRef = this.getUserCollection();
      const { addDoc, serverTimestamp } = window.firebaseModules; // Nota: addDoc no estaba en tu import original, usaremos setDoc con ID automático o doc()

      // Alternativa compatible con tu import original de app.js (doc, setDoc, collection)
      const { doc, setDoc, db } = window.firebaseModules;
      const user = authService.getCurrentUser();

      // Crear una referencia de documento nueva con ID automático
      const newDocRef = doc(
        collection(db, "users", user.uid, this.collectionName)
      );

      const payload = {
        ...docData,
        createdAt: new Date(), // Usamos Date JS por simplicidad o serverTimestamp si lo importas
        updatedAt: new Date(),
      };

      await setDoc(newDocRef, payload);
      return newDocRef.id;
    } catch (error) {
      console.error("Error creando documento:", error);
      throw error;
    }
  }

  /**
   * Actualiza un documento existente
   */
  async updateDocument(docId, docData) {
    try {
      const user = authService.getCurrentUser();
      const { db, doc, setDoc } = window.firebaseModules;
      const docRef = doc(db, "users", user.uid, this.collectionName, docId);

      // setDoc con merge: true actúa como update
      await setDoc(
        docRef,
        {
          ...docData,
          updatedAt: new Date(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error actualizando documento:", error);
      throw error;
    }
  }

  /**
   * Elimina un documento
   */
  async deleteDocument(docId) {
    try {
      const user = authService.getCurrentUser();
      const { db, doc, deleteDoc } = window.firebaseModules;
      const docRef = doc(db, "users", user.uid, this.collectionName, docId);

      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error eliminando documento:", error);
      throw error;
    }
  }
}

export const documentStorageService = new DocumentStorageService();
