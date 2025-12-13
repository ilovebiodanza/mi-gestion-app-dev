// src/services/encryption/index.js
import { encryptData, decryptData } from "./crypto-utils.js";
import { deriveMasterKey, verifyPassword } from "./key-derivation.js"; // <--- Ajuste aquí

class EncryptionService {
  constructor() {
    this.key = null;
    this.userId = null;
    this.isUnlocked = false;
    this.lockTimer = null;
    this.GRACE_PERIOD_MS = 2 * 60 * 60 * 1000; // 2 Horas
  }

  _resetTimer() {
    if (this.lockTimer) clearTimeout(this.lockTimer);
    this.lockTimer = setTimeout(() => {
      console.warn("⏳ Tiempo de gracia expirado.");
      this.lock();
      window.location.reload();
    }, this.GRACE_PERIOD_MS);
  }

  // ACEPTA VERIFIER
  async initialize(password, salt, uid, verifier = null) {
    try {
      this.userId = uid;

      // 1. SI HAY VERIFICADOR, COMPROBAMOS LA CONTRASEÑA ANTES DE SEGUIR
      if (verifier) {
        const isValid = await verifyPassword(password, salt, verifier);
        if (!isValid) {
          console.error("🚫 Contraseña de bóveda incorrecta.");
          throw new Error("Contraseña incorrecta");
        }
      }

      // 2. Si es válida (o no hay verificador), derivamos y abrimos
      const derivedKey = await deriveMasterKey(password, salt);
      this.key = derivedKey;
      this.isUnlocked = true;

      this._resetTimer();
      console.log("🔓 Bóveda desbloqueada y verificada.");
      return true;
    } catch (error) {
      this.lock();
      throw error; // Esto hará que el PasswordPrompt muestre el error rojo
    }
  }

  lock() {
    console.log("🔒 Bloqueando bóveda (Limpieza de memoria)...");
    this.key = null; // <--- La llave se borra (se vuelve null)
    this.isUnlocked = false; // <--- La bandera se baja
    this.userId = null;
    if (this.lockTimer) clearTimeout(this.lockTimer); // Detenemos el reloj
  }

  isReady() {
    return this.isUnlocked === true && this.key !== null;
  }

  async decryptDocument(encryptedData) {
    if (!this.isReady()) throw new Error("Bóveda bloqueada");
    this._resetTimer();
    return await decryptData(encryptedData, this.key);
  }

  async encryptDocument(data) {
    if (!this.isReady()) throw new Error("Bóveda bloqueada");
    this._resetTimer();
    return await encryptData(data, this.key);
  }

  async validateKey(password, salt) {
    // Método auxiliar para verificaciones sin estado
    // Nota: Si tienes verifier es mejor usar verifyPassword directamente
    try {
      await deriveMasterKey(password, salt);
      return true;
    } catch (e) {
      return false;
    }
  }
}

export const encryptionService = new EncryptionService();
