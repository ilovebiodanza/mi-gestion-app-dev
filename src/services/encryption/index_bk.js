/**
 * Servicio principal de cifrado E2EE para Mi Gestión
 */

// Importar módulos
import * as keyDerivation from "./key-derivation.js";
import * as encryptionCore from "./encryption-core.js";
import * as documentEncryption from "./document-encryption.js";
import * as keyManagement from "./key-management.js";
import * as passwordChange from "./password-change.js";

/**
 * Servicio de cifrado E2EE
 */
class EncryptionService {
  constructor() {
    this.isInitialized = false;
    this.masterKey = null;
    this.encryptedMasterKey = null;
    this.salt = null;
  }

  /**
   * Inicializar el servicio con la contraseña del usuario
   */
  async initialize(password) {
    try {
      console.log("🔐 Inicializando servicio de cifrado...");

      // Generar o recuperar salt
      this.salt = await this.getOrCreateSalt();

      // Derivar clave maestra desde la contraseña
      this.masterKey = await keyDerivation.deriveMasterKey(password, this.salt);

      // Cifrar la clave maestra para almacenamiento seguro
      this.encryptedMasterKey = await encryptionCore.encryptMasterKey(
        this.masterKey,
        password
      );

      this.isInitialized = true;
      console.log("✅ Servicio de cifrado inicializado");

      return true;
    } catch (error) {
      console.error("❌ Error al inicializar cifrado:", error);
      throw error;
    }
  }

  /**
   * Obtener o crear salt para derivación de clave
   */
  async getOrCreateSalt() {
    // Intentar recuperar salt existente de localStorage
    const storedSalt = localStorage.getItem("encryption_salt");

    if (storedSalt) {
      console.log("🔑 Salt recuperado de almacenamiento local");
      return new Uint8Array(JSON.parse(storedSalt));
    }

    // Crear nuevo salt
    console.log("🔑 Generando nuevo salt...");
    const newSalt = keyDerivation.generateSalt();

    // Guardar en localStorage (esto es seguro, el salt no es secreto)
    localStorage.setItem(
      "encryption_salt",
      JSON.stringify(Array.from(newSalt))
    );

    return newSalt;
  }

  /**
   * Cifrar un documento
   */
  async encryptDocument(data, documentId = null) {
    if (!this.isInitialized) {
      throw new Error("Servicio de cifrado no inicializado");
    }

    return documentEncryption.encryptDocument(data, this.masterKey, documentId);
  }

  /**
   * Descifrar un documento
   */
  async decryptDocument(encryptedData) {
    if (!this.isInitialized) {
      throw new Error("Servicio de cifrado no inicializado");
    }

    return documentEncryption.decryptDocument(encryptedData, this.masterKey);
  }

  /**
   * Cifrar un campo individual (para campos sensibles)
   */
  async encryptField(data, fieldName) {
    if (!this.isInitialized) {
      throw new Error("Servicio de cifrado no inicializado");
    }

    return encryptionCore.encryptField(data, this.masterKey, fieldName);
  }

  /**
   * Descifrar un campo individual
   */
  async decryptField(encryptedData, fieldName) {
    if (!this.isInitialized) {
      throw new Error("Servicio de cifrado no inicializado");
    }

    return encryptionCore.decryptField(
      encryptedData,
      this.masterKey,
      fieldName
    );
  }

  /**
   * Preparar datos para Firestore
   */
  async prepareForFirestore(data, options = {}) {
    const encrypted = await this.encryptDocument(data, options.documentId);

    return {
      encryptedContent: encrypted.content,
      encryptionMetadata: encrypted.metadata,
      metadata: {
        title: options.title || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: options.tags || [],
        isFavorite: options.isFavorite || false,
        icon: options.icon || "📄",
      },
    };
  }

  /**
   * Recuperar datos de Firestore
   */
  async recoverFromFirestore(firestoreData) {
    return this.decryptDocument({
      content: firestoreData.encryptedContent,
      metadata: firestoreData.encryptionMetadata,
    });
  }

  /**
   * Cambiar contraseña (requiere re-encriptación)
   */
  async changePassword(oldPassword, newPassword) {
    if (!this.isInitialized) {
      throw new Error("Servicio de cifrado no inicializado");
    }

    return passwordChange.processPasswordChange(
      oldPassword,
      newPassword,
      this.masterKey,
      this.salt
    );
  }

  /**
   * Limpiar todas las claves de memoria
   */
  clearKeys() {
    this.masterKey = null;
    this.encryptedMasterKey = null;
    this.isInitialized = false;

    // Sobrescribir la clave en memoria para seguridad
    if (this.masterKey) {
      const zeros = new Uint8Array(this.masterKey.length);
      this.masterKey.set(zeros);
    }

    console.log("🗑️  Claves de cifrado limpiadas de memoria");
  }

  /**
   * Verificar si el servicio está listo
   */
  isReady() {
    return this.isInitialized && this.masterKey !== null;
  }

  /**
   * Obtener estado del servicio
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasMasterKey: this.masterKey !== null,
      hasSalt: this.salt !== null,
      keyLength: this.masterKey ? this.masterKey.length : 0,
    };
  }
}

// Exportar instancia única
export const encryptionService = new EncryptionService();
