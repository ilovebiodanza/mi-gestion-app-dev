// src/components/SettingsManager.js
import { backupService } from "../services/backup/index.js";
import { authService } from "../services/auth.js";
import { encryptionService } from "../services/encryption/index.js";

export class SettingsManager {
  render() {
    return `
      <div class="max-w-5xl mx-auto space-y-8 animate-fade-in-up pb-20">
        
        <div class="flex items-center space-x-5 mb-8 px-4 sm:px-0">
          <div class="p-4 bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 flex items-center justify-center">
             <i class="fas fa-shield-halved text-3xl text-indigo-600 bg-clip-text"></i>
          </div>
          <div>
            <h2 class="text-3xl font-extrabold text-slate-800 tracking-tight">Centro de Seguridad</h2>
            <p class="text-slate-500 font-medium">Gestiona tus credenciales y protege tu legado digital.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            
            <div class="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden flex flex-col h-full">
                <div class="bg-gradient-to-r from-blue-50 to-white px-8 py-6 border-b border-blue-100/50 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                            <i class="fas fa-user-lock"></i>
                        </div>
                        <h3 class="font-bold text-slate-800 text-lg">Acceso a la Cuenta</h3>
                    </div>
                    <span class="text-[10px] uppercase font-bold tracking-wider bg-white border border-blue-100 text-blue-600 px-3 py-1 rounded-full shadow-sm">Nube Firebase</span>
                </div>
                
                <div class="p-8 flex-grow">
                    <p class="text-sm text-slate-500 mb-6 leading-relaxed">
                        Esta es la contraseña que usas para iniciar sesión (Login). Cambiarla no afecta el cifrado de tus documentos.
                    </p>
                    
                    <form id="changeAccessPassForm" class="space-y-5">
                        <div class="group">
                            <label class="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Contraseña Actual</label>
                            <div class="relative">
                                <i class="fas fa-lock absolute left-4 top-3.5 text-slate-300"></i>
                                <input type="password" id="currentAccessPass" class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-700 font-medium" required>
                            </div>
                        </div>
                        <div class="group">
                            <label class="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Nueva Contraseña</label>
                            <div class="relative">
                                <i class="fas fa-key absolute left-4 top-3.5 text-slate-300"></i>
                                <input type="password" id="newAccessPass" class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-700 font-medium" required minlength="6">
                            </div>
                        </div>
                        <button type="submit" id="btnChangeAccess" class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 mt-2">
                            Actualizar Credenciales
                        </button>
                    </form>
                </div>
            </div>

            <div class="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-amber-100 overflow-hidden flex flex-col h-full relative">
                <div class="absolute top-0 right-0 w-20 h-20 overflow-hidden pointer-events-none">
                     <div class="bg-amber-400 text-amber-900 text-[10px] font-bold py-1 text-center w-32 -rotate-45 absolute top-4 -right-10 shadow-sm">CRÍTICO</div>
                </div>

                <div class="bg-gradient-to-r from-amber-50 to-white px-8 py-6 border-b border-amber-100/50 flex items-center justify-between">
                     <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
                            <i class="fas fa-key"></i>
                        </div>
                        <h3 class="font-bold text-slate-800 text-lg">Llave Maestra Bóveda</h3>
                    </div>
                </div>
                
                <div class="p-8 flex-grow">
                    <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                        <i class="fas fa-exclamation-triangle text-amber-500 mt-0.5"></i>
                        <p class="text-xs text-amber-800 leading-relaxed font-medium">
                            Esta llave <strong>cifra tus datos</strong>. Si la cambias, el sistema deberá descifrar y volver a cifrar todos tus documentos (Re-Keying).
                        </p>
                    </div>
                    
                    <form id="changeVaultPassForm" class="space-y-4">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="sm:col-span-2">
                                <label class="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Llave Maestra Actual</label>
                                <input type="password" id="currentVaultPass" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition font-mono text-sm" required>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Nueva Llave</label>
                                <input type="password" id="newVaultPass" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition font-mono text-sm" required minlength="8">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Confirmar</label>
                                <input type="password" id="confirmVaultPass" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition font-mono text-sm" required>
                            </div>
                        </div>
                        <button type="submit" id="btnChangeVault" class="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 mt-2 flex items-center justify-center gap-2">
                            <i class="fas fa-sync-alt"></i> Re-Cifrar Bóveda
                        </button>
                    </form>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden mt-8">
            <div class="px-8 py-6 border-b border-slate-100 bg-slate-50/30">
                <h3 class="font-bold text-lg text-slate-800 flex items-center">
                    <span class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 text-sm"><i class="fas fa-database"></i></span>
                    Respaldo y Restauración
                </h3>
            </div>
            
            <div class="p-8 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                
                <div class="group">
                    <h4 class="font-bold text-slate-700 mb-2 flex items-center"><i class="fas fa-file-export text-slate-400 mr-2 group-hover:text-primary transition-colors"></i> Exportar Datos</h4>
                    <p class="text-xs text-slate-500 mb-5 leading-relaxed">
                        Descarga un archivo JSON cifrado con tu <strong>Llave de Bóveda</strong> actual. Guárdalo en un lugar seguro (USB, Disco Externo).
                    </p>
                    <button id="btnExport" class="w-full sm:w-auto px-6 py-2.5 bg-white border-2 border-slate-100 hover:border-primary/50 text-slate-600 hover:text-primary font-bold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center">
                        <i class="fas fa-download mr-2"></i> Descargar Respaldo
                    </button>
                </div>

                <div class="border-t md:border-t-0 md:border-l border-slate-100 pt-8 md:pt-0 md:pl-10 group relative">
                    <h4 class="font-bold text-slate-700 mb-2 flex items-center"><i class="fas fa-file-import text-slate-400 mr-2 group-hover:text-primary transition-colors"></i> Restaurar Datos</h4>
                    <p class="text-xs text-slate-500 mb-5 leading-relaxed">
                        Importa un respaldo. Si el archivo usa una llave antigua, el sistema te la pedirá automáticamente.
                    </p>
                    
                    <div class="flex flex-col sm:flex-row gap-3">
                        <input type="file" id="fileImport" accept=".json" class="hidden" />
                        
                        <button onclick="document.getElementById('fileImport').click()" class="flex-1 px-5 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition text-sm">
                            <i class="fas fa-folder-open mr-2"></i> Elegir Archivo
                        </button>
                        
                        <button id="btnRestore" disabled class="flex-1 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow-lg shadow-indigo-500/20 text-sm">
                            Restaurar
                        </button>
                    </div>
                    <div id="restoreStatus" class="mt-4 text-xs font-medium min-h-[20px]"></div>
                </div>
            </div>
        </div>

      </div>
    `;
  }

