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

    // Generar clave de elemento única para este documento
    const itemKey = generateItemKey();

    // Cifrar el contenido del documento con la clave de elemento
    const encryptedContent = await encryptData(data, itemKey);

    // Cifrar la clave de elemento con la clave maestra
    const encryptedItemKey = await encryptData(
      Array.from(itemKey), // Convertir a array para JSON
      masterKey,
      documentId || "item_key"
    );

    // Calcular hash del contenido para verificación de integridad
    const contentHash = await calculateContentHash(data);

    return {
      content: encryptedContent,
      metadata: {
        itemKey: encryptedItemKey,
        documentId: documentId || generateDocumentId(),
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
      // Continuamos de todos modos, pero registramos la advertencia
    }

    return decryptedContent;
  } catch (error) {
    console.error("❌ Error al descifrar documento:", error);

    // Error más específico
    if (error.message.includes("Contraseña incorrecta")) {
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

/**
 * Cifrar múltiples documentos en lote
 */
export async function encryptDocumentsBatch(documents, masterKey) {
  const results = [];

  for (const [index, doc] of documents.entries()) {
    try {
      const encrypted = await encryptDocument(doc.data, masterKey, doc.id);
      results.push({
        id: doc.id,
        encrypted,
        success: true,
      });

      console.log(`✅ Documento ${index + 1}/${documents.length} cifrado`);
    } catch (error) {
      console.error(`❌ Error cifrando documento ${doc.id}:`, error);
      results.push({
        id: doc.id,
        error: error.message,
        success: false,
      });
    }
  }

  return results;
}

/**
 * Descifrar múltiples documentos en lote
 */
export async function decryptDocumentsBatch(encryptedDocuments, masterKey) {
  const results = [];

  for (const [index, encDoc] of encryptedDocuments.entries()) {
    try {
      const decrypted = await decryptDocument(encDoc, masterKey);
      results.push({
        id: encDoc.metadata?.documentId || `doc_${index}`,
        data: decrypted,
        success: true,
      });

      console.log(
        `✅ Documento ${index + 1}/${encryptedDocuments.length} descifrado`
      );
    } catch (error) {
      console.error(`❌ Error descifrando documento ${index}:`, error);
      results.push({
        id: `doc_${index}`,
        error: error.message,
        success: false,
      });
    }
  }

  return results;
}
