/**
 * Funciones de cifrado/descifrado AES-GCM
 */

/**
 * Generar vector de inicialización (IV)
 */
export function generateIV() {
  const iv = new Uint8Array(12); // 96 bits recomendado para AES-GCM
  crypto.getRandomValues(iv);
  return iv;
}

/**
 * Cifrar datos usando AES-GCM
 */
export async function encryptData(data, key, additionalData = null) {
  try {
    // Convertir datos a ArrayBuffer
    const dataBuffer = new TextEncoder().encode(JSON.stringify(data));

    // Generar IV
    const iv = generateIV();

    // Importar clave
    const cryptoKey = await importKey(key);

    // Cifrar
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
        additionalData: additionalData
          ? new TextEncoder().encode(additionalData)
          : undefined,
        tagLength: 128,
      },
      cryptoKey,
      dataBuffer
    );

    // Convertir a Base64 para almacenamiento
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const contentBase64 = btoa(String.fromCharCode(...encryptedArray));
    const ivBase64 = btoa(String.fromCharCode(...iv));

    return {
      content: contentBase64,
      iv: ivBase64,
      algorithm: "AES-GCM-256",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Error al cifrar datos:", error);
    throw error;
  }
}

/**
 * Descifrar datos usando AES-GCM
 */
export async function decryptData(encryptedData, key, additionalData = null) {
  try {
    // Convertir de Base64
    const encryptedArray = Uint8Array.from(atob(encryptedData.content), (c) =>
      c.charCodeAt(0)
    );
    const iv = Uint8Array.from(atob(encryptedData.iv), (c) => c.charCodeAt(0));

    // Importar clave
    const cryptoKey = await importKey(key);

    // Descifrar
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
        additionalData: additionalData
          ? new TextEncoder().encode(additionalData)
          : undefined,
        tagLength: 128,
      },
      cryptoKey,
      encryptedArray
    );

    // Convertir a JSON
    const decryptedText = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(decryptedText);
  } catch (error) {
    console.error("❌ Error al descifrar datos:", error);

    // Error específico para contraseña incorrecta
    if (error.toString().includes("decryption")) {
      throw new Error("Contraseña incorrecta o datos corruptos");
    }

    throw error;
  }
}

/**
 * Cifrar clave maestra para almacenamiento
 */
export async function encryptMasterKey(masterKey, password) {
  // Para almacenamiento seguro, podríamos cifrar la MK con una clave derivada de la contraseña
  // Por ahora, en E2EE puro, la MK nunca sale del cliente
  // Esta función es un placeholder para futuras mejoras

  console.log("⚠️  Clave maestra permanece en memoria del cliente (E2EE)");
  return null;
}

/**
 * Cifrar campo individual
 */
export async function encryptField(data, masterKey, fieldName) {
  const fieldData = {
    value: data,
    field: fieldName,
    timestamp: new Date().toISOString(),
  };

  return encryptData(fieldData, masterKey, fieldName);
}

/**
 * Descifrar campo individual
 */
export async function decryptField(encryptedData, masterKey, fieldName) {
  const decrypted = await decryptData(encryptedData, masterKey, fieldName);
  return decrypted.value;
}

/**
 * Importar clave desde ArrayBuffer/Uint8Array
 */
async function importKey(keyBuffer) {
  return crypto.subtle.importKey("raw", keyBuffer, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}
