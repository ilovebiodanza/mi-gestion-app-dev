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
   * Crear y guardar un nuevo documento cifrado
   */
  async createDocument(template, formData) {
    const user = authService.getCurrentUser();
    if (!user) throw new Error("Usuario no autenticado");

    console.log("🔒 Iniciando proceso de guardado seguro...");

    // 1. Preparar el objeto de datos puro (payload)
    // Solo guardamos los valores, la estructura la define la plantilla
    const payload = {
      ...formData,
      _templateVersion: template.updatedAt, // Para control de versiones futuro
    };

    // 2. Cifrar el contenido
    // Esto genera: { content: "...", metadata: { itemKey: "...", ... } }
    const encryptedData = await encryptionService.encryptDocument(payload);

    // 3. Crear instancia del modelo VaultDocument
    // Nota: Los metadatos visibles (título, fecha) NO van cifrados para poder listar/ordenar
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

    // 4. Guardar en Firestore
    // Ruta: artifacts/{appId}/users/{userId}/vault/{docId}
    const docRef = firebaseService.doc(
      `artifacts/mi-gestion-v1/users/${user.uid}/vault/${docModel.id}`
    );

    await firebaseService.setDoc(docRef, docModel.toFirestore());

    console.log("✅ Documento guardado y cifrado exitosamente");
    return docModel;
  }

  /**
   * Obtener todos los documentos del vault del usuario
   * Retorna solo los metadatos (sin descifrar el contenido pesado aún)
   */
  async getAllDocuments() {
    const user = authService.getCurrentUser();
    if (!user) throw new Error("Usuario no autenticado");

    console.log("📂 Cargando lista de documentos del vault...");

    // Referencia a la colección vault
    // Nota: Para querys complejas (orderBy), asegúrate que firebase-cdn.js
    // exponga 'query', 'orderBy', 'collection', 'getDocs'.
    // Si tu wrapper es simple, usaremos un getDocs básico y ordenaremos en JS por ahora.

    // Ruta: artifacts/mi-gestion-v1/users/{uid}/vault
    const vaultPath = `artifacts/mi-gestion-v1/users/${user.uid}/vault`;

    // Usamos el wrapper de firebaseService.
    // Asumimos que getDocs devuelve un QuerySnapshot
    // Si tu firebase-cdn.js no tiene 'getDocs' para colecciones,
    // necesitamos asegurarnos de que pueda leer colecciones.
    // *Ver nota abajo sobre firebase-cdn.js*

    // INTENTO DIRECTO CON LA INSTANCIA DE DB (usando el getter del servicio)
    const db = firebaseService.getFirestore();
    const { collection, getDocs, query, orderBy } = window.firebaseModules; // Acceso directo a módulos

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
      throw error;
    }
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

      // Llamada al wrapper de deleteDoc
      await firebaseService.deleteDoc(docRef);

      console.log(`🗑️ Documento ${docId} eliminado exitosamente`);
      return { success: true };
    } catch (error) {
      console.error("❌ Error al eliminar documento:", error);
      throw new Error("No se pudo eliminar el documento de la bóveda.");
    }
  }

  /**
   * Generar un título automático para el documento basado en el valor del primer campo.
   */
  generateDocumentTitle(template, formData) {
    // 1. Tomar el primer campo definido en la plantilla
    const firstField = template.fields[0];

    if (
      firstField &&
      formData[firstField.id] !== undefined &&
      formData[firstField.id] !== null
    ) {
      const firstValue = formData[firstField.id];
      let title = String(firstValue);

      // 2. Limpieza y validación básica
      // Aceptamos 0 o false como título, pero no cadenas vacías, undefined, o NaN.
      if (title.length > 0 || firstValue === 0 || firstValue === false) {
        // Truncar el título a 50 caracteres para no sobrecargar la UI
        if (title.length > 50) {
          title = title.substring(0, 50) + "...";
        }

        // Si el valor es booleano o numérico, lo convertimos a un string legible si es necesario (ej. "true")
        return title;
      }
    }

    // 3. Fallback: Usar el nombre de la plantilla y la fecha si el primer campo no es válido o está vacío
    return `${template.name} - ${new Date().toLocaleDateString()}`;
  }

  /**
   * Carga un documento cifrado, lo descifra y obtiene su plantilla asociada,
   * preparando los datos para ser rellenados en el formulario de edición.
   */
  async loadDocumentForEditing(docId) {
    const user = authService.getCurrentUser();
    if (!user) throw new Error("Usuario no autenticado");

    // 1. Obtener el documento cifrado (metadata + contenido)
    const encryptedDocument = await this.getDocumentById(docId);

    // 2. Descifrar el contenido
    if (
      !encryptedDocument.encryptionMetadata ||
      !encryptedDocument.encryptedContent
    ) {
      throw new Error("Datos cifrados incompletos o corruptos.");
    }

    // El descifrado del contenido cifrado (encryptedContent) y la clave de elemento (itemKey)
    // se manejan internamente por encryptionService.decryptDocument.
    const decryptedData = await encryptionService.decryptDocument({
      content: encryptedDocument.encryptedContent,
      metadata: encryptedDocument.encryptionMetadata,
    });

    // 3. Obtener la plantilla
    const template = await templateService.getTemplateById(
      encryptedDocument.templateId
    );
    if (!template) {
      throw new Error("Plantilla asociada no encontrada.");
    }

    // 4. Retornar el objeto completo para el editor
    return {
      template,
      formData: decryptedData, // Contenido descifrado
      documentId: docId,
      metadata: encryptedDocument.metadata, // Metadatos (título, fechas, etc.)
    };
  }
}

export const documentService = new DocumentService();
