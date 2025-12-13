// src/components/common/MediaPlayer.js

export class MediaPlayer {
  constructor() {
    // Identificadores para el Widget (Audio - Esquina inferior)
    this.widgetId = "global-media-player";
    this.widgetContentId = "global-player-content";
    this.widgetTitleId = "global-player-title";

    // Identificadores para el Modal (Imagen - Centrado)
    this.modalId = "global-image-modal";
    this.modalContentId = "global-modal-content";
    this.modalTitleId = "global-modal-title";

    this.isRendered = false;
  }

  // Inyecta el HTML base en el DOM (solo una vez)
  renderBase() {
    if (document.getElementById(this.widgetId)) return;

    // 1. HTML del Widget (Para Audio)
    const widgetHtml = `
            <div id="${this.widgetId}" class="fixed bottom-5 right-5 w-80 z-[100] hidden transition-all duration-300 transform translate-y-4 opacity-0 bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl overflow-hidden ring-1 ring-black/5">
                <div class="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <span id="${this.widgetTitleId}" class="text-xs font-bold text-slate-500 uppercase tracking-wider">Reproductor</span>
                    <button id="close-global-player" class="text-slate-400 hover:text-slate-700 w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-200 transition">
                        <i class="fas fa-times text-sm"></i>
                    </button>
                </div>
                <div id="${this.widgetContentId}" class="p-4 flex justify-center bg-white min-h-[80px] items-center">
                </div>
            </div>
        `;

    // 2. HTML del Modal (Para Imágenes)
    const modalHtml = `
        <div id="${this.modalId}" class="fixed inset-0 z-[110] hidden" aria-hidden="true">
            <div id="${this.modalId}-backdrop" class="absolute inset-0 bg-slate-900/90 backdrop-blur-sm transition-opacity duration-300 opacity-0 cursor-pointer"></div>
            
            <div class="absolute inset-0 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
                <div id="${this.modalId}-panel" class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300 scale-95 opacity-0 pointer-events-auto">
                    
                    <div class="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 flex-shrink-0 z-10">
                        <h3 id="${this.modalTitleId}" class="font-bold text-slate-800 text-lg truncate pr-4">Vista Previa</h3>
                        <div class="flex gap-2">
                            <a id="${this.modalId}-link" href="#" target="_blank" class="text-slate-400 hover:text-primary bg-slate-50 hover:bg-slate-100 w-9 h-9 flex items-center justify-center rounded-full transition-colors" title="Abrir original">
                                <i class="fas fa-external-link-alt"></i>
                            </a>
                            <button id="${this.modalId}-close" class="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 w-9 h-9 flex items-center justify-center rounded-full transition-colors focus:outline-none" title="Cerrar">
                                <i class="fas fa-times text-lg"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div id="${this.modalContentId}" class="flex-grow overflow-auto p-2 bg-slate-50/50 flex items-center justify-center relative min-h-[200px]">
                        </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", widgetHtml + modalHtml);

    // --- Listeners Widget ---
    document
      .getElementById("close-global-player")
      .addEventListener("click", () => this.closeWidget());

    // --- Listeners Modal ---
    const closeFn = () => this.closeModal();
    document
      .getElementById(`${this.modalId}-close`)
      .addEventListener("click", closeFn);
    document
      .getElementById(`${this.modalId}-backdrop`)
      .addEventListener("click", closeFn);

    // Cerrar con tecla ESC
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        !document.getElementById(this.modalId).classList.contains("hidden")
      ) {
        this.closeModal();
      }
    });

    this.isRendered = true;
  }

  // Método principal que decide qué abrir
  open(type, url, title) {
    if (!this.isRendered) this.renderBase();

    if (type === "image") {
      this.closeWidget(); // Aseguramos que el audio se cierre/pause
      this.openModal(url, title);
    } else {
      this.closeModal(); // Aseguramos que el modal se cierre
      this.openWidget(type, url, title);
    }
  }

  // --- LÓGICA DE AUDIOS (Widget) ---
  openWidget(type, url, title) {
    const container = document.getElementById(this.widgetId);
    const content = document.getElementById(this.widgetContentId);
    const titleEl = document.getElementById(this.widgetTitleId);

    titleEl.textContent = title || "Reproduciendo Audio";
    content.innerHTML = "";

    if (type === "audio") {
      content.innerHTML = `
                <div class="w-full">
                    <audio controls autoplay class="w-full h-10 block rounded bg-slate-50 focus:outline-none">
                        <source src="${url}">
                        Tu navegador no soporta audio.
                    </audio>
                </div>`;
    } else {
      content.textContent = "Formato no soportado en vista previa rápida.";
    }

    container.classList.remove("hidden");
    // Pequeño timeout para permitir la transición CSS
    requestAnimationFrame(() => {
      container.classList.remove("translate-y-4", "opacity-0");
    });
  }

  closeWidget() {
    const container = document.getElementById(this.widgetId);
    if (!container || container.classList.contains("hidden")) return;

    // Pausar audio si existe
    const audio = container.querySelector("audio");
    if (audio) audio.pause();

    container.classList.add("translate-y-4", "opacity-0");
    setTimeout(() => {
      container.classList.add("hidden");
      document.getElementById(this.widgetContentId).innerHTML = "";
    }, 300);
  }

  // --- LÓGICA DE IMÁGENES (Modal) ---
  openModal(url, title) {
    const modal = document.getElementById(this.modalId);
    const backdrop = document.getElementById(`${this.modalId}-backdrop`);
    const panel = document.getElementById(`${this.modalId}-panel`);
    const content = document.getElementById(this.modalContentId);
    const titleEl = document.getElementById(this.modalTitleId);
    const linkBtn = document.getElementById(`${this.modalId}-link`);

    titleEl.textContent = title || "Imagen Adjunta";
    linkBtn.href = url; // Actualizamos el botón de "Abrir original"

    content.innerHTML = `
        <img src="${url}" 
             class="max-w-full max-h-full object-contain rounded-lg shadow-sm animate-fade-in select-none" 
             alt="${title || "Vista previa"}"
        />`;

    modal.classList.remove("hidden");

    // Transiciones de entrada
    requestAnimationFrame(() => {
      backdrop.classList.remove("opacity-0");
      panel.classList.remove("scale-95", "opacity-0");
      panel.classList.add("scale-100", "opacity-100");
    });
  }

  closeModal() {
    const modal = document.getElementById(this.modalId);
    if (!modal || modal.classList.contains("hidden")) return;

    const backdrop = document.getElementById(`${this.modalId}-backdrop`);
    const panel = document.getElementById(`${this.modalId}-panel`);

    // Transiciones de salida
    backdrop.classList.add("opacity-0");
    panel.classList.remove("scale-100", "opacity-100");
    panel.classList.add("scale-95", "opacity-0");

    setTimeout(() => {
      modal.classList.add("hidden");
      document.getElementById(this.modalContentId).innerHTML = "";
    }, 300);
  }
}

export const globalPlayer = new MediaPlayer();
