// src/services/encryption/index.js
import { deriveMasterKey, encryptData, decryptData } from "./crypto-utils.js";

class EncryptionService {
  constructor() {
    this.key = null; // Unificado: Antes era masterKey
    this.userId = null;
    this.isUnlocked = false; // Nueva bandera de estado
  }

  async initialize(password, uid) {
    try {
      this.userId = uid;

      // 1. Derivamos la llave
      const derivedKey = await deriveMasterKey(password, uid);

      // 2. LA GUARDAMOS EN LA VARIABLE CORRECTA (this.key)
      this.key = derivedKey;

      // 3. ¡IMPORTANTE! ACTIVAMOS LA BANDERA DE DESBLOQUEO
      // Esto permite que 'decryptDocument' funcione inmediatamente después para la verificación
      this.isUnlocked = true;

      console.log("🔓 Bóveda desbloqueada en memoria (Flag activa).");
      return true;
    } catch (error) {
      console.error("Error inicializando cifrado:", error);
      this.lock(); // Si falla algo aquí, limpiamos todo por seguridad
      throw error;
    }
  }

  // Limpieza total de seguridad
  lock() {
    console.log("🔒 Bloqueando bóveda (Limpieza de memoria)...");
    this.key = null;
    this.isUnlocked = false;
    this.userId = null;
  }

  // Verificación de estado
  isReady() {
    // Ahora verifica la variable correcta 'this.key'
    return this.isUnlocked === true && this.key !== null;
  }

  async decryptDocument(encryptedData) {
    // 1. Validación de seguridad previa
    if (!this.isReady()) {
      throw new Error("La bóveda está bloqueada. Se requiere contraseña.");
    }

    try {
      // 2. Intentar desencriptar usando la variable correcta 'this.key'
      const decrypted = await decryptData(encryptedData, this.key);
      return decrypted;
    } catch (error) {
      console.error(
        "❌ Fallo de desencriptado (Posible clave errónea):",
        error
      );

      // 3. AUTO-BLOQUEO: Si la llave no sirve, la matamos.
      this.lock();

      throw new Error("Contraseña incorrecta o datos corruptos.");
    }
  }

  async encryptDocument(data, specificKey = null) {
    const keyToUse = specificKey || this.key;
    if (!keyToUse) throw new Error("Bóveda cerrada (Encrypt).");
    return await encryptData(data, keyToUse);
  }

  // --- Funciones auxiliares (Re-cifrado, etc.) ---

  async deriveTemporaryKey(password) {
    if (!this.userId) throw new Error("Usuario no identificado");
    return await deriveMasterKey(password, this.userId);
  }

  setNewMasterKey(newKey) {
    this.key = newKey; // Unificado a this.key
    this.isUnlocked = true; // Aseguramos que quede abierta
    console.log("🔑 Llave maestra actualizada en memoria.");
  }

  async validateKey(password) {
    if (!this.userId) return false;
    try {
      await deriveMasterKey(password, this.userId);
      return true;
    } catch (e) {
      return false;
    }
  }
}

export const encryptionService = new EncryptionService();
