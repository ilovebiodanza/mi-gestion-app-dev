import { authService } from "../services/auth.js";

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

    // Configurar validación en tiempo real
    this.setupRealTimeValidation(container);

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

    // Validaciones básicas
    if (!email || !password) {
      this.showError("Por favor completa todos los campos");
      return;
    }

    this.showLoading(true);

    try {
      const result = await authService.login(email, password);

      if (result.success) {
        console.log("✅ Login exitoso:", result.user.email);
        // El listener de authService manejará la transición al dashboard
        if (window.app && window.app.initializePostLogin) {
          window.app.initializePostLogin(result.user, password);
        }
      } else {
        // MOSTRAR ERROR EN UI
        this.showError(result.error || "Error en login");
        this.showLoading(false);
      }
    } catch (error) {
      console.error("Error en login:", error);
      // MOSTRAR ERROR EN UI
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
    const confirmPassword = document.getElementById(
      "registerConfirmPassword"
    ).value;

    // Validaciones
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
        // El listener de authService manejará la transición
      } else {
        // MOSTRAR ERROR EN UI
        this.showError(result.error || "Error en registro");
        this.showLoading(false);
      }
    } catch (error) {
      console.error("Error en registro:", error);
      // MOSTRAR ERROR EN UI
      this.showError("Error inesperado. Intenta nuevamente.");
      this.showLoading(false);
    }
  }

  /**
   * Manejar recuperación de contraseña
   */
  async handleForgotPassword(event) {
    event.preventDefault();

    const email = document.getElementById("resetEmail").value;

    if (!email) {
      this.showError("Por favor ingresa tu correo electrónico");
      return;
    }

    // Validar formato de email simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showError("Por favor ingresa un correo electrónico válido");
      return;
    }

    this.showLoading(true);

    try {
      const result = await authService.resetPassword(email);

      if (result.success) {
        this.showMessage(result.message, "success");
        // Volver al formulario de login después de 3 segundos
        setTimeout(() => {
          this.currentForm = "login";
          this.updateView(document.getElementById("authContainer"));
        }, 3000);
      } else {
        // MOSTRAR ERROR EN UI
        this.showError(
          result.error || "Error al enviar correo de recuperación"
        );
        this.showLoading(false);
      }
    } catch (error) {
      console.error("Error en recuperación:", error);
      // MOSTRAR ERROR EN UI
      this.showError("Error inesperado. Intenta nuevamente.");
      this.showLoading(false);
    }
  }

  /**
   * Manejar recuperación de contraseña
   */
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
        // Volver al formulario de login después de 2 segundos
        setTimeout(() => {
          this.currentForm = "login";
          this.updateView(document.getElementById("authContainer"));
        }, 2000);
      } else {
        this.showError(result.error);
        this.showLoading(false);
      }
    } catch (error) {
      console.error("Error en recuperación:", error);
      this.showError("Error inesperado. Intenta nuevamente.");
      this.showLoading(false);
    }
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
    const allButtons = document.querySelectorAll("#authContainer button");

    buttons.forEach((button) => {
      if (show) {
        // Guardar texto original si no está guardado
        if (!button.dataset.originalText) {
          button.dataset.originalText = button.innerHTML;
        }

        // Mostrar spinner y texto de carga
        const spinner = '<div class="spinner inline-block mr-2"></div>';
        button.innerHTML = spinner + " Procesando...";
        button.disabled = true;
        button.classList.add("opacity-50", "cursor-not-allowed");
      } else {
        // Restaurar texto original
        if (button.dataset.originalText) {
          button.innerHTML = button.dataset.originalText;
          delete button.dataset.originalText;
        }
        button.disabled = false;
        button.classList.remove("opacity-50", "cursor-not-allowed");
      }
    });

    // También deshabilitar inputs durante loading
    const inputs = document.querySelectorAll("#authContainer input");
    inputs.forEach((input) => {
      input.disabled = show;
      if (show) {
        input.classList.add("opacity-50", "cursor-not-allowed");
      } else {
        input.classList.remove("opacity-50", "cursor-not-allowed");
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
   * Mostrar error en la interfaz
   */
  showError(message, duration = 5000) {
    // Limpiar mensajes anteriores
    this.clearMessages();

    // Crear elemento de error
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message animate-fade-in";
    errorDiv.innerHTML = `
    <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-lg">
      <div class="flex">
        <div class="flex-shrink-0">
          <i class="fas fa-exclamation-circle text-red-400 text-lg"></i>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-red-800">${message}</p>
          <p class="text-xs text-red-600 mt-1">Por favor, verifica la información e intenta nuevamente.</p>
        </div>
        <div class="ml-auto pl-3">
          <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                  class="text-red-500 hover:text-red-700 focus:outline-none">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  `;

    // Agregar al DOM
    const container = document.querySelector("#authContainer");
    if (container) {
      // Insertar al principio del contenedor
      container.insertBefore(errorDiv, container.firstChild);

      // Auto-eliminar después del tiempo especificado
      if (duration > 0) {
        setTimeout(() => {
          if (errorDiv.parentNode) {
            errorDiv.remove();
          }
        }, duration);
      }

      // Hacer scroll suave hacia el error
      errorDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  /**
   * Mostrar mensaje de éxito
   */
  showMessage(message, type = "success", duration = 5000) {
    this.clearMessages();

    const icon = type === "success" ? "fa-check-circle" : "fa-info-circle";
    const colorClass = type === "success" ? "green" : "blue";
    const borderColor =
      type === "success" ? "border-green-500" : "border-blue-500";
    const textColor = type === "success" ? "text-green-800" : "text-blue-800";
    const iconColor = type === "success" ? "text-green-400" : "text-blue-400";

    const messageDiv = document.createElement("div");
    messageDiv.className = "success-message animate-fade-in";
    messageDiv.innerHTML = `
    <div class="bg-${colorClass}-50 border-l-4 ${borderColor} p-4 mb-4 rounded-r-lg">
      <div class="flex">
        <div class="flex-shrink-0">
          <i class="fas ${icon} ${iconColor} text-lg"></i>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium ${textColor}">${message}</p>
        </div>
        <div class="ml-auto pl-3">
          <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                  class="text-${colorClass}-500 hover:text-${colorClass}-700 focus:outline-none">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  `;

    const container = document.querySelector("#authContainer");
    if (container) {
      container.insertBefore(messageDiv, container.firstChild);

      if (duration > 0) {
        setTimeout(() => {
          if (messageDiv.parentNode) {
            messageDiv.remove();
          }
        }, duration);
      }
    }
  }

  /**
   * Limpiar todos los mensajes
   */
  clearMessages() {
    const messages = document.querySelectorAll(
      ".error-message, .success-message"
    );
    messages.forEach((msg) => {
      // Solo remover si tiene la clase de animación
      if (msg.classList.contains("animate-fade-in")) {
        msg.remove();
      }
    });
  }

  /**
   * Remover event listeners
   */
  removeEventListeners() {
    // Se pueden implementar tracking de listeners si es necesario
  }

  /**
   * Configurar validación en tiempo real
   */
  setupRealTimeValidation(container) {
    const emailInputs = container.querySelectorAll('input[type="email"]');
    const passwordInputs = container.querySelectorAll('input[type="password"]');

    // Validar email en tiempo real
    emailInputs.forEach((input) => {
      input.addEventListener("blur", () => {
        this.validateEmail(input);
      });

      input.addEventListener("input", () => {
        this.clearInputError(input);
      });
    });

    // Validar password en tiempo real
    passwordInputs.forEach((input) => {
      input.addEventListener("blur", () => {
        this.validatePassword(input);
      });

      input.addEventListener("input", () => {
        this.clearInputError(input);
      });
    });
  }

  /**
   * Validar email
   */
  validateEmail(input) {
    const email = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email && !emailRegex.test(email)) {
      this.showInputError(input, "Correo electrónico no válido");
      return false;
    }

    this.clearInputError(input);
    return true;
  }

  /**
   * Validar password
   */
  validatePassword(input) {
    const password = input.value;

    if (password && password.length < 8) {
      this.showInputError(input, "Mínimo 8 caracteres");
      return false;
    }

    this.clearInputError(input);
    return true;
  }

  /**
   * Mostrar error en input específico
   */
  showInputError(input, message) {
    // Limpiar error anterior
    this.clearInputError(input);

    // Agregar clase de error
    input.classList.add("input-error");

    // Crear elemento de error
    const errorDiv = document.createElement("div");
    errorDiv.className = "text-red-600 text-xs mt-1 ml-1";
    errorDiv.id = `error-${input.id}`;
    errorDiv.textContent = message;

    // Insertar después del input
    input.parentNode.appendChild(errorDiv);
  }

  /**
   * Limpiar error de input
   */
  clearInputError(input) {
    input.classList.remove("input-error");

    const errorDiv = input.parentNode.querySelector(`#error-${input.id}`);
    if (errorDiv) {
      errorDiv.remove();
    }
  }
}
