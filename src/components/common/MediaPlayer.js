export class MediaPlayer {
  constructor() {
    this.containerId = "global-media-player";
    this.contentId = "global-player-content";
    this.titleId = "global-player-title";
    this.isRendered = false;
  }

  // Inyecta el HTML base en el DOM (solo una vez)
  renderBase() {
    if (document.getElementById(this.containerId)) return;

    const html = `
            <div id="${this.containerId}" class="fixed bottom-5 right-5 w-80 z-[100] hidden transition-all duration-300 transform translate-y-4 opacity-0 bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl overflow-hidden ring-1 ring-black/5">
                <div class="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <span id="${this.titleId}" class="text-xs font-bold text-slate-500 uppercase tracking-wider">Vista Previa</span>
                    <button id="close-global-player" class="text-slate-400 hover:text-slate-700 w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-200 transition">
                        <i class="fas fa-times text-sm"></i>
                    </button>
                </div>
                <div id="${this.contentId}" class="p-4 flex justify-center bg-white min-h-[100px] items-center">
                    </div>
            </div>
        `;
    document.body.insertAdjacentHTML("beforeend", html);

    // Event listener para cerrar
    document
      .getElementById("close-global-player")
      .addEventListener("click", () => this.close());
    this.isRendered = true;
  }

  open(type, url, title) {
    if (!this.isRendered) this.renderBase();

    const container = document.getElementById(this.containerId);
    const content = document.getElementById(this.contentId);
    const titleEl = document.getElementById(this.titleId);

    // Limpiar contenido previo
    content.innerHTML = "";
    titleEl.textContent =
      title ||
      (type === "audio" ? "Reproduciendo Audio" : "Visualizando Imagen");

    if (type === "image") {
      content.innerHTML = `<img src="${url}" class="max-w-full rounded-lg shadow-sm object-contain max-h-60" alt="Vista previa">`;
    } else if (type === "audio") {
      content.innerHTML = `
                <div class="w-full">
                    <audio controls autoplay class="w-full h-10 block rounded bg-slate-50">
                        <source src="${url}">
                        Tu navegador no soporta audio.
                    </audio>
                </div>`;
    }

    // Mostrar con animación
    container.classList.remove("hidden");
    // Pequeño timeout para permitir que el navegador procese el 'remove hidden' antes de animar opacidad
    setTimeout(() => {
      container.classList.remove("translate-y-4", "opacity-0");
    }, 10);
  }

  close() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Pausar audio si existe
    const audio = container.querySelector("audio");
    if (audio) audio.pause();

    container.classList.add("translate-y-4", "opacity-0");
    setTimeout(() => {
      container.classList.add("hidden");
      // Limpiar src para detener descarga de datos
      document.getElementById(this.contentId).innerHTML = "";
    }, 300);
  }
}

export const globalPlayer = new MediaPlayer();
