// src/services/backup/index.js

import { documentService } from "../documents/index.js";
import { templateService } from "../templates/index.js";
import { firebaseService } from "../firebase-cdn.js";
import { authService } from "../auth.js";
// 👇 NUEVA IMPORTACIÓN
import { encryptionService } from "../encryption/index.js";

export const backupService = {
  /**
   * Generar y descargar el archivo de respaldo
   */
  async createBackup() {
    try {
      console.log("📦 Iniciando proceso de respaldo...");

      const templates = await templateService.getUserTemplates();
      const documents = await documentService.getAllDocuments();

      const backupData = {
        metadata: {
          version: "1.0",
          appName: "Mi Gestión",
          exportedAt: new Date().toISOString(),
          totalDocuments: documents.length,
          totalTemplates: templates.length,
        },
        data: {
          templates: templates,
          vault: documents,
        },
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `respaldo_migestion_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true, count: documents.length };
    } catch (error) {
      console.error("Error al crear respaldo:", error);
      throw error;
    }
  },

  /**
   * Leer archivo y restaurar datos en Firebase (Con validación de clave)
   */
  async restoreBackup(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const content = JSON.parse(e.target.result);

          // 1. Validaciones de formato
          if (!content.data || !content.data.templates || !content.data.vault) {
            throw new Error("El archivo no es válido o está dañado.");
          }

          const user = authService.getCurrentUser();
          if (!user) throw new Error("Debes iniciar sesión para restaurar.");

          // 👇👇👇 2. VALIDACIÓN DE SEGURIDAD (CANARY TEST) 👇👇👇
          if (content.data.vault.length > 0) {
            console.log("🔐 Verificando compatibilidad de contraseña...");
            try {
              // Tomamos el primer documento como prueba
              const canaryDoc = content.data.vault[0];

              // Intentamos descifrarlo en memoria (sin guardar nada aún)
              if (!encryptionService.isReady()) {
                throw new Error("Cifrado no inicializado");
              }

              await encryptionService.decryptDocument({
                content: canaryDoc.encryptedContent,
                metadata: canaryDoc.encryptionMetadata,
              });

              console.log(
                "✅ Clave compatible. Procediendo con la restauración..."
              );
            } catch (cryptoError) {
              console.error("❌ Prueba de descifrado fallida:", cryptoError);
              // Si falla, lanzamos un error legible para el usuario y DETENEMOS TODO
              throw new Error(
                "⛔ CLAVE INCORRECTA\n\n" +
                  "Este archivo de respaldo fue creado con una contraseña diferente a la actual.\n" +
                  "No se puede restaurar porque los datos serían ilegibles."
              );
            }
          }
          // 👆👆👆 FIN VALIDACIÓN 👆👆👆

          console.log(
            `📦 Iniciando restauración de ${content.data.vault.length} documentos...`
          );

          const batchPromises = [];

          // A. Guardar Plantillas
          const templatesRef = firebaseService.doc(
            `artifacts/mi-gestion-v1/users/${user.uid}/metadata/templates`
          );

          const currentTemplates = await templateService.getUserTemplates();
          const templateMap = new Map(currentTemplates.map((t) => [t.id, t]));

          content.data.templates.forEach((t) => {
            t.userId = user.uid;
            templateMap.set(t.id, t);
          });

          batchPromises.push(
            firebaseService.setDoc(
              templatesRef,
              {
                templates: Array.from(templateMap.values()),
                lastUpdated: new Date().toISOString(),
                count: templateMap.size,
              },
              { merge: true }
            )
          );

          // B. Restaurar Documentos del Vault
          content.data.vault.forEach((doc) => {
            doc.userId = user.uid;
            const docRef = firebaseService.doc(
              `artifacts/mi-gestion-v1/users/${user.uid}/vault/${doc.id}`
            );
            batchPromises.push(firebaseService.setDoc(docRef, doc));
          });

          await Promise.all(batchPromises);

          await templateService.loadUserTemplates();

          resolve({
            success: true,
            docsRestored: content.data.vault.length,
            templatesRestored: content.data.templates.length,
          });
        } catch (err) {
          console.error("Error en restauración:", err);
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error("Error al leer el archivo"));
      reader.readAsText(file);
    });
  },
};
