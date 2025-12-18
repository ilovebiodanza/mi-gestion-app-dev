import { authService } from "../services/auth.js";

export class AuthForms {
  constructor(onLoginSuccess, onError) {
    this.onLoginSuccess = onLoginSuccess;
    this.onError = onError;
    this.isLoginMode = true;
  }

  updateView(container) {
    // Limpiamos clases residuales del contenedor padre si las hubiera
    container.className = "w-full max-w-md mx-auto";
    container.innerHTML = this.render();
    this.setupEventListeners(container);
  }

  render() {
    return `
      <div class="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden animate-slide-up">
        <div class="px-8 pt-8 pb-6 text-center border-b border-slate-50">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 text-brand-600 mb-4">
            <i class="fas fa-shield-alt text-xl"></i>
          </div>
          <h2 class="text-2xl font-bold text-slate-900 tracking-tight">
            ${this.isLoginMode ? "Bienvenido de nuevo" : "Crear Bóveda"}
          </h2>
          <p class="mt-2 text-sm text-slate-500">
            ${
              this.isLoginMode
                ? "Ingresa tus credenciales para desencriptar."
                : "Configura tu espacio seguro E2EE."
            }
          </p>
        </div>

        <div class="flex p-2 bg-slate-50/50 mx-6 mt-6 rounded-lg border border-slate-100">
          <button id="tabLogin" class="flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
            this.isLoginMode
              ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
              : "text-slate-500 hover:text-slate-700"
          }">
            Ingresar
          </button>
          <button id="tabRegister" class="flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
            !this.isLoginMode
              ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
              : "text-slate-500 hover:text-slate-700"
          }">
            Registrarse
          </button>
        </div>

        <div class="p-8">
          <form id="authForm" class="space-y-5">
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Correo Electrónico
                </label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i class="fas fa-envelope text-slate-400 group-focus-within:text-brand-500 transition-colors"></i>
                  </div>
                  <input type="email" id="email" required 
                    class="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all sm:text-sm"
                    placeholder="nombre@empresa.com">
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Contraseña maestra
                  </label>
                  ${
                    this.isLoginMode
                      ? `
                    <a href="#" id="forgotPassword" class="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline">
                      ¿Olvidaste?
                    </a>
                  `
                      : ""
                  }
                </div>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i class="fas fa-lock text-slate-400"></i>
                  </div>
                  <input type="password" id="password" required 
                                    class="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all sm:text-sm"
                                    placeholder="••••••••••••">
                  <button type="button" id="togglePassword" class="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-slate-400 hover:text-brand-600 transition-colors focus:outline-none">
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
                <div id="password-requirements" class="mt-3 space-y-1.5 hidden transition-all duration-300 pl-1">
                    <p class="text-xs text-slate-500 flex items-center gap-2 transition-colors duration-300" data-req="length">
                        <i class="fas fa-lock-open text-red-400 text-[10px] w-3 text-center"></i> 
                        <span>Mínimo 8 caracteres</span>
                    </p>
                    <p class="text-xs text-slate-500 flex items-center gap-2 transition-colors duration-300" data-req="upper">
                        <i class="fas fa-lock-open text-red-400 text-[10px] w-3 text-center"></i> 
                        <span>Una mayúscula</span>
                    </p>
                    <p class="text-xs text-slate-500 flex items-center gap-2 transition-colors duration-300" data-req="lower">
                        <i class="fas fa-lock-open text-red-400 text-[10px] w-3 text-center"></i> 
                        <span>Una minúscula</span>
                    </p>
                    <p class="text-xs text-slate-500 flex items-center gap-2 transition-colors duration-300" data-req="number">
                        <i class="fas fa-lock-open text-red-400 text-[10px] w-3 text-center"></i> 
                        <span>Un número</span>
                    </p>
                    <p class="text-xs text-slate-500 flex items-center gap-2 transition-colors duration-300" data-req="symbol">
                        <i class="fas fa-lock-open text-red-400 text-[10px] w-3 text-center"></i> 
                        <span>Un carácter especial (!@#$%)</span>
                    </p>
                </div>
                ${
                  !this.isLoginMode
                    ? `
                  <p class="mt-2 text-xs text-slate-500">
                    <i class="fas fa-info-circle mr-1"></i> 
                    Esta contraseña encriptará tus datos. No la pierdas.
                  </p>
                `
                    : ""
                }
              </div>
            </div>

            <button type="submit" 
              class="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-6">
              <span>${
                this.isLoginMode ? "Acceder a Bóveda" : "Crear Cuenta"
              }</span>
              <i class="fas fa-arrow-right ml-2 text-xs opacity-70"></i>
            </button>
          </form>
        </div>

        <div class="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2">
          <i class="fas fa-shield-halved text-emerald-500 text-xs"></i>
          <span class="text-xs font-medium text-slate-500">Cifrado de extremo a extremo activo</span>
        </div>
      </div>
    `;
  }

