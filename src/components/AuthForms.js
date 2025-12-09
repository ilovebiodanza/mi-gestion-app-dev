// src/components/AuthForms.js
import { authService } from "../services/auth.js";

/**
 * Componente para formularios de autenticación (Diseño Limpio)
 */
export class AuthForms {
  constructor(onAuthSuccess) {
    this.onAuthSuccess = onAuthSuccess;
    this.currentForm = "login";
  }

  /**
   * Renderizar formulario de login
   */
  renderLoginForm() {
    return `
      <div class="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden p-8">
        <h2 class="text-2xl font-bold text-gray-800 text-center mb-6">Iniciar Sesión</h2>

        <form id="loginForm" class="space-y-5">
          <div>
            <label for="loginEmail" class="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="loginEmail"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="tu@ejemplo.com"
            />
          </div>

          <div>
            <div class="flex justify-between items-center mb-1">
              <label for="loginPassword" class="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <button type="button" id="forgotPasswordBtn" class="text-xs text-blue-600 hover:text-blue-800 font-medium">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <input
              type="password"
              id="loginPassword"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            class="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition font-medium shadow-sm"
          >
            Entrar
          </button>
        </form>

        <div class="mt-6 text-center pt-4 border-t border-gray-100">
          <p class="text-sm text-gray-600">
            ¿No tienes cuenta?
            <button id="switchToRegister" class="text-blue-600 hover:text-blue-800 font-medium ml-1">
              Regístrate gratis
            </button>
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar formulario de registro
   */
  renderRegisterForm() {
    return `
      <div class="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden p-8">
        <h2 class="text-2xl font-bold text-gray-800 text-center mb-6">Crear Cuenta</h2>

        <form id="registerForm" class="space-y-5">
          <div>
            <label for="registerEmail" class="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="registerEmail"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="tu@ejemplo.com"
            />
          </div>

          <div>
            <label for="registerPassword" class="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              id="registerPassword"
              required
              minlength="8"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label for="registerConfirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              id="registerConfirmPassword"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Repite tu contraseña"
            />
          </div>

          <div class="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <div class="flex">
              <i class="fas fa-info-circle text-blue-500 mt-0.5 mr-2"></i>
              <p class="text-xs text-blue-700">
                La contraseña cifrará tus datos. Si la olvidas, <strong>no podremos recuperarlos</strong>.
              </p>
            </div>
          </div>

          <button
            type="submit"
            class="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition font-medium shadow-sm"
          >
            Registrarse
          </button>
        </form>

        <div class="mt-6 text-center pt-4 border-t border-gray-100">
          <p class="text-sm text-gray-600">
            ¿Ya tienes cuenta?
            <button id="switchToLogin" class="text-blue-600 hover:text-blue-800 font-medium ml-1">
              Inicia sesión
            </button>
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar formulario de recuperación
   */
  renderForgotPasswordForm() {
    return `
      <div class="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden p-8">
        <h2 class="text-2xl font-bold text-gray-800 text-center mb-2">Recuperar Acceso</h2>
        <p class="text-gray-500 text-center text-sm mb-6">Te enviaremos un enlace para restablecer tu contraseña</p>

        <form id="forgotPasswordForm" class="space-y-5">
          <div>
            <label for="resetEmail" class="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="resetEmail"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="tu@ejemplo.com"
            />
          </div>

          <div class="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
            <div class="flex">
              <i class="fas fa-exclamation-triangle text-yellow-500 mt-0.5 mr-2"></i>
              <p class="text-xs text-yellow-700">
                Al cambiar la contraseña, perderás acceso a los datos cifrados anteriormente.
              </p>
            </div>
          </div>

          <div class="flex space-x-3">
            <button
              type="button"
              id="cancelReset"
              class="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
            >
              Enviar
            </button>
          </div>
        </form>
      </div>
    `;
  }

  // ... (render y setupEventListeners permanecen igual)
  render() {
    switch (this.currentForm) {
      case "login": return this.renderLoginForm();
      case "register": return this.renderRegisterForm();
      case "forgot": return this.renderForgotPasswordForm();
      default: return this.renderLoginForm();
    }
  }

  setupEventListeners(container) {
    this.setupRealTimeValidation(container);
    switch (this.currentForm) {
      case "login": this.setupLoginListeners(container); break;
      case "register": this.setupRegisterListeners(container); break;
      case "forgot": this.setupForgotPasswordListeners(container); break;
    }
  }

  setupLoginListeners(container) {
    const loginForm = container.querySelector("#loginForm");
    const switchToRegister = container.querySelector("#switchToRegister");
    const forgotPasswordBtn = container.querySelector("#forgotPasswordBtn");

    if (loginForm) loginForm.addEventListener("submit", this.handleLogin.bind(this));
    if (switchToRegister) {
      switchToRegister.addEventListener("click", () => {
        this.currentForm = "register";
        this.updateView(container);
      });
    }
    if (forgotPasswordBtn) {
      forgotPasswordBtn.addEventListener("click", () => {
        this.currentForm = "forgot";
        this.updateView(container);
      });
    }
  }

  setupRegisterListeners(container) {
    const registerForm = container.querySelector("#registerForm");
    const switchToLogin = container.querySelector("#switchToLogin");

    if (registerForm) registerForm.addEventListener("submit", this.handleRegister.bind(this));
    if (switchToLogin) {
      switchToLogin.addEventListener("click", () => {
        this.currentForm = "login";
        this.updateView(container);
      });
    }
  }

  setupForgotPasswordListeners(container) {
    const forgotPasswordForm = container.querySelector("#forgotPasswordForm");
    const cancelReset = container.querySelector("#cancelReset");

    if (forgotPasswordForm) forgotPasswordForm.addEventListener("submit", this.handleForgotPassword.bind(this));
    if (cancelReset) {
      cancelReset.addEventListener("click", () => {
        this.currentForm = "login";
        this.updateView(container);
      });
    }
  }

  /**
   * Manejar login (CON CORRECCIÓN DE ERROR)
   */
  async handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      this.showError("Por favor completa todos los campos");
      return;
    }

