// src/services/encryption/document-encryption.js

// 👇👇👇 AGREGA ESTA LÍNEA AL PRINCIPIO 👇👇👇
import { encryptData, decryptData } from "./encryption-core.js";

/**
 * Cifrado específico para documentos de Mi Gestión
 */

/**
 * Generar clave de elemento (Item Key) para un documento
 */
export function generateItemKey() {
  const key = new Uint8Array(32); // 256 bits
  crypto.getRandomValues(key);
  return key;
}

/**
 * Cifrar un documento completo
 */
export async function encryptDocument(data, masterKey, documentId = null) {
  try {
    console.log("🔐 Cifrando documento...");

    // CORRECCIÓN CLAVE: Definir el ID FINAL antes de empezar a cifrar
    const finalDocId = documentId || generateDocumentId();

    // Generar clave de elemento única
    const itemKey = generateItemKey();

    // Cifrar el contenido (El contenido no usa additionalData por ahora)
    const encryptedContent = await encryptData(data, itemKey);

    // Cifrar la clave de elemento usando la Clave Maestra
    // IMPORTANTE: Usamos finalDocId como 'additionalData' para vincular el cifrado a este documento específico
    const encryptedItemKey = await encryptData(
      Array.from(itemKey),
      masterKey,
      finalDocId // <--- AHORA USAMOS EL ID REAL
    );

    const contentHash = await calculateContentHash(data);

    return {
      content: encryptedContent,
      metadata: {
        itemKey: encryptedItemKey,
        documentId: finalDocId, // <--- GUARDAMOS EL MISMO ID QUE USAMOS
        contentHash: contentHash,
        encryptedAt: new Date().toISOString(),
        version: "1.0",
      },
    };
  } catch (error) {
    console.error("❌ Error al cifrar documento:", error);
    throw error;
  }
}

/**
 * Descifrar un documento completo
 */
export async function decryptDocument(encryptedDocument, masterKey) {
  try {
    console.log("🔓 Descifrando documento...");

    // Primero, descifrar la clave de elemento usando la clave maestra
    const decryptedItemKeyArray = await decryptData(
      encryptedDocument.metadata.itemKey,
      masterKey,
      encryptedDocument.metadata.documentId || "item_key"
    );

    // Convertir array de vuelta a Uint8Array
    const itemKey = new Uint8Array(decryptedItemKeyArray);

    // Luego, descifrar el contenido con la clave de elemento
    const decryptedContent = await decryptData(
      encryptedDocument.content,
      itemKey
    );

    // Verificar integridad del contenido
    const currentHash = await calculateContentHash(decryptedContent);
    if (currentHash !== encryptedDocument.metadata.contentHash) {
      console.warn(
        "⚠️  Hash de contenido no coincide - posible corrupción de datos"
      );
    }

    return decryptedContent;
  } catch (error) {
    console.error("❌ Error al descifrar documento:", error);

    if (error.message && error.message.includes("Contraseña incorrecta")) {
      throw new Error(
        "No se puede descifrar: contraseña incorrecta o datos corruptos"
      );
    }

    throw error;
  }
}

/**
 * Calcular hash del contenido para verificación de integridad
 */
async function calculateContentHash(data) {
  const dataString = JSON.stringify(data);
  const dataBuffer = new TextEncoder().encode(dataString);

  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

/**
 * Generar ID único para documento
 */
function generateDocumentId() {
  return "doc_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}
