export class PasswordPrompt {
  constructor(onSubmit, email) {
    this.onSubmit = onSubmit;
    this.email = email;
    this.modalElement = null;
  }

  show() {
    // Evitar múltiples modales
    if (document.getElementById("password-prompt-modal")) return;

    this.modalElement = document.createElement("div");
    this.modalElement.id = "password-prompt-modal";
    // Overlay con blur y fondo oscuro
    this.modalElement.className =
      "fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in";

    this.modalElement.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 animate-fade-in-up">
        <div class="h-2 bg-gradient-to-r from-primary via-secondary to-accent"></div>
        
        <div class="p-8">
          <div class="text-center mb-6">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 text-primary mb-4 ring-8 ring-indigo-50/50">
              <i class="fas fa-key text-2xl"></i>
            </div>
            <h3 class="text-xl font-bold text-slate-800">Desbloquear Bóveda</h3>
            <p class="text-sm text-slate-500 mt-1">Confirma tu identidad para descifrar los datos de <br><span class="font-medium text-slate-700">${this.email}</span></p>
          </div>

          <form id="promptForm" class="space-y-4">
            <div class="relative">
               <input type="password" id="promptPassword" required autofocus
                class="w-full px-4 py-3 text-center text-lg tracking-widest bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none placeholder-slate-300"
                placeholder="Contraseña Maestra">
            </div>

            <div id="promptError" class="hidden text-center text-xs font-bold text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">
              Contraseña incorrecta
            </div>

            <div class="flex gap-3 mt-6">
              <button type="button" id="btnCancel" class="flex-1 py-2.5 px-4 bg-white border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors">
                Cancelar
              </button>
              <button type="submit" id="btnUnlock" class="flex-1 py-2.5 px-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                Desbloquear
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(this.modalElement);

    const form = this.modalElement.querySelector("#promptForm");
    const input = this.modalElement.querySelector("#promptPassword");
    const cancelBtn = this.modalElement.querySelector("#btnCancel");
    const unlockBtn = this.modalElement.querySelector("#btnUnlock");
    const errorDiv = this.modalElement.querySelector("#promptError");

    input.focus();

    cancelBtn.addEventListener("click", () => this.close());

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const password = input.value;

      // UI de carga
      unlockBtn.disabled = true;
      unlockBtn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i>`;
      input.disabled = true;
      errorDiv.classList.add("hidden");

      const success = await this.onSubmit(password);

      if (success) {
        // Éxito: Animación verde antes de cerrar
        unlockBtn.classList.remove("bg-primary", "hover:bg-primary-hover");
        unlockBtn.classList.add("bg-emerald-500");
        unlockBtn.innerHTML = `<i class="fas fa-check"></i>`;
        setTimeout(() => this.close(), 500);
      } else {
        // Error
        errorDiv.classList.remove("hidden");
        errorDiv.classList.add("animate-pulse");
        input.value = "";
        input.disabled = false;
        input.focus();
        unlockBtn.disabled = false;
        unlockBtn.textContent = "Desbloquear";
      }
    });
  }

  close() {
    if (this.modalElement) {
      // Animación de salida opcional
      this.modalElement.style.opacity = "0";
      setTimeout(() => {
        this.modalElement.remove();
        this.modalElement = null;
      }, 300);
    }
  }
}
