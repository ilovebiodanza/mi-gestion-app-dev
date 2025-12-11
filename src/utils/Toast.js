// Toast.js
import { getFriendlyErrorMessage } from "./authErrors.js";

export class ToastManager {
  constructor() {
    this.container = document.createElement("div");
    // Agregamos pointer-events-none al contenedor para que no bloquee clicks en el resto de la web
    // pero pointer-events-auto a los hijos para permitir clicks en el Toast.
    this.container.className =
      "fixed top-5 right-5 z-50 flex flex-col gap-3 pointer-events-none";
    document.body.appendChild(this.container);
  }

  /**
   * @param {string} codeOrMessage - Código de error o mensaje
   * @param {string} type - 'error' | 'success' | 'info'
   * @param {Object|null} action - Opcional: { label: 'Texto', onClick: () => void }
   */
  show(codeOrMessage, type = "error", action = null) {
    const message = codeOrMessage.startsWith("auth/")
      ? getFriendlyErrorMessage(codeOrMessage)
      : codeOrMessage;

    const styles = {
      error: "bg-red-50 border-l-4 border-red-500 text-red-700",
      success: "bg-green-50 border-l-4 border-green-500 text-green-700",
      info: "bg-blue-50 border-l-4 border-blue-500 text-blue-700",
    };

    const toast = document.createElement("div");
    // pointer-events-auto es vital aquí para poder clickear el enlace
    toast.className = `${styles[type]} shadow-lg rounded-md p-4 flex flex-col gap-2 transform transition-all duration-300 translate-x-full opacity-0 pointer-events-auto min-w-[300px] max-w-md`;

    // HTML Base
    let htmlContent = `
      <div class="flex items-center justify-between">
        <span class="font-medium text-sm flex-1 mr-2">${message}</span>
        <button class="text-opacity-50 hover:text-opacity-100 focus:outline-none font-bold text-lg leading-none" data-close>
          &times;
        </button>
      </div>
    `;

    // Si hay una acción, agregamos el botón/enlace debajo del mensaje
    if (action) {
      htmlContent += `
        <div class="flex justify-end mt-1">
          <button id="toast-action-btn" class="text-xs font-bold uppercase tracking-wide underline hover:no-underline focus:outline-none transition-colors">
            ${action.label} &rarr;
          </button>
        </div>
      `;
    }

    toast.innerHTML = htmlContent;
    this.container.appendChild(toast);

    // Event Listeners
    toast
      .querySelector("[data-close]")
      .addEventListener("click", () => this.remove(toast));

    if (action) {
      const actionBtn = toast.querySelector("#toast-action-btn");
      actionBtn.addEventListener("click", () => {
        action.onClick();
        this.remove(toast);
      });
    }

    // Animación de entrada
    requestAnimationFrame(() => {
      toast.classList.remove("translate-x-full", "opacity-0");
    });

    // Auto-eliminar: Si hay acción, damos más tiempo (8s), si no, lo normal (4s)
    const duration = action ? 8000 : 4000;
    setTimeout(() => this.remove(toast), duration);
  }

  remove(element) {
    if (!element) return;
    element.classList.add("translate-x-full", "opacity-0");
    element.addEventListener("transitionend", () => element.remove(), {
      once: true,
    });
  }
}

export const toast = new ToastManager();
