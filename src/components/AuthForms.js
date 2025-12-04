/**
 * Componente para formularios de autenticación
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
      <div class="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8 space-y-6">
        <div class="text-center">
          <i class="fas fa-shield-alt text-4xl text-blue-500 mb-4"></i>
          <h2 class="text-2xl font-bold text-gray-800">Iniciar Sesión</h2>
          <p class="text-gray-600 mt-2">Accede a tu información segura</p>
        </div>

        <form id="loginForm" class="space-y-4">
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
            <label for="loginPassword" class="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              id="loginPassword"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="••••••••"
            />
          </div>

          <div class="flex items-center justify-between">
            <label class="flex items-center">
              <input type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
              <span class="ml-2 text-sm text-gray-600">Recordarme</span>
            </label>
            <button type="button" id="forgotPasswordBtn" class="text-sm text-blue-600 hover:text-blue-800">
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button
            type="submit"
            class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition font-medium"
          >
            <i class="fas fa-sign-in-alt mr-2"></i>
            Iniciar Sesión
          </button>
        </form>

        <div class="text-center">
          <p class="text-gray-600">
            ¿No tienes cuenta?
            <button id="switchToRegister" class="text-blue-600 hover:text-blue-800 font-medium ml-1">
              Regístrate aquí
            </button>
          </p>
        </div>

        <div class="text-center text-xs text-gray-500 mt-6">
          <i class="fas fa-lock mr-1"></i>
          Tus datos están cifrados de extremo a extremo
        </div>
      </div>
    `;
  }

  /**
   * Renderizar formulario de registro
   */
  renderRegisterForm() {
    return `
      <div class="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8 space-y-6">
        <div class="text-center">
          <i class="fas fa-user-plus text-4xl text-green-500 mb-4"></i>
          <h2 class="text-2xl font-bold text-gray-800">Crear Cuenta</h2>
          <p class="text-gray-600 mt-2">Comienza a proteger tu información</p>
        </div>

        <form id="registerForm" class="space-y-4">
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
            <p class="text-xs text-gray-500 mt-1">
              La contraseña se usa para cifrar tus datos. No la compartas.
            </p>
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

          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 class="font-medium text-blue-800 mb-2">
              <i class="fas fa-info-circle mr-1"></i>
              Importante sobre seguridad
            </h4>
            <ul class="text-sm text-blue-700 space-y-1">
              <li>• Tus datos se cifran con tu contraseña</li>
              <li>• Nunca almacenamos tu contraseña</li>
              <li>• Si la olvidas, no podemos recuperar tus datos</li>
              <li>• Considera usar un gestor de contraseñas</li>
            </ul>
          </div>

          <button
            type="submit"
            class="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition font-medium"
          >
            <i class="fas fa-user-check mr-2"></i>
            Crear Cuenta
          </button>
        </form>

        <div class="text-center">
          <p class="text-gray-600">
            ¿Ya tienes cuenta?
            <button id="switchToLogin" class="text-blue-600 hover:text-blue-800 font-medium ml-1">
              Inicia sesión aquí
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
      <div class="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8 space-y-6">
        <div class="text-center">
          <i class="fas fa-key text-4xl text-orange-500 mb-4"></i>
          <h2 class="text-2xl font-bold text-gray-800">Recuperar Contraseña</h2>
          <p class="text-gray-600 mt-2">Te enviaremos un correo para restablecerla</p>
        </div>

        <form id="forgotPasswordForm" class="space-y-4">
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

          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 class="font-medium text-yellow-800 mb-2">
              <i class="fas fa-exclamation-triangle mr-1"></i>
              ¡Atención!
            </h4>
            <p class="text-sm text-yellow-700">
              Al restablecer la contraseña, tus datos cifrados no podrán ser accedidos 
              hasta que los re-encriptes con la nueva contraseña.
            </p>
          </div>

          <div class="flex space-x-3">
            <button
              type="button"
              id="cancelReset"
              class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition font-medium"
            >
              <i class="fas fa-paper-plane mr-2"></i>
              Enviar Correo
            </button>
          </div>
        </form>
      </div>
    `;
  }

  /**
   * Renderizar formulario actual
   */
  render() {
    switch (this.currentForm) {
      case "login":
        return this.renderLoginForm();
      case "register":
        return this.renderRegisterForm();
      case "forgot":
        return this.renderForgotPasswordForm();
      default:
        return this.renderLoginForm();
    }
  }

  /**
   * Configurar event listeners
   */
  setupEventListeners(container) {
    // Limpiar listeners anteriores
    this.removeEventListeners();

    // Agregar nuevos listeners según el formulario actual
    switch (this.currentForm) {
      case "login":
        this.setupLoginListeners(container);
        break;
      case "register":
        this.setupRegisterListeners(container);
        break;
      case "forgot":
        this.setupForgotPasswordListeners(container);
        break;
    }
  }

  /**
   * Configurar listeners para login
   */
  setupLoginListeners(container) {
    const loginForm = container.querySelector("#loginForm");
    const switchToRegister = container.querySelector("#switchToRegister");
    const forgotPasswordBtn = container.querySelector("#forgotPasswordBtn");

    if (loginForm) {
      loginForm.addEventListener("submit", this.handleLogin.bind(this));
    }

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

  /**
   * Configurar listeners para registro
   */
  setupRegisterListeners(container) {
    const registerForm = container.querySelector("#registerForm");
    const switchToLogin = container.querySelector("#switchToLogin");

    if (registerForm) {
      registerForm.addEventListener("submit", this.handleRegister.bind(this));
    }

    if (switchToLogin) {
      switchToLogin.addEventListener("click", () => {
        this.currentForm = "login";
        this.updateView(container);
      });
    }
  }

  /**
   * Configurar listeners para recuperación
   */
  setupForgotPasswordListeners(container) {
    const forgotPasswordForm = container.querySelector("#forgotPasswordForm");
    const cancelReset = container.querySelector("#cancelReset");

    if (forgotPasswordForm) {
      forgotPasswordForm.addEventListener(
        "submit",
        this.handleForgotPassword.bind(this)
      );
    }

    if (cancelReset) {
      cancelReset.addEventListener("click", () => {
        this.currentForm = "login";
        this.updateView(container);
      });
    }
  }

  /**
   * Manejar login
   */
  async handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    // Aquí se integrará con authService
    console.log("Login attempt:", { email, password });

    // Simulación temporal
    this.showLoading(true);
    setTimeout(() => {
      this.showLoading(false);
      if (this.onAuthSuccess) {
        this.onAuthSuccess({ email });
      }
    }, 1500);
  }

  /**
   * Manejar registro
   */
  async handleRegister(event) {
    event.preventDefault();

    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById(
      "registerConfirmPassword"
    ).value;

    if (password !== confirmPassword) {
      this.showError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 8) {
      this.showError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    console.log("Register attempt:", { email, password });

    // Simulación temporal
    this.showLoading(true);
    setTimeout(() => {
      this.showLoading(false);
      if (this.onAuthSuccess) {
        this.onAuthSuccess({ email });
      }
    }, 1500);
  }

  /**
   * Manejar recuperación de contraseña
   */
  async handleForgotPassword(event) {
    event.preventDefault();

    const email = document.getElementById("resetEmail").value;

    console.log("Password reset requested for:", email);

    // Simulación temporal
    this.showLoading(true);
    setTimeout(() => {
      this.showLoading(false);
      this.showMessage(
        "Correo enviado. Revisa tu bandeja de entrada.",
        "success"
      );
      setTimeout(() => {
        this.currentForm = "login";
        this.updateView(document.getElementById("authContainer"));
      }, 2000);
    }, 1500);
  }

  /**
   * Actualizar vista
   */
  updateView(container) {
    if (container) {
      container.innerHTML = this.render();
      this.setupEventListeners(container);
    }
  }

  /**
   * Mostrar/ocultar loading
   */
  showLoading(show) {
    const buttons = document.querySelectorAll('button[type="submit"]');
    buttons.forEach((button) => {
      if (show) {
        button.innerHTML =
          '<i class="fas fa-spinner fa-spin mr-2"></i> Procesando...';
        button.disabled = true;
      } else {
        // Restaurar texto original según el formulario
        this.restoreButtonText(button);
      }
    });
  }

  /**
   * Restaurar texto del botón
   */
  restoreButtonText(button) {
    button.disabled = false;

    if (this.currentForm === "login") {
      button.innerHTML =
        '<i class="fas fa-sign-in-alt mr-2"></i> Iniciar Sesión';
    } else if (this.currentForm === "register") {
      button.innerHTML = '<i class="fas fa-user-check mr-2"></i> Crear Cuenta';
    } else if (this.currentForm === "forgot") {
      button.innerHTML =
        '<i class="fas fa-paper-plane mr-2"></i> Enviar Correo';
    }
  }

  /**
   * Mostrar error
   */
  showError(message) {
    // Implementar toast de error
    alert(`Error: ${message}`);
  }

  /**
   * Mostrar mensaje
   */
  showMessage(message, type = "info") {
    // Implementar toast
    alert(`${type.toUpperCase()}: ${message}`);
  }

  /**
   * Remover event listeners
   */
  removeEventListeners() {
    // Se pueden implementar tracking de listeners si es necesario
  }
}
