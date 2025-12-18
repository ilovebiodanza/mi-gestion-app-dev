// src/components/VaultSetupModal.js
import { authService } from "../services/auth.js";
import { toast } from "./Toast.js";

export class VaultSetupModal {
  constructor(onSuccess) {
    this.onSuccess = onSuccess;
  }

  show() {
    if (document.getElementById("vaultSetupModal")) return;

    const modalHtml = `
      <div id="vaultSetupModal" class="fixed inset-0 z-[80] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/90 backdrop-blur-sm transition-opacity opacity-0" id="vsmBackdrop"></div>
        
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform scale-95 opacity-0 transition-all duration-300" id="vsmCard">
          
          <div class="bg-slate-50 px-6 py-6 border-b border-slate-100 text-center">
            <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-600 shadow-sm border border-slate-100">
              <i class="fas fa-shield-halved text-3xl"></i>
            </div>
            <h2 class="text-xl font-bold text-slate-900">Configura tu Bóveda</h2>
            <p class="text-sm text-slate-500 mt-2 leading-relaxed">
              Crea una <strong class="text-slate-700">Llave Maestra</strong> única. <br>
              Esta llave cifrará todos tus documentos. <span class="text-red-500 font-bold">No la pierdas</span>, nosotros no podemos recuperarla.
            </p>
          </div>

          <div class="p-8">
            <form id="vaultSetupForm" autocomplete="off">
              
              <div class="mb-6">
                <label class="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                  Tu Llave Maestra
                </label>
                
                <div class="relative group">
                    <input type="password" id="setupMasterKey" 
                      class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all text-slate-800 placeholder-slate-400 pr-12 font-mono text-sm"
                      placeholder="Crea una contraseña fuerte..." required autofocus autocomplete="new-password">
                    
                    <button type="button" id="toggleSetupKey" class="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer text-slate-400 hover:text-brand-600 transition-colors focus:outline-none" tabindex="-1">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>

                <div id="setup-requirements" class="mt-4 space-y-2 pl-1 hidden transition-all duration-300">
                    <p class="text-xs text-slate-400 flex items-center gap-2 transition-colors" data-req="length">
                        <i class="fas fa-lock-open text-[10px] w-4 text-center"></i> 8+ caracteres
                    </p>
                    <p class="text-xs text-slate-400 flex items-center gap-2 transition-colors" data-req="upper">
                        <i class="fas fa-lock-open text-[10px] w-4 text-center"></i> Una Mayúscula
                    </p>
                    <p class="text-xs text-slate-400 flex items-center gap-2 transition-colors" data-req="lower">
                        <i class="fas fa-lock-open text-[10px] w-4 text-center"></i> Una Minúscula
                    </p>
                    <p class="text-xs text-slate-400 flex items-center gap-2 transition-colors" data-req="number">
                        <i class="fas fa-lock-open text-[10px] w-4 text-center"></i> Un Número
                    </p>
                    <p class="text-xs text-slate-400 flex items-center gap-2 transition-colors" data-req="symbol">
                        <i class="fas fa-lock-open text-[10px] w-4 text-center"></i> Un Símbolo (!@#$)
                    </p>
                </div>
              </div>

              <button type="submit" id="btnSetupVault" disabled
                class="w-full py-3.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-brand-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-2">
                <span>Encriptar Bóveda</span>
                <i class="fas fa-lock text-xs"></i>
              </button>
            </form>
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // Animación de entrada
    requestAnimationFrame(() => {
      const backdrop = document.getElementById("vsmBackdrop");
      const card = document.getElementById("vsmCard");
      if (backdrop && card) {
        backdrop.classList.remove("opacity-0");
        card.classList.remove("scale-95", "opacity-0");
        card.classList.add("scale-100", "opacity-100");
      }
    });

    this.setupListeners();
  }

  setupListeners() {
    const form = document.getElementById("vaultSetupForm");
    const input = document.getElementById("setupMasterKey");
    const toggleBtn = document.getElementById("toggleSetupKey");
    const submitBtn = document.getElementById("btnSetupVault");
    const reqList = document.getElementById("setup-requirements");

    // 1. Lógica del Ojito (Ver/Ocultar)
    if (toggleBtn) {
      toggleBtn.onclick = () => {
        const type =
          input.getAttribute("type") === "password" ? "text" : "password";
        input.setAttribute("type", type);

        const icon = toggleBtn.querySelector("i");
        icon.classList.toggle("fa-eye");
        icon.classList.toggle("fa-eye-slash");

        input.focus();
      };
    }

    // 2. Validación en Tiempo Real (NIST con Candados)
    input.addEventListener("input", () => {
      reqList.classList.remove("hidden");
      const val = input.value;

      const checks = {
        length: val.length >= 8,
        upper: /[A-Z]/.test(val),
        lower: /[a-z]/.test(val),
        number: /[0-9]/.test(val),
        symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val),
      };

      let allValid = true;

      for (const [key, isValid] of Object.entries(checks)) {
        const el = reqList.querySelector(`[data-req="${key}"]`);
        const icon = el.querySelector("i");

        if (isValid) {
          // Requisito Cumplido: Candado cerrado verde
          el.classList.remove("text-slate-400");
          el.classList.add("text-emerald-600", "font-medium");
          icon.className =
            "fas fa-lock text-emerald-500 text-[10px] w-4 text-center transform scale-110 transition-transform";
        } else {
          // Requisito NO Cumplido: Candado abierto rojo/gris
          el.classList.add("text-slate-400");
          el.classList.remove("text-emerald-600", "font-medium");
          icon.className =
            "fas fa-lock-open text-red-400 text-[10px] w-4 text-center transition-colors";
          allValid = false;
        }
      }

      // Habilitar o deshabilitar botón basado en cumplimiento total
      submitBtn.disabled = !allValid;
    });

    // 3. Envío del Formulario
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const password = input.value;

      // Estado de carga UI
      const originalHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Configurando...`;

      try {
        // Ejecutamos las dos operaciones requeridas
        // Nota: Si implementaste 'configureVault' en authService usa esa,
        // si no, mantenemos estas dos líneas que son seguras con tu código actual.
        await authService.initializeEncryption(password);
        await authService.markVaultAsConfigured();

        toast.show("✅ Bóveda configurada y segura", "success");

        this.close();
        if (this.onSuccess) this.onSuccess();
      } catch (error) {
        console.error(error);
        toast.show(error.message || "Error configurando la bóveda", "error");
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
      }
    });
  }

  close() {
    const modal = document.getElementById("vaultSetupModal");
    if (modal) modal.remove();
  }
}
