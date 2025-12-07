// src/services/encryption/index.js

import * as keyDerivation from "./key-derivation.js";
import * as encryptionCore from "./encryption-core.js";
import * as documentEncryption from "./document-encryption.js";

/**
 * Servicio principal de cifrado E2EE (REAL)
 */
class EncryptionService {
  constructor() {
    this.isInitialized = false;
    this.masterKey = null;
    this.salt = null;
  }

  /**
   * Inicializar el servicio con la contraseña del usuario
   */
  async initialize(password) {
    try {
      console.log("🔐 Inicializando servicio de cifrado real...");

      // 1. Generar o recuperar salt (necesario para que la misma contraseña genere la misma clave siempre)
      this.salt = await this.getOrCreateSalt();

      // 2. Derivar clave maestra (MK) desde la contraseña usando PBKDF2
      this.masterKey = await keyDerivation.deriveMasterKey(password, this.salt);

      this.isInitialized = true;
      console.log("✅ Servicio de cifrado inicializado correctamente");

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
    const storedSalt = localStorage.getItem("encryption_salt");

    if (storedSalt) {
      return new Uint8Array(JSON.parse(storedSalt));
    }

    const newSalt = keyDerivation.generateSalt();
    localStorage.setItem(
      "encryption_salt",
      JSON.stringify(Array.from(newSalt))
    );
    return newSalt;
  }

  /**
   * Cifrar un documento
   * Usa AES-GCM que maneja correctamente caracteres especiales (UTF-8)
   */
  async encryptDocument(data, documentId = null) {
    if (!this.isInitialized) {
      throw new Error(
        "Servicio de cifrado no inicializado. Se requiere contraseña."
      );
    }
    // Delega al módulo de cifrado de documentos real
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
   * Cifrar un campo individual
   */
  async encryptField(data, fieldName) {
    if (!this.isInitialized) throw new Error("Cifrado no inicializado");
    return encryptionCore.encryptField(data, this.masterKey, fieldName);
  }

  /**
   * Descifrar un campo individual
   */
  async decryptField(encryptedData, fieldName) {
    if (!this.isInitialized) throw new Error("Cifrado no inicializado");
    return encryptionCore.decryptField(
      encryptedData,
      this.masterKey,
      fieldName
    );
  }

  /**
   * Verificar estado
   */
  isReady() {
    return this.isInitialized && this.masterKey !== null;
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasMasterKey: this.masterKey !== null,
      algorithm: "PBKDF2 + AES-GCM-256",
    };
  }

  /**
   * Limpiar claves de memoria (Logout)
   */
  clearKeys() {
    this.masterKey = null;
    this.isInitialized = false;
    console.log("🗑️  Claves de cifrado limpiadas de memoria");
  }
}

export const encryptionService = new EncryptionService();
