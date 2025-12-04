/**
 * Derivación de clave maestra usando PBKDF2
 */

/**
 * Generar salt aleatorio
 */
export function generateSalt(length = 16) {
  const salt = new Uint8Array(length);
  crypto.getRandomValues(salt);
  return salt;
}

/**
 * Derivar clave maestra desde contraseña usando PBKDF2
 */
export async function deriveMasterKey(password, salt) {
  try {
    console.log("🔑 Derivando clave maestra...");

    // Convertir password a ArrayBuffer
    const passwordBuffer = new TextEncoder().encode(password);

    // Importar password como clave
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      passwordBuffer,
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    // Derivar clave maestra usando PBKDF2
    const masterKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      passwordKey,
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["encrypt", "decrypt"]
    );

    // Exportar clave para almacenamiento en memoria
    const exportedKey = await crypto.subtle.exportKey("raw", masterKey);

    console.log("✅ Clave maestra derivada (256 bits)");
    return new Uint8Array(exportedKey);
  } catch (error) {
    console.error("❌ Error al derivar clave maestra:", error);
    throw error;
  }
}

/**
 * Verificar contraseña (sin revelar la clave)
 */
export async function verifyPassword(password, salt, storedVerifier) {
  try {
    const derivedKey = await deriveMasterKey(password, salt);

    // Crear un hash simple para verificación (no la clave completa)
    const hashBuffer = await crypto.subtle.digest("SHA-256", derivedKey);
    const verificationHash = new Uint8Array(hashBuffer).slice(0, 16); // Primeros 16 bytes

    // Comparar con el verificador almacenado
    const isMatch = verificationHash.every(
      (byte, index) => byte === storedVerifier[index]
    );

    return isMatch;
  } catch (error) {
    console.error("❌ Error al verificar contraseña:", error);
    return false;
  }
}

/**
 * Crear verificador de contraseña (para almacenamiento seguro)
 */
export async function createPasswordVerifier(masterKey) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", masterKey);
  return new Uint8Array(hashBuffer).slice(0, 16); // Primeros 16 bytes
}
