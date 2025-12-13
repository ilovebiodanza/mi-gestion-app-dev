// src/components/VaultSetupModal.js
import { authService } from "../services/auth.js";
import { encryptionService } from "../services/encryption/index.js";
import {
  generateSalt,
  createPasswordVerifier,
  deriveMasterKey,
} from "../services/encryption/key-derivation.js";

export class VaultSetupModal {
  constructor(onSuccess) {
    this.onSuccess = onSuccess;
    this.modalElement = null;
  }

  show() {
    if (document.getElementById("vault-setup-modal")) return;

    this.modalElement = document.createElement("div");
    this.modalElement.id = "vault-setup-modal";
    this.modalElement.className =
      "fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in";

    this.modalElement.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 animate-fade-in-up">
        <div class="h-3 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500"></div>
        
        <div class="p-8">
          <div class="text-center mb-6">
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-50 text-amber-500 mb-4 ring-8 ring-amber-50/50">
              <i class="fas fa-shield-cat text-4xl"></i>
            </div>
            <h3 class="text-2xl font-extrabold text-slate-800">Protege tu Bóveda</h3>
            <p class="text-sm text-slate-500 mt-2 leading-relaxed">
              Configura tu <strong>Llave Maestra</strong> única. <br>
              <span class="text-red-500 font-bold block mt-2 text-xs uppercase tracking-wider">
                <i class="fas fa-exclamation-triangle"></i> No uses la misma del Login
              </span>
            </p>
          </div>

          <form id="setupForm" class="space-y-4">
            <div>
               <label class="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Nueva Llave Maestra</label>
               <input type="password" id="setupPass" required minlength="8"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none font-medium"
                placeholder="Mínimo 8 caracteres">
            </div>
            
            <div>
               <label class="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Confirmar Llave</label>
               <input type="password" id="setupPassConfirm" required minlength="8"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none font-medium"
                placeholder="Repite la llave">
            </div>

            <div id="setupError" class="hidden text-center text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center justify-center gap-2">
              <i class="fas fa-times-circle"></i> <span>Error</span>
            </div>

            <div class="pt-4">
              <button type="submit" id="btnSetup" class="w-full py-4 px-6 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                <span>Crear Bóveda Segura</span>
                <i class="fas fa-arrow-right"></i>
              </button>
              <button type="button" id="btnCancelSetup" class="w-full mt-3 py-3 text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors">
                Cancelar y Salir
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(this.modalElement);

    const form = this.modalElement.querySelector("#setupForm");
    const p1 = this.modalElement.querySelector("#setupPass");
    const p2 = this.modalElement.querySelector("#setupPassConfirm");
    const errorDiv = this.modalElement.querySelector("#setupError");
    const btn = this.modalElement.querySelector("#btnSetup");
    const btnCancel = this.modalElement.querySelector("#btnCancelSetup");

    const showError = (msg) => {
      errorDiv.querySelector("span").textContent = msg;
      errorDiv.classList.remove("hidden");
      errorDiv.classList.add("animate-pulse");
    };

    btnCancel.addEventListener("click", () => this.close());

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorDiv.classList.add("hidden");

      const pass1 = p1.value;
      const pass2 = p2.value;

      if (pass1 !== pass2) return showError("Las contraseñas no coinciden.");
      if (pass1.length < 8) return showError("Mínimo 8 caracteres.");

      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Verificando seguridad...`;

      try {
        // 1. Verificar conflicto con Login (Opción A)
        const isConflict = await authService.checkPasswordConflict(pass1);
        if (isConflict) {
          btn.disabled = false;
          btn.innerHTML = originalText;
          return showError(
            "¡Seguridad! No puedes usar la misma contraseña del Login."
          );
        }

        btn.innerHTML = `<i class="fas fa-cog fa-spin"></i> Cifrando...`;

        // 2. Generar Criptografía
        const salt = generateSalt(16);
        const user = authService.getCurrentUser();

        // Derivamos la llave para crear el verificador
        const masterKey = await deriveMasterKey(pass1, salt);
        const verifier = await createPasswordVerifier(masterKey);

        // 3. Guardar Salt y Verifier en Firestore
        const { setDoc, doc } = window.firebaseModules;
        await setDoc(
          doc(
            window.firebaseModules.db,
            "users",
            user.uid,
            "system",
            "security"
          ),
          {
            salt: authService.bufferToBase64(salt),
            verifier: authService.bufferToBase64(verifier), // <--- NUEVO
            version: 2,
            createdAt: new Date().toISOString(),
          }
        );

        // 4. Inicializar en memoria
        await encryptionService.initialize(pass1, salt, user.uid, verifier);
        await authService.markVaultAsConfigured();

        this.close();
        if (this.onSuccess) this.onSuccess();
      } catch (error) {
        console.error(error);
        btn.disabled = false;
        btn.innerHTML = originalText;
        showError("Error: " + error.message);
      }
    });
  }

  close() {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
  }
}