    this.showLoading(true);

    try {
      const result = await authService.login(email, password);

      if (result.success) {
        console.log("✅ Login exitoso:", result.user.email);
        
        // CORRECCIÓN: Usamos 'result.user', no 'userCredential'
        if (window.app && window.app.initializePostLogin) {
            window.app.initializePostLogin(result.user, password);
        }
      } else {
        this.showError(result.error || "Error en login");
        this.showLoading(false);
      }
    } catch (error) {
      console.error("Error en login:", error);
      this.showError("Error inesperado. Intenta nuevamente.");
      this.showLoading(false);
    }
  }

  /**
   * Manejar registro
   */
  async handleRegister(event) {
    event.preventDefault();

    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("registerConfirmPassword").value;

    if (!email || !password || !confirmPassword) {
      this.showError("Por favor completa todos los campos");
      return;
    }

    if (password !== confirmPassword) {
      this.showError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 8) {
      this.showError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    this.showLoading(true);

    try {
      const result = await authService.register(email, password);

      if (result.success) {
        console.log("✅ Registro exitoso:", result.user.email);
      } else {
        this.showError(result.error || "Error en registro");
        this.showLoading(false);
      }
    } catch (error) {
      console.error("Error en registro:", error);
      this.showError("Error inesperado. Intenta nuevamente.");
      this.showLoading(false);
    }
  }

  async handleForgotPassword(event) {
    event.preventDefault();
    const email = document.getElementById("resetEmail").value;

    if (!email) {
      this.showError("Por favor ingresa tu correo electrónico");
      return;
    }

    this.showLoading(true);

    try {
      const result = await authService.resetPassword(email);

      if (result.success) {
        this.showMessage(result.message, "success");
        setTimeout(() => {
          this.currentForm = "login";
          this.updateView(document.getElementById("authContainer"));
        }, 3000);
      } else {
        this.showError(result.error || "Error al enviar correo");
        this.showLoading(false);
      }
    } catch (error) {
      console.error("Error en recuperación:", error);
      this.showError("Error inesperado. Intenta nuevamente.");
      this.showLoading(false);
    }
  }

  updateView(container) {
    if (container) {
      container.innerHTML = this.render();
      this.setupEventListeners(container);
    }
  }

  showLoading(show) {
    const buttons = document.querySelectorAll('button[type="submit"]');
    const inputs = document.querySelectorAll("#authContainer input");

    buttons.forEach((button) => {
      if (show) {
        if (!button.dataset.originalText) button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<div class="spinner inline-block mr-2"></div> Procesando...';
        button.disabled = true;
        button.classList.add("opacity-70", "cursor-not-allowed");
      } else {
        if (button.dataset.originalText) {
          button.innerHTML = button.dataset.originalText;
          delete button.dataset.originalText;
        }
        button.disabled = false;
        button.classList.remove("opacity-70", "cursor-not-allowed");
      }
    });

    inputs.forEach((input) => {
      input.disabled = show;
      if (show) input.classList.add("bg-gray-50");
      else input.classList.remove("bg-gray-50");
    });
  }

  showError(message, duration = 5000) {
    this.clearMessages();
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message animate-fade-in mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r text-red-700 text-sm flex items-center";
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i> ${message}`;

    const container = document.querySelector("#authContainer form"); 
    // Insertamos antes del form para que se vea arriba
    if (container) {
      container.parentElement.insertBefore(errorDiv, container);
      if (duration > 0) setTimeout(() => errorDiv.remove(), duration);
    }
  }

  showMessage(message, type = "success", duration = 5000) {
    this.clearMessages();
    const colorClass = type === "success" ? "green" : "blue";
    const icon = type === "success" ? "fa-check-circle" : "fa-info-circle";
    
    const msgDiv = document.createElement("div");
    msgDiv.className = `success-message animate-fade-in mb-4 p-3 bg-${colorClass}-50 border-l-4 border-${colorClass}-500 rounded-r text-${colorClass}-700 text-sm flex items-center`;
    msgDiv.innerHTML = `<i class="fas ${icon} mr-2"></i> ${message}`;

    const container = document.querySelector("#authContainer form");
    if (container) {
      container.parentElement.insertBefore(msgDiv, container);
      if (duration > 0) setTimeout(() => msgDiv.remove(), duration);
    }
  }

  clearMessages() {
    document.querySelectorAll(".error-message, .success-message").forEach(el => el.remove());
  }

  setupRealTimeValidation(container) {
    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        input.classList.remove('border-red-500');
      });
    });
  }
}