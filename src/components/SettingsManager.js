// src/components/SettingsManager.js
import { backupService } from "../services/backup/index.js";
import { authService } from "../services/auth.js";

/**
 * Módulo de Configuración y Seguridad (Anteriormente BackupManager)
 * Centraliza la gestión de perfil, seguridad y datos.
 */
export class SettingsManager {
  render() {
    return `
      <div class="max-w-4xl mx-auto space-y-8 animate-fade-in">
        
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-cogs mr-2 text-blue-600"></i>
            Configuración
          </h2>
          <p class="text-gray-600">Gestiona tu seguridad, datos y preferencias de la cuenta.</p>
        </div>

        <div class="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div class="p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-2">📥 Descargar mis datos (Respaldo)</h3>
            <p class="text-gray-600 text-sm mb-4">
              Crea un archivo con toda tu información cifrada y tus plantillas.
            </p>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <div class="flex">
                <div class="flex-shrink-0">
                  <i class="fas fa-info-circle text-blue-500"></i>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-blue-700 font-medium">
                    Vigencia del Respaldo:
                  </p>
                  <p class="text-sm text-blue-600 mt-1">
                    Este archivo <strong>solo será válido mientras mantengas tu contraseña actual</strong>.
                    Si la cambias, este archivo quedará inservible.
                  </p>
                </div>
              </div>
            </div>

            <button id="btnExport" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition flex items-center shadow-sm">
              <i class="fas fa-download mr-2"></i>
              Descargar Archivo de Respaldo
            </button>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-lg overflow-hidden border border-red-100">
          <div class="p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-2">📤 Restaurar datos desde archivo</h3>
            <p class="text-gray-600 text-sm mb-4">
              Recupera tu información subiendo un archivo de respaldo (.json).
            </p>

            <div class="flex items-center space-x-4">
              <input 
                type="file" 
                id="fileImport" 
                accept=".json"
                class="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                "
              />
              <button id="btnRestore" class="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-6 rounded-lg transition flex items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                <i class="fas fa-upload mr-2"></i>
                Restaurar
              </button>
            </div>
            
            <div id="restoreStatus" class="mt-4 hidden"></div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-lg overflow-hidden border border-orange-100">
          <div class="p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-2">🔐 Cambio de Contraseña</h3>
            <p class="text-gray-600 text-sm mb-4">
              Actualiza tu clave de acceso y cifrado.
            </p>

            <div class="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
              <div class="flex">
                <div class="flex-shrink-0">
                  <i class="fas fa-exclamation-triangle text-orange-500 text-xl"></i>
                </div>
                <div class="ml-3">
                  <h4 class="text-sm font-bold text-orange-800 uppercase">Advertencia Importante</h4>
                  <ul class="list-disc list-inside text-sm text-orange-700 mt-2 space-y-1">
                    <li>Al cambiar tu contraseña, <strong>los respaldos anteriores dejarán de funcionar</strong>.</li>
                    <li>No podrás recuperar datos antiguos si olvidas esta nueva contraseña.</li>
                    <li><strong>Recomendación:</strong> Crea un nuevo respaldo inmediatamente después de cambiar la clave.</li>
                  </ul>
                </div>
              </div>
            </div>

            <form id="changePasswordForm" class="space-y-4 max-w-md">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
                <input type="password" id="currentPassword" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="Necesaria para verificar tu identidad" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                <input type="password" id="newPassword" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="Mínimo 8 caracteres" required minlength="8">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                <input type="password" id="confirmNewPassword" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="Repite la contraseña" required>
              </div>
              
              <button type="submit" id="btnChangePass" class="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-6 rounded-lg transition shadow-sm w-full">
                Cambiar Contraseña
              </button>
            </form>

          </div>
        </div>

      </div>
    `;
  }

