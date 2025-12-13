// src/services/encryption/crypto-utils.js

// Configuración de Cifrado
const ALGORITHM_NAME = "AES-GCM";
const KDF_NAME = "PBKDF2";
const HASH_NAME = "SHA-256";
const ITERATIONS = 100000;
const SALT_SIZE = 16;
const IV_SIZE = 12;

/**
 * Genera un Salt aleatorio criptográficamente seguro
 */
export function generateSalt() {
  return window.crypto.getRandomValues(new Uint8Array(SALT_SIZE));
}

/**
 * Convierte texto a Buffer
 */
function str2ab(str) {
  return new TextEncoder().encode(str);
}

/**
 * Convierte Buffer a Hex String (para almacenamiento)
 */
function buf2hex(buffer) {
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x) => ("00" + x.toString(16)).slice(-2))
    .join("");
}

/**
 * Convierte Hex String a Buffer
 */
function hex2buf(hexString) {
  return new Uint8Array(
    hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );
}

/**
 * IMPORTAR LLAVE (Helper Interno Crítico)
 * Convierte una llave cruda (Uint8Array) a un objeto CryptoKey utilizable.
 */
async function importKeyIfNeeded(key) {
  // Si ya es CryptoKey, la devolvemos tal cual
  if (key instanceof CryptoKey) return key;

  // Si es bytes (Uint8Array), la importamos para AES-GCM
  return await window.crypto.subtle.importKey(
    "raw",
    key,
    { name: ALGORITHM_NAME },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Deriva una Llave Maestra (AES-GCM) a partir de un password y un salt.
 * Retorna CryptoKey (Objeto).
 * NOTA: Esta función se mantiene por compatibilidad, pero key-derivation.js
 * es la que se usa principalmente ahora.
 */
export async function deriveMasterKey(password, saltString) {
  const passwordBuffer = str2ab(password);
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: KDF_NAME },
    false,
    ["deriveBits", "deriveKey"]
  );

  // Soporte para salt como string o buffer
  const saltBuffer =
    typeof saltString === "string" ? str2ab(saltString) : saltString;

  return await window.crypto.subtle.deriveKey(
    {
      name: KDF_NAME,
      salt: saltBuffer,
      iterations: ITERATIONS,
      hash: HASH_NAME,
    },
    keyMaterial,
    { name: ALGORITHM_NAME, length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Cifra un objeto o texto usando la Llave Maestra
 */
export async function encryptData(data, masterKey) {
  try {
    // 1. Asegurar que tenemos una CryptoKey válida
    const cryptoKey = await importKeyIfNeeded(masterKey);

    // 2. Preparar datos
    const jsonStr = JSON.stringify(data);
    const dataBuffer = str2ab(jsonStr);

    // 3. Generar IV
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_SIZE));

    // 4. Cifrar
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: ALGORITHM_NAME, iv: iv },
      cryptoKey, // Usamos la llave importada
      dataBuffer
    );

    // 5. Retornar paquete
    return {
      iv: buf2hex(iv),
      content: buf2hex(encryptedBuffer),
    };
  } catch (e) {
    console.error("Crypto Error (Encrypt):", e);
    throw new Error("No se pudo cifrar la información.");
  }
}

/**
 * Descifra un paquete { iv, content } usando la Llave Maestra
 */
export async function decryptData(encryptedPackage, masterKey) {
  try {
    if (
      !encryptedPackage ||
      !encryptedPackage.iv ||
      !encryptedPackage.content
    ) {
      console.warn("Datos sin formato cifrado válido.");
      return encryptedPackage;
    }

    // 1. Asegurar que tenemos una CryptoKey válida
    const cryptoKey = await importKeyIfNeeded(masterKey);

    // 2. Recuperar buffers
    const iv = hex2buf(encryptedPackage.iv);
    const content = hex2buf(encryptedPackage.content);

    // 3. Descifrar
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: ALGORITHM_NAME, iv: iv },
      cryptoKey, // Usamos la llave importada
      content
    );

    // 4. Decodificar
    const decodedStr = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(decodedStr);
  } catch (e) {
    console.error("Crypto Error (Decrypt):", e);
    throw new Error("Contraseña incorrecta o datos corruptos.");
  }
}
