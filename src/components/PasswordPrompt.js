// src/components/PasswordPrompt.js

export class PasswordPrompt {
  constructor(onPasswordSubmit, userEmail) {
    this.onPasswordSubmit = onPasswordSubmit;
    this.userEmail = userEmail;
    this.isSubmitting = false;
  }

  render() {
    // Generamos un nombre aleatorio para despistar al gestor de contraseñas del navegador
    const randomFieldName = `safe_key_${Math.floor(Math.random() * 100000)}`;

    return `
      <div class="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"></div>
        
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-[fadeIn_0.3s_ease-out]">
          
          <div class="h-2 bg-gradient-to-r from-primary to-secondary"></div>

          <div class="p-8">
            <div class="text-center mb-8">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4 ring-4 ring-blue-50/50">
                <i class="fas fa-shield-alt text-primary text-2xl"></i>
              </div>
              <h3 class="text-2xl font-bold text-slate-800">Bóveda Cifrada</h3>
              <p class="text-slate-500 mt-2 text-sm">Tus datos están protegidos. Ingresa tu llave maestra para desencriptarlos localmente.</p>
            </div>
            
            <div class="space-y-5">
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i class="fas fa-user text-slate-400"></i>
                </div>
                <input
                  type="text"
                  value="${this.userEmail}"
                  disabled
                  class="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium select-none"
                />
              </div>
              
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i class="fas fa-key text-slate-400"></i>
                </div>
                <input
                  type="password"
                  id="encryptionPassword"
                  name="${randomFieldName}"
                  autocomplete="new-password"
                  data-lpignore="true"
                  readonly
                  onfocus="this.removeAttribute('readonly');"
                  placeholder="Contraseña maestra"
                  class="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
                />
              </div>
              
              <div class="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                <i class="fas fa-exclamation-triangle text-amber-500 mt-0.5 flex-shrink-0"></i>
                <div class="text-xs text-amber-800 space-y-1">
                  <p class="font-bold">Modo Seguro Bancario:</p>
                  <p>Por tu seguridad, esta contraseña no se guarda en el navegador. Debes ingresarla manualmente.</p>
                </div>
              </div>
              
              <div class="flex gap-3 pt-2">
                <button
                  id="cancelEncryption"
                  class="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:text-slate-900 font-medium transition-colors focus:ring-2 focus:ring-slate-200"
                >
                  Omitir
                </button>
                <button
                  id="submitEncryptionPassword"
                  class="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-lg shadow-blue-500/30 font-medium transition-all transform active:scale-95 focus:ring-2 focus:ring-offset-2 focus:ring-primary flex items-center justify-center gap-2"
                >
                  <span id="submitText">Desbloquear</span>
                  <svg id="submitSpinner" class="hidden animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  show() {
    const overlay = document.createElement("div");
    overlay.id = "encryptionPromptOverlay";
    overlay.style.position = "relative";
    overlay.style.zIndex = "9999";
    overlay.innerHTML = this.render();
    document.body.appendChild(overlay);

    // Auto-focus inteligente: Esperamos un poco y quitamos el readonly
    // para que el usuario pueda escribir directo, pero sin disparar el gestor de contraseñas
    setTimeout(() => {
      const input = document.getElementById("encryptionPassword");
      if (input) {
        input.removeAttribute("readonly");
        input.focus();
      }
    }, 150);

    this.setupEventListeners();
  }

  hide() {
    const overlay = document.getElementById("encryptionPromptOverlay");
    if (overlay) overlay.remove();
  }

  setupEventListeners() {
    const passwordInput = document.getElementById("encryptionPassword");
    const submitBtn = document.getElementById("submitEncryptionPassword");
    const cancelBtn = document.getElementById("cancelEncryption");
    const submitText = document.getElementById("submitText");
    const submitSpinner = document.getElementById("submitSpinner");

    const handleSubmit = async () => {
      if (this.isSubmitting) return;

      const password = passwordInput.value.trim();
      if (!password) {
        this.showError("La contraseña es obligatoria");
        passwordInput.classList.add("ring-2", "ring-red-500", "bg-red-50");
        setTimeout(
          () =>
            passwordInput.classList.remove(
              "ring-2",
              "ring-red-500",
              "bg-red-50"
            ),
          2000
        );
        return;
      }

      this.isSubmitting = true;
      submitText.textContent = "Verificando...";
      submitSpinner.classList.remove("hidden");
      submitBtn.disabled = true;
      submitBtn.classList.add("opacity-75", "cursor-not-allowed");

      try {
        const success = await this.onPasswordSubmit(password);
        if (success) {
          this.hide();
        } else {
          this.showError("Contraseña incorrecta");
          this.resetForm();
          passwordInput.value = ""; // Limpiar por seguridad
          passwordInput.focus();
        }
      } catch (error) {
        this.showError(error.message || "Error crítico");
        this.resetForm();
      }
    };

    submitBtn.addEventListener("click", handleSubmit);
    cancelBtn.addEventListener("click", () => this.hide());

    passwordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !this.isSubmitting) handleSubmit();
    });

    // Cerrar al hacer click fuera
    const overlay = document.getElementById("encryptionPromptOverlay");
    overlay
      .querySelector(".absolute")
      .addEventListener("click", () => this.hide());
  }

  showError(message) {
    this.clearErrors();
    const container = document.querySelector(
      "#encryptionPromptOverlay .space-y-5"
    );
    const errorDiv = document.createElement("div");
    errorDiv.className =
      "p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center animate-pulse border border-red-100";
    errorDiv.innerHTML = `<i class="fas fa-times-circle mr-2 text-red-500"></i> ${message}`;

    container.insertBefore(errorDiv, container.lastElementChild);
  }

  clearErrors() {
    const errors = document.querySelectorAll(
      "#encryptionPromptOverlay .bg-red-50"
    );
    errors.forEach((el) => el.remove());
  }

  resetForm() {
    this.isSubmitting = false;
    const submitText = document.getElementById("submitText");
    const submitSpinner = document.getElementById("submitSpinner");
    const submitBtn = document.getElementById("submitEncryptionPassword");

    if (submitText) submitText.textContent = "Desbloquear";
    if (submitSpinner) submitSpinner.classList.add("hidden");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-75", "cursor-not-allowed");
    }
  }
}
