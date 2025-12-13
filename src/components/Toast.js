// src/components/Toast.js

export class ToastManager {
  constructor() {
    this.container = document.createElement("div");
    // Posición fija en la esquina superior derecha, sin bloquear clics en el resto de la página
    this.container.className =
      "fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none";
    document.body.appendChild(this.container);
  }

  /**
   * Muestra una notificación toast
   * @param {string|object} content - El mensaje de texto o un objeto de error
   * @param {string} type - 'success', 'error', 'info', 'warning'
   * @param {object} options - { duration: 3000, label: "Botón", onClick: fn }
   */
  show(content, type = "info", options = {}) {
    // --- 1. Sanitización del Mensaje (FIX del error ReferenceError) ---
    let messageText = "";

    if (typeof content === "string") {
      messageText = content;
    } else if (content && typeof content === "object") {
      // Si recibimos un objeto (ej: Error de Firebase), extraemos lo útil
      messageText =
        content.message || content.code || "Ocurrió un error desconocido";
      console.warn("⚠️ Toast recibió un objeto. Mostrando:", messageText);
    } else {
      messageText = "Notificación del sistema";
    }

    // --- 2. Configuración Visual ---
    const styles = {
      success: "bg-emerald-50 border-emerald-200 text-emerald-800",
      error: "bg-red-50 border-red-200 text-red-800",
      info: "bg-blue-50 border-blue-200 text-blue-800",
      warning: "bg-amber-50 border-amber-200 text-amber-800",
    };

    const icons = {
      success: '<i class="fas fa-check-circle text-emerald-500 text-xl"></i>',
      error: '<i class="fas fa-exclamation-circle text-red-500 text-xl"></i>',
      info: '<i class="fas fa-info-circle text-blue-500 text-xl"></i>',
      warning:
        '<i class="fas fa-exclamation-triangle text-amber-500 text-xl"></i>',
    };

    // --- 3. Crear el Elemento DOM ---
    const toastEl = document.createElement("div");
    // Clases base + animación + estilo específico
    toastEl.className = `
      ${styles[type] || styles.info} 
      border shadow-lg rounded-xl p-4 pr-10 min-w-[300px] max-w-md 
      flex items-start gap-4 pointer-events-auto 
      transform transition-all duration-300 translate-x-full opacity-0
    `;

    // Contenido HTML interno
    let actionHtml = "";
    if (options.label && options.onClick) {
      actionHtml = `
        <button class="mt-2 text-xs font-bold uppercase tracking-wider underline hover:opacity-80 transition-opacity js-toast-action">
          ${options.label}
        </button>
      `;
    }

    toastEl.innerHTML = `
      <div class="flex-shrink-0 mt-0.5">${icons[type] || icons.info}</div>
      <div class="flex-1">
        <p class="text-sm font-medium leading-relaxed">${messageText}</p>
        ${actionHtml}
      </div>
      <button class="absolute top-2 right-2 p-2 rounded-full hover:bg-black/5 transition-colors text-current opacity-50 hover:opacity-100 js-toast-close">
        <i class="fas fa-times text-xs"></i>
      </button>
    `;

    // --- 4. Eventos ---

    // Botón de acción (si existe)
    if (options.label && options.onClick) {
      const actionBtn = toastEl.querySelector(".js-toast-action");
      if (actionBtn) {
        actionBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          options.onClick();
          this.dismiss(toastEl);
        });
      }
    }

    // Botón cerrar (X)
    const closeBtn = toastEl.querySelector(".js-toast-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.dismiss(toastEl));
    }

    // Auto-cierre
    const duration = options.duration || 4000;
    if (duration > 0) {
      setTimeout(() => {
        // Solo cerrar si sigue en el DOM
        if (toastEl.isConnected) this.dismiss(toastEl);
      }, duration);
    }

    // --- 5. Mostrar en pantalla (Animación de entrada) ---
    this.container.appendChild(toastEl);

    // Pequeño delay para permitir que el navegador renderice antes de animar
    requestAnimationFrame(() => {
      toastEl.classList.remove("translate-x-full", "opacity-0");
    });
  }

  dismiss(element) {
    // Animación de salida
    element.classList.add("translate-x-full", "opacity-0");

    // Eliminar del DOM después de la transición CSS
    element.addEventListener("transitionend", () => {
      if (element.isConnected) element.remove();
    });
  }
}

export const toast = new ToastManager();
