// src/components/SettingsManager.js
import { backupService } from "../services/backup/index.js";
import { authService } from "../services/auth.js";
import { encryptionService } from "../services/encryption/index.js";
import { PasswordPrompt } from "./PasswordPrompt.js"; // Necesario para pedir la clave antigua
import { toast } from "./Toast.js";

export class SettingsManager {
  render() {
    return `
      <div class="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
        
        <div class="mb-8">
            <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Configuración de Seguridad</h2>
            <p class="text-slate-500 text-sm">Gestiona tus claves de acceso y cifrado.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm border border-blue-100">
                        <i class="fas fa-user-lock"></i>
                    </div>
                    <h3 class="font-bold text-slate-800 text-sm">Acceso (Login)</h3>
                </div>
                <div class="p-6">
                    <form id="changeAccessPassForm" class="space-y-5">
                        <div class="relative group">
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Contraseña Actual</label>
                            <div class="relative">
                                <input type="password" id="currentAccessPass" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm pr-10" required>
                                <button type="button" class="toggle-pass absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 cursor-pointer">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="relative group">
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Nueva Contraseña</label>
                            <div class="relative">
                                <input type="password" id="newAccessPass" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm pr-10" required>
                                <button type="button" class="toggle-pass absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 cursor-pointer">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                            <div id="req-access" class="mt-2 space-y-1 pl-1 hidden"></div>
                        </div>

                        <button type="submit" id="btnChangeAccess" disabled class="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition text-sm shadow-sm mt-4">
                            Actualizar Login
                        </button>
                    </form>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden relative">
                <div class="px-6 py-4 border-b border-amber-100 bg-amber-50/30 flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-sm border border-amber-200">
                        <i class="fas fa-key"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-800 text-sm">Llave Maestra (E2EE)</h3>
                    </div>
                </div>
                <div class="p-6">
                    <p class="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-100 mb-4 leading-relaxed font-medium">
                        <i class="fas fa-exclamation-triangle mr-1"></i> Cambiar esto re-cifrará todos tus documentos.
                    </p>
                    
                    <form id="changeVaultPassForm" class="space-y-5">
                        <div class="relative">
                            <input type="password" id="currentVaultPass" placeholder="Llave Actual" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm font-mono pr-10" required>
                            <button type="button" class="toggle-pass absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-amber-600 cursor-pointer">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>

                        <div class="relative">
                            <input type="password" id="newVaultPass" placeholder="Nueva Llave Maestra" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm font-mono pr-10" required>
                            <button type="button" class="toggle-pass absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-amber-600 cursor-pointer">
                                <i class="fas fa-eye"></i>
                            </button>
                            <div id="req-vault" class="mt-2 space-y-1 pl-1 hidden"></div>
                        </div>

                        <button type="submit" id="btnChangeVault" disabled class="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition text-sm shadow-sm mt-4">
                            Re-Cifrar Bóveda
                        </button>
                    </form>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <i class="fas fa-database text-slate-400"></i> Respaldo y Restauración
                </h3>
            </div>
            
            <div class="p-6 flex flex-col sm:flex-row gap-6 items-center">
                <div class="flex-1 w-full">
                    <button id="btnExport" class="w-full py-3 bg-white border border-slate-200 text-slate-700 hover:border-brand-500 hover:text-brand-600 font-bold rounded-lg transition-all text-sm flex items-center justify-center gap-2 group">
                        <span class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-50 transition-colors"><i class="fas fa-download text-xs"></i></span>
                        Descargar Copia Cifrada
                    </button>
                    <p class="text-[10px] text-slate-400 text-center mt-2">Formato JSON seguro</p>
                </div>

                <div class="h-px w-full sm:w-px sm:h-12 bg-slate-200"></div>

                <div class="flex-1 w-full">
                    <div class="flex gap-2">
                        <input type="file" id="fileImport" accept=".json" class="hidden" />
                        <button onclick="document.getElementById('fileImport').click()" class="flex-1 py-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-lg transition text-sm">
                            Elegir Archivo
                        </button>
                        <button id="btnRestore" disabled class="px-6 py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-lg transition text-sm">
                            Restaurar
                        </button>
                    </div>
                    <div id="restoreStatus" class="mt-2 text-[10px] text-center min-h-[1.2em]"></div>
                </div>
            </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // --- 1. Lógica de "Ojitos" (Visibilidad) Global ---
    document.querySelectorAll(".toggle-pass").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const input = btn.previousElementSibling;
        if (input) {
          const type =
            input.getAttribute("type") === "password" ? "text" : "password";
          input.setAttribute("type", type);
          const icon = btn.querySelector("i");
          icon.classList.toggle("fa-eye");
          icon.classList.toggle("fa-eye-slash");
        }
      });
    });

    // --- 2. Validadores de Complejidad (NIST) ---
    // Función helper para generar el HTML de requisitos
    const renderRequirements = (containerId) => {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = `
        <p class="text-xs text-slate-400 flex items-center gap-2 transition-colors" data-req="length"><i class="fas fa-lock-open text-[10px] w-3 text-center"></i> 8+ caracteres</p>
        <p class="text-xs text-slate-400 flex items-center gap-2 transition-colors" data-req="upper"><i class="fas fa-lock-open text-[10px] w-3 text-center"></i> Mayúscula</p>
        <p class="text-xs text-slate-400 flex items-center gap-2 transition-colors" data-req="lower"><i class="fas fa-lock-open text-[10px] w-3 text-center"></i> Minúscula</p>
        <p class="text-xs text-slate-400 flex items-center gap-2 transition-colors" data-req="number"><i class="fas fa-lock-open text-[10px] w-3 text-center"></i> Número</p>
        <p class="text-xs text-slate-400 flex items-center gap-2 transition-colors" data-req="symbol"><i class="fas fa-lock-open text-[10px] w-3 text-center"></i> Símbolo (!@#$)</p>
      `;
    };

    renderRequirements("req-access");
    renderRequirements("req-vault");

    // Función de validación reutilizable
    const setupValidator = (inputId, reqContainerId, btnId) => {
      const input = document.getElementById(inputId);
      const container = document.getElementById(reqContainerId);
      const btn = document.getElementById(btnId);

      if (!input || !container || !btn) return;

      input.addEventListener("input", () => {
        const val = input.value;
        container.classList.remove("hidden"); // Mostrar al escribir

        const checks = {
          length: val.length >= 8,
          upper: /[A-Z]/.test(val),
          lower: /[a-z]/.test(val),
          number: /[0-9]/.test(val),
          symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val),
        };

        let allValid = true;
        for (const [key, isValid] of Object.entries(checks)) {
          const el = container.querySelector(`[data-req="${key}"]`);
          const icon = el.querySelector("i");
          if (isValid) {
            el.classList.remove("text-slate-400");
            el.classList.add("text-emerald-600", "font-medium");
            icon.className =
              "fas fa-lock text-emerald-500 text-[10px] w-3 text-center transform scale-110";
          } else {
            el.classList.add("text-slate-400");
            el.classList.remove("text-emerald-600", "font-medium");
            icon.className =
              "fas fa-lock-open text-red-400 text-[10px] w-3 text-center";
            allValid = false;
          }
        }
        btn.disabled = !allValid;
      });
    };

    // Activamos validadores para ambos formularios
    setupValidator("newAccessPass", "req-access", "btnChangeAccess");
    setupValidator("newVaultPass", "req-vault", "btnChangeVault");

    // --- 3. Lógica de Restauración con "Legacy Password" ---
    const fileInput = document.getElementById("fileImport");
    const btnRestore = document.getElementById("btnRestore");
    const btnExport = document.getElementById("btnExport");
    const statusDiv = document.getElementById("restoreStatus");
    const btnChooseFile = document.querySelector(
      "button[onclick*='fileImport']"
    ); // Selector auxiliar

    if (btnChooseFile)
      btnChooseFile.onclick = () =>
        document.getElementById("fileImport").click();

    fileInput?.addEventListener("change", () => {
      if (fileInput.files.length) {
        btnRestore.disabled = false;
        statusDiv.textContent = `Archivo: ${fileInput.files[0].name}`;
      } else {
        btnRestore.disabled = true;
        statusDiv.textContent = "";
      }
    });

    // LISTENER DE EXPORTAR (Sin cambios lógicos)
    btnExport?.addEventListener("click", async () => {
      await this._handleExport(btnExport);
    });

    // LISTENER DE RESTAURAR (Lógica mejorada)
    btnRestore?.addEventListener("click", async () => {
      const file = fileInput.files[0];
      if (!file) return;

      if (!encryptionService.isReady()) {
        toast.show("Ingresa tu clave maestra actual primero.", "error");
        return;
      }

      const executeRestore = async (overridePassword = null) => {
        btnRestore.disabled = true;
        btnExport.disabled = true;
        statusDiv.textContent = overridePassword
          ? "Intentando descifrar con clave antigua..."
          : "Procesando restauración...";

        try {
          // Si pasamos overridePassword, el servicio debe intentar usar esa para leer el JSON
          // y luego re-cifrar con la actual.
          const result = await backupService.restoreBackup(
            file,
            overridePassword
          );

          toast.show(
            `✅ Restauración exitosa: ${result.docsRestored} docs.`,
            "success"
          );
          setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
          console.error("Restore failed:", error);

          // 🚨 DETECCIÓN DE CLAVE INCORRECTA
          if (
            error.type === "KEY_MISMATCH" ||
            error.message.includes("mac check failed") ||
            error.message.includes("signature")
          ) {
            // Si ya estábamos intentando con una override, falló definitivamente
            if (overridePassword) {
              toast.show(
                "❌ La clave antigua proporcionada no es válida.",
                "error"
              );
            } else {
              // Primera vez fallando: Preguntamos al usuario
              const prompt = new PasswordPrompt(async (legacyPass) => {
                // Reintentamos recursivamente con la password introducida
                await executeRestore(legacyPass);
                return true; // Cierra el modal
              }, "Respaldo Antiguo");

              // Ajustamos textos del Prompt para contexto
              prompt.show();
              // Pequeño hack para cambiar el texto del modal al vuelo y dar contexto
              setTimeout(() => {
                const title = document.querySelector("#passwordPromptModal h3");
                const desc = document.querySelector("#passwordPromptModal p");
                if (title) title.textContent = "Respaldo Protegido";
                if (desc)
                  desc.innerHTML =
                    "Este archivo fue cifrado con una <strong>clave diferente</strong>. Ingresa la clave que usabas cuando creaste este respaldo.";
              }, 50);
            }
          } else {
            toast.show(error.message || "Error al restaurar.", "error");
          }
        } finally {
          btnRestore.disabled = false;
          btnExport.disabled = false;
          statusDiv.textContent = "";
        }
      };

      await executeRestore(); // Primer intento (con clave actual)
    });

    // --- 4. Submits de Formularios (Igual que antes pero sin confirmPass) ---
    document
      .getElementById("changeAccessPassForm")
      ?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const currentPass = document.getElementById("currentAccessPass").value;
        const newPass = document.getElementById("newAccessPass").value;
        try {
          await authService.changeAccessPassword(newPass, currentPass);
          toast.show("✅ Login actualizado. Reiniciando...", "success");
          setTimeout(() => authService.logout(), 1000);
        } catch (err) {
          toast.show(err.message, "error");
        }
      });

    document
      .getElementById("changeVaultPassForm")
      ?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const currentVaultPass =
          document.getElementById("currentVaultPass").value;
        const newVaultPass = document.getElementById("newVaultPass").value;

        // Validamos visualmente que el botón no esté disabled,
        // pero doble check aquí por seguridad
        if (document.getElementById("btnChangeVault").disabled) return;

        const btn = document.getElementById("btnChangeVault");
        btn.disabled = true;
        btn.textContent = "Re-cifrando...";

        try {
          await authService.reEncryptVault(currentVaultPass, newVaultPass);
          toast.show("✅ Bóveda re-cifrada. Reiniciando...", "success");
          encryptionService.lock();
          setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
          toast.show(err.message, "error");
          btn.disabled = false;
          btn.textContent = "Re-Cifrar Bóveda";
        }
      });
  }

  // Helper _handleExport se mantiene igual
  async _handleExport(btn) {
    if (!encryptionService.isReady()) {
      if (window.app && window.app.requireEncryption) {
        window.app.requireEncryption(() => this._handleExport(btn));
      }
      return;
    }
    btn.disabled = true;
    const oldHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
    try {
      const result = await backupService.createBackup();
      toast.show(`✅ Respaldo descargado (${result.count} docs).`, "success");
    } catch (e) {
      toast.show("Error exportando.", "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML = oldHtml;
    }
  }
}
