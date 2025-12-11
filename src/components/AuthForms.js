import { authService } from "../services/auth.js";

export class AuthForms {
  constructor(onLoginSuccess) {
    this.onLoginSuccess = onLoginSuccess;
    this.isLoginMode = true; // Estado para alternar vistas
  }

  updateView(container) {
    container.innerHTML = this.render();
    this.setupEventListeners(container);
  }

  render() {
    return `
      <div class="flex p-1 mb-8 bg-slate-100 rounded-xl relative">
        <div class="w-1/2 h-full absolute top-0 bottom-0 rounded-lg bg-white shadow-sm transition-all duration-300 ease-out" 
             style="left: ${
               this.isLoginMode ? "4px" : "calc(50% - 4px)"
             }; width: calc(50%); top: 4px; bottom: 4px;"></div>
        
        <button id="tabLogin" class="flex-1 relative z-10 py-2 text-sm font-medium transition-colors ${
          this.isLoginMode
            ? "text-primary"
            : "text-slate-500 hover:text-slate-700"
        }">
          Iniciar Sesión
        </button>
        <button id="tabRegister" class="flex-1 relative z-10 py-2 text-sm font-medium transition-colors ${
          !this.isLoginMode
            ? "text-primary"
            : "text-slate-500 hover:text-slate-700"
        }">
          Registrarse
        </button>
      </div>

      <form id="authForm" class="space-y-5">
        <div class="space-y-4">
          <div class="group">
            <label class="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Correo Electrónico</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="fas fa-envelope text-slate-400 group-focus-within:text-primary transition-colors"></i>
              </div>
              <input type="email" id="email" required 
                class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none text-slate-700 placeholder-slate-400"
                placeholder="tu@email.com">
            </div>
          </div>

          <div class="group">
            <label class="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Contraseña</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="fas fa-lock text-slate-400 group-focus-within:text-secondary transition-colors"></i>
              </div>
              <input type="password" id="password" required 
                class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all outline-none text-slate-700 placeholder-slate-400"
                placeholder="••••••••">
            </div>
          </div>
        </div>

        <div id="errorMessage" class="hidden flex items-start gap-3 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
           <i class="fas fa-exclamation-circle mt-0.5"></i>
           <span id="errorText">Error</span>
        </div>

        <button type="submit" 
          class="w-full py-3.5 px-4 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transform transition-all active:scale-[0.98] flex justify-center items-center gap-2">
          <span>${
            this.isLoginMode ? "Acceder a mi Bóveda" : "Crear Cuenta Segura"
          }</span>
          <i class="fas fa-arrow-right text-sm opacity-80"></i>
        </button>
        
        ${
          this.isLoginMode
            ? `
          <div class="text-center mt-4">
            <a href="#" id="forgotPassword" class="text-sm text-slate-500 hover:text-primary transition-colors font-medium">¿Olvidaste tu contraseña?</a>
          </div>`
            : ""
        }
      </form>
    `;
  }

  setupEventListeners(container) {
    const form = container.querySelector("#authForm");
    const errorMsg = container.querySelector("#errorMessage");
    const errorText = container.querySelector("#errorText");
    const tabLogin = container.querySelector("#tabLogin");
    const tabRegister = container.querySelector("#tabRegister");

    // Lógica de Tabs
    const switchMode = (isLogin) => {
      this.isLoginMode = isLogin;
      this.updateView(container); // Re-render completo para actualizar UI
    };

    tabLogin?.addEventListener("click", () => switchMode(true));
    tabRegister?.addEventListener("click", () => switchMode(false));

    // Lógica de Submit
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = form.email.value;
      const password = form.password.value;

      // Estado de carga en el botón
      const btn = form.querySelector('button[type="submit"]');
      const originalContent = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Procesando...`;
      errorMsg.classList.add("hidden");

      try {
        if (this.isLoginMode) {
          await authService.login(email, password);
        } else {
          await authService.register(email, password);
        }
        this.onLoginSuccess();
      } catch (error) {
        errorText.textContent = this.mapFirebaseError(error.code);
        errorMsg.classList.remove("hidden");
        // Animación de "shake" para el error
        errorMsg.classList.add("animate-pulse");
        btn.disabled = false;
        btn.innerHTML = originalContent;
      }
    });

    container
      .querySelector("#forgotPassword")
      ?.addEventListener("click", (e) => {
        e.preventDefault();
        const email = container.querySelector("#email").value;
        if (!email) {
          errorText.textContent =
            "Ingresa tu correo arriba para recuperar la contraseña.";
          errorMsg.classList.remove("hidden");
          return;
        }
        authService
          .resetPassword(email)
          .then(() => alert("Se ha enviado un correo de recuperación."))
          .catch((err) => alert(err.message));
      });
  }

  mapFirebaseError(code) {
    switch (code) {
      case "auth/invalid-email":
        return "El correo electrónico no es válido.";
      case "auth/user-disabled":
        return "Este usuario ha sido deshabilitado.";
      case "auth/user-not-found":
        return "No existe una cuenta con este correo.";
      case "auth/wrong-password":
        return "Contraseña incorrecta.";
      case "auth/email-already-in-use":
        return "El correo ya está registrado.";
      case "auth/weak-password":
        return "La contraseña debe tener al menos 6 caracteres.";
      default:
        return "Ocurrió un error inesperado. Intenta nuevamente.";
    }
  }
}
