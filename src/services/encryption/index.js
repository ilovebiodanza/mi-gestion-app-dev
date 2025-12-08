// src/services/encryption/index.js

import * as keyDerivation from "./key-derivation.js";
import * as encryptionCore from "./encryption-core.js";
import * as documentEncryption from "./document-encryption.js";
import { firebaseService } from "../firebase-cdn.js";

/**
 * Servicio principal de cifrado E2EE (Sincronizado)
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
      console.log("🔐 Inicializando servicio de cifrado...");

      // 1. Obtener usuario actual para sincronizar el Salt
      const user = firebaseService.getAuth().currentUser;
      if (!user) throw new Error("Usuario no autenticado para iniciar cifrado");

      // 2. Generar o recuperar salt (Sincronizado con Firestore)
      this.salt = await this.getOrCreateSalt(user.uid);

      // 3. Derivar clave maestra (MK) desde la contraseña usando PBKDF2
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
   * Obtener o crear salt (Estrategia: Nube > Local > Generar)
   */
  async getOrCreateSalt(userId) {
    const LOCAL_STORAGE_KEY = `encryption_salt_${userId}`;
    let saltArray = null;

    try {
      // A. Intentar descargar de Firestore (Fuente de Verdad)
      const saltRef = firebaseService.doc(
        `artifacts/mi-gestion-v1/users/${userId}/metadata/encryption`
      );
      const docSnap = await firebaseService.getDoc(saltRef);

      if (docSnap.exists() && docSnap.data().salt) {
        console.log("☁️ Salt descargado de la nube");
        // Convertir de array base (firestore) a Uint8Array
        // Firestore guarda arrays numéricos como objetos a veces, aseguramos array
        const cloudSalt = docSnap.data().salt;
        // Convertir a array de JS estándar si viene como objeto
        const saltValues = Object.values(cloudSalt);
        saltArray = new Uint8Array(
          saltValues.length > 0 ? saltValues : cloudSalt
        );

        // Actualizar caché local
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify(Array.from(saltArray))
        );
        return saltArray;
      }
    } catch (e) {
      console.warn(
        "⚠️ No se pudo conectar con Firestore para leer Salt, intentando local..."
      );
    }

    // B. Si no está en la nube, buscar en LocalStorage (Caché o PC Original)
    const storedSalt =
      localStorage.getItem(LOCAL_STORAGE_KEY) ||
      localStorage.getItem("encryption_salt"); // Fallback al key viejo

    if (storedSalt) {
      console.log("💾 Salt recuperado de almacenamiento local");
      saltArray = new Uint8Array(JSON.parse(storedSalt));

      // IMPORTANTE: Si lo tenemos local pero no estaba en la nube (Paso A falló o no existía),
      // debemos SUBIRLO para que otros dispositivos lo tengan.
      await this.saveSaltToFirestore(userId, saltArray);

      return saltArray;
    }

    // C. Si no existe en ningún lado, generar uno nuevo (Usuario Nuevo)
    console.log("✨ Generando nuevo salt (Primer uso)...");
    const newSalt = keyDerivation.generateSalt();

    // Guardar en ambos lados
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify(Array.from(newSalt))
    );
    await this.saveSaltToFirestore(userId, newSalt);

    return newSalt;
  }

  /**
   * Guardar el salt en Firestore
   */
  async saveSaltToFirestore(userId, salt) {
    try {
      const saltRef = firebaseService.doc(
        `artifacts/mi-gestion-v1/users/${userId}/metadata/encryption`
      );
      // Convertir Uint8Array a Array normal para que Firestore lo acepte
      await firebaseService.setDoc(
        saltRef,
        {
          salt: Array.from(salt),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      console.log("☁️ Salt sincronizado en la nube");
    } catch (e) {
      console.error("❌ Error al guardar Salt en la nube:", e);
      // No lanzamos error para permitir funcionamiento offline/local temporal
    }
  }

  // ... (Resto de métodos: encryptDocument, decryptDocument, etc. IGUAL QUE ANTES)

  async encryptDocument(data, documentId = null) {
    if (!this.isInitialized) throw new Error("Cifrado no inicializado");
    return documentEncryption.encryptDocument(data, this.masterKey, documentId);
  }

  async decryptDocument(encryptedData) {
    if (!this.isInitialized) throw new Error("Cifrado no inicializado");
    return documentEncryption.decryptDocument(encryptedData, this.masterKey);
  }

  async encryptField(data, fieldName) {
    if (!this.isInitialized) throw new Error("Cifrado no inicializado");
    return encryptionCore.encryptField(data, this.masterKey, fieldName);
  }

  async decryptField(encryptedData, fieldName) {
    if (!this.isInitialized) throw new Error("Cifrado no inicializado");
    return encryptionCore.decryptField(
      encryptedData,
      this.masterKey,
      fieldName
    );
  }

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

  clearKeys() {
    this.masterKey = null;
    this.isInitialized = false;
    console.log("🗑️  Claves de cifrado limpiadas de memoria");
  }
}

export const encryptionService = new EncryptionService();
