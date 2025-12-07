// src/services/encryption/encryption-core.js

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
    // 1. Preparar los datos
    const dataString = JSON.stringify(data);
    const dataBuffer = new TextEncoder().encode(dataString);

    // 2. Generar IV y preparar clave
    const iv = generateIV();
    const cryptoKey = await importKey(key);

    // 3. Configurar algoritmo (CORRECCIÓN AQUÍ)
    // Construimos el objeto paso a paso para evitar pasar 'null' o 'undefined'
    const algorithm = {
      name: "AES-GCM",
      iv: iv,
      tagLength: 128,
    };

    // Solo agregamos additionalData si tiene valor
    if (additionalData) {
      // Aseguramos que sea string antes de codificar
      const adString = String(additionalData);
      algorithm.additionalData = new TextEncoder().encode(adString);
    }

    // 4. Cifrar
    const encryptedBuffer = await crypto.subtle.encrypt(
      algorithm,
      cryptoKey,
      dataBuffer
    );

    // 5. Convertir a Base64 para almacenamiento
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
    // 1. Convertir de Base64 a Buffers
    const encryptedArray = Uint8Array.from(atob(encryptedData.content), (c) =>
      c.charCodeAt(0)
    );
    const iv = Uint8Array.from(atob(encryptedData.iv), (c) => c.charCodeAt(0));

    // 2. Importar clave
    const cryptoKey = await importKey(key);

    // 3. Configurar algoritmo (CORRECCIÓN AQUÍ TAMBIÉN)
    const algorithm = {
      name: "AES-GCM",
      iv: iv,
      tagLength: 128,
    };

    if (additionalData) {
      const adString = String(additionalData);
      algorithm.additionalData = new TextEncoder().encode(adString);
    }

    // 4. Descifrar
    const decryptedBuffer = await crypto.subtle.decrypt(
      algorithm,
      cryptoKey,
      encryptedArray
    );

    // 5. Convertir a JSON
    const decryptedText = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(decryptedText);
  } catch (error) {
    console.error("❌ Error al descifrar datos:", error);

    if (
      error.name === "OperationError" ||
      error.message.includes("decryption")
    ) {
      throw new Error("Contraseña incorrecta o datos corruptos");
    }

    throw error;
  }
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
  // Pasamos fieldName como additionalData para vincular el cifrado al campo
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
