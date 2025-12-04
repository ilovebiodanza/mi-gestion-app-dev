/**
 * Componente para solicitar contraseña cuando el cifrado no está inicializado
 */

export class PasswordPrompt {
  constructor(onPasswordSubmit, userEmail) {
    this.onPasswordSubmit = onPasswordSubmit;
    this.userEmail = userEmail;
    this.isSubmitting = false;
  }

  /**
   * Renderizar prompt de contraseña
   */
  render() {
    return `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
          <div class="text-center mb-6">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-shield-alt text-blue-600 text-2xl"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-800">Cifrado de Seguridad</h3>
            <p class="text-gray-600 mt-2">Ingresa tu contraseña para activar el cifrado</p>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <i class="fas fa-user mr-1"></i>
                Usuario
              </label>
              <input
                type="text"
                value="${this.userEmail}"
                disabled
                class="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <i class="fas fa-key mr-1"></i>
                Contraseña
              </label>
              <input
                type="password"
                id="encryptionPassword"
                placeholder="Ingresa tu contraseña"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                autocomplete="current-password"
              />
              <p class="text-xs text-gray-500 mt-1">
                Tu contraseña se usa solo para generar claves de cifrado localmente.
              </p>
            </div>
            
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 class="font-medium text-yellow-800 mb-2">
                <i class="fas fa-info-circle mr-1"></i>
                Importante
              </h4>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• Sin la contraseña correcta, no podrás acceder a tus datos cifrados</li>
                <li>• La contraseña nunca sale de tu dispositivo</li>
                <li>• Si la olvidas, perderás acceso a tus datos cifrados</li>
              </ul>
            </div>
            
            <div class="flex space-x-3 pt-2">
              <button
                id="cancelEncryption"
                class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Omitir por ahora
              </button>
              <button
                id="submitEncryptionPassword"
                class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center"
              >
                <span id="submitText">Activar Cifrado</span>
                <div id="submitSpinner" class="hidden ml-2">
                  <div class="spinner-small"></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style>
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .spinner-small {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
  }

  /**
   * Mostrar el prompt
   */
  show() {
    const overlay = document.createElement("div");
    overlay.id = "encryptionPromptOverlay";
    overlay.innerHTML = this.render();
    document.body.appendChild(overlay);

    this.setupEventListeners();
  }

  /**
   * Ocultar el prompt
   */
  hide() {
    const overlay = document.getElementById("encryptionPromptOverlay");
    if (overlay) {
      overlay.remove();
    }
  }

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    const passwordInput = document.getElementById("encryptionPassword");
    const submitBtn = document.getElementById("submitEncryptionPassword");
    const cancelBtn = document.getElementById("cancelEncryption");
    const submitText = document.getElementById("submitText");
    const submitSpinner = document.getElementById("submitSpinner");

    // Enviar contraseña
    submitBtn.addEventListener("click", async () => {
      if (this.isSubmitting) return;

      const password = passwordInput.value.trim();

      if (!password) {
        this.showError("Por favor ingresa tu contraseña");
        return;
      }

      this.isSubmitting = true;
      submitText.textContent = "Inicializando...";
      submitSpinner.classList.remove("hidden");
      submitBtn.disabled = true;

      try {
        // Llamar al callback con la contraseña
        const success = await this.onPasswordSubmit(password);

        if (success) {
          this.hide();
        } else {
          this.showError(
            "Contraseña incorrecta o error al inicializar cifrado"
          );
          this.resetForm();
        }
      } catch (error) {
        console.error("Error al inicializar cifrado:", error);
        this.showError(error.message || "Error al activar cifrado");
        this.resetForm();
      }
    });

    // Cancelar
    cancelBtn.addEventListener("click", () => {
      this.hide();
    });

    // Enter para enviar
    passwordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !this.isSubmitting) {
        submitBtn.click();
      }
    });

    // Cerrar al hacer clic fuera
    const overlay = document.getElementById("encryptionPromptOverlay");
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        this.hide();
      }
    });
  }

  /**
   * Mostrar error
   */
  showError(message) {
    // Eliminar errores anteriores
    this.clearErrors();

    const errorDiv = document.createElement("div");
    errorDiv.className =
      "bg-red-50 border border-red-200 rounded-lg p-3 mt-3 animate-fade-in";
    errorDiv.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-exclamation-circle text-red-500 mr-2"></i>
        <span class="text-red-700 text-sm">${message}</span>
      </div>
    `;

    const form = document.querySelector("#encryptionPromptOverlay .bg-white");
    if (form) {
      form.insertBefore(errorDiv, form.querySelector(".flex.space-x-3"));
    }
  }

  /**
   * Limpiar errores
   */
  clearErrors() {
    const errors = document.querySelectorAll(
      "#encryptionPromptOverlay .bg-red-50"
    );
    errors.forEach((error) => error.remove());
  }

  /**
   * Resetear formulario
   */
  resetForm() {
    this.isSubmitting = false;

    const submitText = document.getElementById("submitText");
    const submitSpinner = document.getElementById("submitSpinner");
    const submitBtn = document.getElementById("submitEncryptionPassword");

    if (submitText) submitText.textContent = "Activar Cifrado";
    if (submitSpinner) submitSpinner.classList.add("hidden");
    if (submitBtn) submitBtn.disabled = false;

    const passwordInput = document.getElementById("encryptionPassword");
    if (passwordInput) passwordInput.focus();
  }
}