  setupEventListeners() {
    // ----------------------------------------------------
    // 1. LÓGICA DE RESPALDO (EXPORTAR)
    // ----------------------------------------------------
    document
      .getElementById("btnExport")
      ?.addEventListener("click", async () => {
        const btn = document.getElementById("btnExport");
        const originalContent = btn.innerHTML;

        try {
          btn.innerHTML =
            '<i class="fas fa-spinner fa-spin mr-2"></i> Generando...';
          btn.disabled = true;

          // Llamamos al servicio de respaldo
          const result = await backupService.createBackup();

          // Mensaje de éxito con advertencia de seguridad
          alert(
            `✅ Respaldo creado con éxito (${result.count} documentos).\n\n` +
              `⚠️ IMPORTANTE:\n` +
              `Este archivo SOLO funciona con tu contraseña actual.\n` +
              `Si cambias tu contraseña en el futuro, este archivo será inservible.\n` +
              `Por favor, crea un nuevo respaldo cada vez que cambies tu clave.`
          );
        } catch (e) {
          console.error(e);
          alert("Error al crear el respaldo: " + e.message);
        } finally {
          btn.innerHTML = originalContent;
          btn.disabled = false;
        }
      });

    // ----------------------------------------------------
    // 2. LÓGICA DE RESTAURACIÓN (IMPORTAR)
    // ----------------------------------------------------
    const fileInput = document.getElementById("fileImport");
    const btnRestore = document.getElementById("btnRestore");

    // Activar botón cuando se selecciona un archivo
    fileInput?.addEventListener("change", () => {
      if (fileInput.files.length > 0) {
        btnRestore.disabled = false;
        // Cambiar estilo para indicar que está listo
        btnRestore.classList.remove(
          "bg-white",
          "text-gray-700",
          "border-gray-300"
        );
        btnRestore.classList.add(
          "bg-blue-600",
          "text-white",
          "hover:bg-blue-700",
          "border-transparent"
        );
      } else {
        btnRestore.disabled = true;
        btnRestore.classList.add(
          "bg-white",
          "text-gray-700",
          "border-gray-300"
        );
        btnRestore.classList.remove(
          "bg-blue-600",
          "text-white",
          "hover:bg-blue-700",
          "border-transparent"
        );
      }
    });

    // Acción de restaurar
    btnRestore?.addEventListener("click", async () => {
      if (fileInput.files.length === 0) return;
      const file = fileInput.files[0];

      /*
      // Advertencia crítica antes de proceder
      if (
        !confirm(
          "⚠️ ¿Estás seguro de restaurar este archivo?\n\nSi tu contraseña actual no es la misma que la del respaldo, los datos serán ilegibles y podrían mezclarse con tus datos actuales."
        )
      ) {
        return;
      }
        */

      const statusDiv = document.getElementById("restoreStatus");
      statusDiv.classList.remove("hidden");
      statusDiv.innerHTML =
        '<p class="text-blue-600"><i class="fas fa-spinner fa-spin mr-2"></i> Verificando clave y restaurando...</p>';
      btnRestore.disabled = true;

      try {
        // El servicio hará la "Prueba del Canario" automáticamente
        const result = await backupService.restoreBackup(file);

        statusDiv.innerHTML = `
                <div class="bg-green-50 text-green-800 p-3 rounded border border-green-200 animate-fade-in">
                    <p class="font-bold"><i class="fas fa-check-circle mr-2"></i> ¡Restauración completada!</p>
                    <p class="text-sm mt-1">Se recuperaron ${result.docsRestored} documentos y ${result.templatesRestored} plantillas.</p>
                    <p class="text-xs mt-2 text-green-700">Tus datos antiguos y nuevos se han fusionado correctamente.</p>
                </div>`;

        // Limpiar input
        fileInput.value = "";
        btnRestore.disabled = true;
        btnRestore.classList.add(
          "bg-white",
          "text-gray-700",
          "border-gray-300"
        );
        btnRestore.classList.remove(
          "bg-blue-600",
          "text-white",
          "hover:bg-blue-700"
        );
      } catch (e) {
        console.error(e);
        // Mostrar error amigable (especialmente si falló la clave)
        statusDiv.innerHTML = `
                <div class="bg-red-50 text-red-800 p-3 rounded border border-red-200 animate-fade-in">
                    <p class="font-bold"><i class="fas fa-times-circle mr-2"></i> No se pudo restaurar</p>
                    <p class="text-sm mt-1 whitespace-pre-line">${e.message}</p>
                </div>
            `;
      } finally {
        if (fileInput.files.length > 0) btnRestore.disabled = false;
      }
    });

    // ----------------------------------------------------
    // 3. LÓGICA DE CAMBIO DE CONTRASEÑA
    // ----------------------------------------------------
    const passForm = document.getElementById("changePasswordForm");

    passForm?.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Capturar valores
      const currentPass = document.getElementById("currentPassword").value; // Necesario para re-auth
      const newPass = document.getElementById("newPassword").value;
      const confirmPass = document.getElementById("confirmNewPassword").value;

      // Validación simple
      if (newPass !== confirmPass) {
        alert("Las contraseñas nuevas no coinciden.");
        return;
      }

      if (newPass.length < 8) {
        alert("La contraseña debe tener al menos 8 caracteres.");
        return;
      }

      // ADVERTENCIA FINAL ANTES DE EJECUTAR
      const confirmMsg =
        "⚠️ ADVERTENCIA DE SEGURIDAD ⚠️\n\n" +
        "Estás a punto de cambiar tu contraseña maestra.\n\n" +
        "1. Los respaldos antiguos DEJARÁN DE FUNCIONAR.\n" +
        "2. Debes crear un NUEVO respaldo inmediatamente después.\n\n" +
        "¿Deseas continuar?";

      if (!confirm(confirmMsg)) return;

      // UI de carga
      const btnChange = document.getElementById("btnChangePass");
      const originalText = btnChange.innerHTML;
      btnChange.disabled = true;
      btnChange.innerHTML =
        '<i class="fas fa-spinner fa-spin mr-2"></i> Procesando...';

      try {
        // Llamar al servicio pasando ambas contraseñas
        const result = await authService.changePassword(newPass, currentPass);

        if (result.success) {
          alert(
            "✅ Contraseña actualizada correctamente.\n\nLa próxima vez que inicies sesión, usa tu nueva clave.\n\n¡IMPORTANTE! Genera un nuevo respaldo ahora mismo."
          );
          passForm.reset();
        } else {
          alert("Error: " + result.error);
        }
      } catch (err) {
        console.error(err);
        alert("Error al cambiar contraseña: " + err.message);
      } finally {
        btnChange.disabled = false;
        btnChange.innerHTML = originalText;
      }
    });
  }
}