  setupEventListeners() {
    // 1. CAMBIO DE CLAVE DE ACCESO
    document
      .getElementById("changeAccessPassForm")
      ?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const current = document.getElementById("currentAccessPass").value;
        const newPass = document.getElementById("newAccessPass").value;
        const btn = document.getElementById("btnChangeAccess");

        const originalContent = btn.innerHTML;
        btn.innerHTML =
          '<i class="fas fa-circle-notch fa-spin"></i> Procesando...';
        btn.disabled = true;

        try {
          const res = await authService.changeAccessPassword(newPass, current);
          if (res.success) {
            alert("✅ Clave de acceso actualizada correctamente.");
            e.target.reset();
          } else {
            alert("❌ Error: " + res.error);
          }
        } catch (err) {
          alert("Error de conexión");
        }

        btn.innerHTML = originalContent;
        btn.disabled = false;
      });

    // 2. CAMBIO DE LLAVE MAESTRA
    document
      .getElementById("changeVaultPassForm")
      ?.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!encryptionService.isReady()) {
          if (window.app && window.app.requireEncryption) {
            window.app.requireEncryption(() =>
              document.getElementById("btnChangeVault").click()
            );
          }
          return;
        }

        const newKey = document.getElementById("newVaultPass").value;
        const confirmKey = document.getElementById("confirmVaultPass").value;

        if (newKey !== confirmKey)
          return alert("Las llaves nuevas no coinciden.");
        if (newKey.length < 8)
          return alert("La llave debe tener al menos 8 caracteres.");

        if (
          !confirm(
            "⚠️ ATENCIÓN: Se re-cifrarán todos tus documentos.\nEste proceso es delicado. No cierres la ventana.\n\n¿Continuar?"
          )
        )
          return;

        const btn = document.getElementById("btnChangeVault");
        const originalContent = btn.innerHTML;
        btn.innerHTML =
          '<i class="fas fa-circle-notch fa-spin mr-2"></i> Re-cifrando...';
        btn.disabled = true;

        try {
          // Import dinámico para evitar ciclos, si es necesario
          const { documentService } = await import(
            "../services/documents/index.js"
          );
          await documentService.reEncryptAllDocuments(newKey);

          alert(
            "✅ ¡Éxito! Tu Bóveda ha sido re-cifrada con la nueva llave.\nNo la olvides."
          );
          e.target.reset();
        } catch (err) {
          console.error(err);
          alert("❌ Error crítico: " + err.message);
        } finally {
          btn.innerHTML = originalContent;
          btn.disabled = false;
        }
      });

    // 3. RESPALDO
    document
      .getElementById("btnExport")
      ?.addEventListener("click", async () => {
        if (!encryptionService.isReady()) {
          if (window.app && window.app.requireEncryption)
            window.app.requireEncryption(() =>
              document.getElementById("btnExport").click()
            );
          return;
        }
        try {
          const res = await backupService.createBackup();
          // Toast o Alert bonito
          const btn = document.getElementById("btnExport");
          const original = btn.innerHTML;
          btn.innerHTML = `<i class="fas fa-check mr-2"></i> ¡Listo!`;
          btn.classList.add(
            "bg-green-50",
            "text-green-600",
            "border-green-200"
          );
          setTimeout(() => {
            btn.innerHTML = original;
            btn.classList.remove(
              "bg-green-50",
              "text-green-600",
              "border-green-200"
            );
          }, 3000);
        } catch (e) {
          alert("Error: " + e.message);
        }
      });

    // 4. RESTAURACIÓN
    const fileInput = document.getElementById("fileImport");
    const btnRestore = document.getElementById("btnRestore");
    const statusDiv = document.getElementById("restoreStatus");

    fileInput?.addEventListener("change", () => {
      if (fileInput.files.length) {
        btnRestore.disabled = false;
        statusDiv.innerHTML = `<span class="text-slate-500"><i class="fas fa-file-alt mr-1"></i> ${fileInput.files[0].name} seleccionado.</span>`;
      } else {
        btnRestore.disabled = true;
        statusDiv.innerHTML = "";
      }
    });

    btnRestore?.addEventListener("click", async () => {
      if (!encryptionService.isReady()) {
        if (window.app && window.app.requireEncryption)
          window.app.requireEncryption(() => btnRestore.click());
        return;
      }

      statusDiv.innerHTML =
        '<span class="text-blue-600 flex items-center gap-2"><i class="fas fa-spinner fa-spin"></i> Analizando y descifrando...</span>';
      btnRestore.disabled = true;

      const file = fileInput.files[0];

      try {
        const result = await backupService.restoreBackup(file);
        statusDiv.innerHTML = `<span class="text-emerald-600 font-bold flex items-center gap-2"><i class="fas fa-check-circle"></i> Restaurados ${result.docsRestored} documentos exitosamente.</span>`;
        fileInput.value = "";
      } catch (error) {
        if (error.type === "KEY_MISMATCH") {
          const legacyPass = prompt(
            "🔐 LLAVE INCORRECTA\nEste respaldo fue creado con una llave antigua.\nIngrésala para descifrarlo:"
          );

          if (legacyPass) {
            try {
              statusDiv.innerHTML =
                '<span class="text-amber-600 flex items-center gap-2"><i class="fas fa-circle-notch fa-spin"></i> Intentando con llave antigua...</span>';
              const res2 = await backupService.restoreBackup(file, legacyPass);
              statusDiv.innerHTML = `<span class="text-emerald-600 font-bold flex items-center gap-2"><i class="fas fa-check-double"></i> Recuperados ${res2.docsRestored} docs (Llave antigua).</span>`;
              alert(
                "Restauración exitosa. Los documentos se han actualizado a tu llave actual."
              );
              fileInput.value = "";
            } catch (err2) {
              statusDiv.innerHTML = `<span class="text-red-500 font-bold"><i class="fas fa-times-circle"></i> La llave antigua tampoco funcionó.</span>`;
            }
          } else {
            statusDiv.innerHTML = `<span class="text-slate-400">Cancelado por el usuario.</span>`;
          }
        } else {
          statusDiv.innerHTML = `<span class="text-red-500 font-bold"><i class="fas fa-times-circle"></i> Error: ${error.message}</span>`;
        }
      } finally {
        if (fileInput.files.length) btnRestore.disabled = false;
      }
    });
  }
}
