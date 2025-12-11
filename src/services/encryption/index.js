// src/services/encryption/index.js
import { deriveMasterKey, encryptData, decryptData } from "./crypto-utils.js";

class EncryptionService {
  constructor() {
    this.masterKey = null;
    this.userId = null;
  }

  async initialize(password, uid) {
    try {
      this.userId = uid;
      this.masterKey = await deriveMasterKey(password, uid);
      console.log("🔓 Bóveda desbloqueada en memoria.");
      return true;
    } catch (error) {
      console.error("Error inicializando cifrado:", error);
      this.masterKey = null;
      throw error;
    }
  }

  clearKey() {
    this.masterKey = null;
    this.userId = null;
    console.log("🔒 Bóveda bloqueada.");
  }

  // --- NUEVO: Generar una llave sin guardarla (para re-cifrado o importación) ---
  async deriveTemporaryKey(password) {
    if (!this.userId) throw new Error("Usuario no identificado");
    return await deriveMasterKey(password, this.userId);
  }

  // --- NUEVO: Reemplazar la llave en memoria (post re-cifrado) ---
  setNewMasterKey(newKey) {
    this.masterKey = newKey;
    console.log("🔑 Llave maestra actualizada en memoria.");
  }

  // --- NUEVO: Validar llave actual ---
  async validateKey(password) {
    if (!this.userId) return false;
    try {
      // Derivamos y comparamos con una prueba dummy (o simplemente si no falla)
      // En V1, si logramos derivar es "valido" estructuralmente.
      // La validación real ocurre al intentar descifrar algo.
      await deriveMasterKey(password, this.userId);
      return true;
    } catch (e) {
      return false;
    }
  }

  async encryptDocument(data, specificKey = null) {
    // Permite usar una llave específica (para re-cifrado) o la actual por defecto
    const keyToUse = specificKey || this.masterKey;
    if (!keyToUse) throw new Error("Bóveda cerrada (Encrypt).");
    return await encryptData(data, keyToUse);
  }

  /**
   * Intenta descifrar el documento.
   * IMPORTANTE: Si falla, bloquea la bóveda para obligar a pedir la clave de nuevo.
   */
  isReady() {
    // CORRECCIÓN: Verificar ambas cosas.
    // Que la bandera diga true Y que la llave realmente exista en memoria.
    return this.isUnlocked === true && this.key !== null;
  }

  lock() {
    console.log("🔒 Bloqueando bóveda (Limpieza de memoria)...");
    this.key = null;
    this.isUnlocked = false; // <--- ESTO ES CRÍTICO

    // Si tienes algún sistema de notificación o evento, dispáralo aquí
    // if (this.notifyChange) this.notifyChange();
  }

  async decryptDocument(encryptedData) {
    // 1. Validación de seguridad previa
    if (!this.isReady()) {
      // Si entra aquí, es porque la llave se borró. Lanzamos error para que la UI lo atrape
      throw new Error("La bóveda está bloqueada. Se requiere contraseña.");
    }

    try {
      // 2. Intentar desencriptar
      const decrypted = await decryptData(encryptedData, this.key);
      return decrypted;
    } catch (error) {
      console.error(
        "❌ Fallo de desencriptado (Posible clave errónea):",
        error
      );

      // 3. AUTO-BLOQUEO
      // Si falla la criptografía, la llave en memoria NO SIRVE. La matamos.
      this.lock();

      throw new Error("Contraseña incorrecta o datos corruptos.");
    }
  }
}

export const encryptionService = new EncryptionService();