  setupEventListeners(container) {
    const form = container.querySelector("#authForm");
    const tabLogin = container.querySelector("#tabLogin");
    const tabRegister = container.querySelector("#tabRegister");
    const forgotPwd = container.querySelector("#forgotPassword");

    // Elementos nuevos para validación y UI
    const passwordInput = container.querySelector("#password");
    const toggleBtn = container.querySelector("#togglePassword"); // Botón del ojo
    const requirementsList = container.querySelector("#password-requirements");
    const submitBtn = form.querySelector('button[type="submit"]');

    // --- 1. Cambio de Modo (Login / Registro) ---
    const switchMode = (isLogin) => {
      this.isLoginMode = isLogin;
      this.updateView(container);
    };

    if (tabLogin) tabLogin.onclick = () => switchMode(true);
    if (tabRegister) tabRegister.onclick = () => switchMode(false);

    // --- 2. Funcionalidad "Ver Contraseña" (Ojito) ---
    if (toggleBtn && passwordInput) {
      toggleBtn.onclick = () => {
        const type =
          passwordInput.getAttribute("type") === "password"
            ? "text"
            : "password";
        passwordInput.setAttribute("type", type);

        const icon = toggleBtn.querySelector("i");
        icon.classList.toggle("fa-eye");
        icon.classList.toggle("fa-eye-slash");
      };
    }

    // --- 3. Lógica de Validación de Contraseña (Candados) ---
    const validatePassword = (password) => {
      // Si es Login, no validamos complejidad y habilitamos botón
      if (this.isLoginMode) {
        if (submitBtn) submitBtn.disabled = false;
        return true;
      }

      const requirements = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      };

      let allValid = true;

      // Actualizar UI de cada requisito
      if (requirementsList) {
        for (const [key, isValid] of Object.entries(requirements)) {
          const el = requirementsList.querySelector(`[data-req="${key}"]`);
          if (!el) continue;

          const icon = el.querySelector("i");

          if (isValid) {
            // CUMPLIDO: Texto verde, Candado cerrado verde
            el.classList.remove("text-slate-500");
            el.classList.add("text-emerald-600", "font-medium");
            icon.className =
              "fas fa-lock text-emerald-500 text-[10px] w-3 text-center transition-all duration-300 transform scale-110";
          } else {
            // NO CUMPLIDO: Texto gris, Candado abierto rojo
            el.classList.add("text-slate-500");
            el.classList.remove("text-emerald-600", "font-medium");
            icon.className =
              "fas fa-lock-open text-red-400 text-[10px] w-3 text-center transition-all duration-300";
            allValid = false;
          }
        }
      }

      // Bloquear/Desbloquear botón de registro
      if (submitBtn) {
        submitBtn.disabled = !allValid;
        submitBtn.classList.toggle("opacity-50", !allValid);
        submitBtn.classList.toggle("cursor-not-allowed", !allValid);
      }

      return allValid;
    };

    // --- 4. Listeners de Input y Visibilidad ---

    // Controlar visibilidad de la lista de requisitos
    if (requirementsList) {
      if (this.isLoginMode) {
        requirementsList.classList.add("hidden");
      } else {
        requirementsList.classList.remove("hidden");
        // Validar estado inicial al entrar en registro
        if (passwordInput) validatePassword(passwordInput.value);
      }
    }

    // Escuchar cambios en el input password
    if (passwordInput) {
      passwordInput.addEventListener("input", (e) => {
        validatePassword(e.target.value);
      });
    }

    // --- 5. Envío del Formulario (Submit) ---
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = form.email.value;
      const password = form.password.value;
      const btn = form.querySelector('button[type="submit"]');
      const originalContent = btn.innerHTML;

      btn.disabled = true;
      btn.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Procesando...`;

      try {
        if (this.isLoginMode) {
          await authService.login(email, password);
          this.onLoginSuccess();
        } else {
          const result = await authService.register(email, password);
          if (result.requiresVerification) {
            btn.disabled = false;
            btn.innerHTML = originalContent;
            switchMode(true);
            alert(`Verifica tu correo enviado a ${email}`);
            form.reset();
            return;
          }
          this.onLoginSuccess();
        }
      } catch (error) {
        btn.disabled = false;
        btn.innerHTML = originalContent;
        if (this.onError) this.onError(error);
        else alert(error.message);
      }
    });

    // --- 6. Recuperar Contraseña ---
    if (forgotPwd) {
      forgotPwd.onclick = (e) => {
        e.preventDefault();
        const email = container.querySelector("#email").value;
        if (!email) {
          if (this.onError)
            this.onError({
              message: "Ingresa tu correo para recuperar la contraseña",
            });
          else alert("Ingresa tu correo primero");
          return;
        }
        authService
          .resetPassword(email)
          .then(() => alert("Correo de recuperación enviado"))
          .catch((err) =>
            this.onError ? this.onError(err) : alert(err.message)
          );
      };
    }
  }
}
