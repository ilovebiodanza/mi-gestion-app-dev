import { BaseElement } from "../BaseElement.js";

export class UrlElement extends BaseElement {
  static getType() {
    return "url";
  }
  static getLabel() {
    return "Enlace Web / Multimedia";
  }
  static getIcon() {
    return "fas fa-link";
  }
  static getDescription() {
    return "Link a sitio web, imagen o audio (MP3).";
  }

  // Ocupa 1 columna
  static getColumns() {
    return 1;
  }

  // --- 1. CONFIGURACIÓN ---
  renderSettings() {
    return `
      <div class="md:col-span-12">
        <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">
          Placeholder
        </label>
        <input type="text" id="setting-placeholder-${this.def.id}" value="${
      this.def.placeholder || ""
    }" 
               class="w-full px-3 py-2 bg-white/60 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition font-medium text-slate-700 text-sm"
               placeholder="Ej: https://mi-sitio.com">
      </div>`;
  }

  postRenderSettings(container, updateConfig) {
    container
      .querySelector(`#setting-placeholder-${this.def.id}`)
      ?.addEventListener("input", (e) =>
        updateConfig("placeholder", e.target.value)
      );
  }

  // --- 2. EDITOR ---
  renderEditor() {
    const requiredBadge = this.def.required
      ? '<span class="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded border border-red-100 font-bold">REQ</span>'
      : "";

    let val = "";
    if (this.value && typeof this.value === "object") {
      val = this.value.url || "";
    } else {
      val = this.value || "";
    }

    console.log(this.def);

    const inputClasses =
      "block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm placeholder-slate-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-blue-600";

    return `
      <div class="field-wrapper flex flex-col mb-4 md:col-span-1 print:col-span-1" data-field-id="${
        this.def.id
      }">
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 ml-1 flex items-center justify-between">
           <span>${this.def.label}</span>${requiredBadge}
        </label>

        <div class="relative">
           <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within/std:text-primary transition-colors">
              <i class="fas fa-link"></i>
           </div>

           <input type="url" 
              id="${this.def.id}" 
              name="${this.def.id}" 
              value="${val}" 
              class="${inputClasses}" 
              placeholder="${this.def.placeholder || "https://..."}">
        </div>
        <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within/std:text-primary transition-colors"">
                  <i class="fas fa-font text-xs"></i>
              </div>
              <input type="text" class="text-input w-full bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm px-3 py-2 pl-8 text-slate-700 placeholder-slate-400 font-medium" placeholder="">
          </div>
      </div>`;
  }

  postRenderEditor(container, onChange) {
    const input = container.querySelector(`#${this.def.id}`);
    input?.addEventListener("input", (e) => {
      onChange(this.def.id, { url: e.target.value, text: e.target.value });
    });
  }

  // --- 3. VISUALIZACIÓN (VIEWER) ---
  renderViewer() {
    const val =
      this.value && typeof this.value === "object"
        ? this.value.url
        : this.value;

    if (!val) return '<span class="text-slate-300 text-xs italic">--</span>';

    // Generamos un ID único para los eventos de este elemento específico
    const uniqueId = `media-${this.def.id}-${Math.floor(Math.random() * 1000)}`;

    // 🎵 A. AUDIO (MP3/WAV)
    if (val.match(/\.(mp3|wav|ogg|m4a)$/i)) {
      const fileName = val.split("/").pop().replace(/%20/g, " ");
      return `
        <div class="flex items-center gap-3 group mt-1" id="${uniqueId}">
            <button type="button" 
                    class="js-play-audio w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 bg-pink-50 group-hover:bg-pink-100 text-pink-500 transition-all shadow-sm hover:scale-105 cursor-pointer" 
                    data-src="${val}" 
                    title="Reproducir">
               <i class="fas fa-play ml-0.5"></i>
            </button>
            <div class="flex flex-col">
                <span class="text-xs font-bold text-slate-700">Audio Disponible</span>
                <span class="text-[10px] text-slate-500 truncate max-w-[200px]">${fileName}</span>
            </div>
        </div>`;
    }

    // 🖼️ B. IMAGEN
    if (val.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
      return `
        <div class="mt-2" id="${uniqueId}">
            <div class="relative group w-fit cursor-pointer js-view-image" data-src="${val}">
                <img src="${val}" class="max-w-full h-auto max-h-48 rounded-lg border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]" loading="lazy" alt="Preview">
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                    <i class="fas fa-expand text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md"></i>
                </div>
            </div>
        </div>`;
    }

    // 🔗 C. LINK NORMAL
    return `
      <a href="${val}" target="_blank" class="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 hover:underline transition-colors font-medium break-all bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
        <i class="fas fa-external-link-alt text-xs"></i> ${val}
      </a>`;
  }

  // --- 🔥 INTERACTIVIDAD DEL VIEWER (Aquí sucede la magia del modal/player) ---
  postRenderViewer(container) {
    // 1. Manejo de AUDIO
    const playBtn = container.querySelector(".js-play-audio");
    if (playBtn) {
      playBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const src = playBtn.dataset.src;
        this.openFloatingPlayer(src);
      });
    }

    // 2. Manejo de IMAGEN
    const imgTrigger = container.querySelector(".js-view-image");
    if (imgTrigger) {
      imgTrigger.addEventListener("click", (e) => {
        e.preventDefault();
        const src = imgTrigger.dataset.src;
        this.openImageModal(src);
      });
    }
  }

  // --- FUNCIONES AUXILIARES DE UI (Inyectan HTML en el body) ---

  openFloatingPlayer(src) {
    // Eliminar reproductor anterior si existe
    const existing = document.getElementById("global-audio-player");
    if (existing) existing.remove();

    // Crear el reproductor flotante (Estilo Tarjeta Blanca)
    const playerHtml = `
      <div id="global-audio-player" class="fixed bottom-6 right-6 z-[9999] w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-up transform transition-all duration-300">
         <div class="px-4 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <i class="fas fa-music text-pink-500"></i> Música
            </span>
            <button id="close-audio-player" class="text-slate-400 hover:text-red-500 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors">
                <i class="fas fa-times text-xs"></i>
            </button>
         </div>
         <div class="p-3 bg-white">
            <audio controls autoplay class="w-full h-8 custom-audio-player">
               <source src="${src}" type="audio/mpeg">
               Tu navegador no soporta audio.
            </audio>
         </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", playerHtml);

    // Activar botón cerrar
    document
      .getElementById("close-audio-player")
      .addEventListener("click", () => {
        document.getElementById("global-audio-player").remove();
      });
  }

  openImageModal(src) {
    // Eliminar modal anterior si existe
    const existing = document.getElementById("global-image-modal");
    if (existing) existing.remove();

    // Crear modal pantalla completa
    const modalHtml = `
        <div id="global-image-modal" class="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in cursor-zoom-out">
            <img src="${src}" class="max-w-full max-h-[90vh] rounded-lg shadow-2xl scale-95 transition-transform duration-300 transform cursor-default" style="transform: scale(1)" onclick="event.stopPropagation()">
            
            <button id="close-image-modal" class="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-md">
                <i class="fas fa-times text-lg"></i>
            </button>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // Cerrar al hacer clic en el fondo o en el botón X
    const modal = document.getElementById("global-image-modal");
    const closeBtn = document.getElementById("close-image-modal");

    const closeFn = () => modal.remove();
    modal.addEventListener("click", closeFn);
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeFn();
    });
  }

  // --- 4. IMPRESIÓN ---
  renderPrint(mode) {
    const val =
      this.value && typeof this.value === "object"
        ? this.value.url
        : this.value || "—";

    // Si es Audio
    if (val.match(/\.(mp3|wav|ogg)$/i)) {
      return `<div class="text-xs flex items-center gap-2 py-1"><i class="fas fa-music text-pink-500"></i> <span class="text-slate-600 underline">${val
        .split("/")
        .pop()}</span></div>`;
    }
    // Si es Imagen
    if (val.match(/\.(jpeg|jpg|png|webp)$/i)) {
      return `<div class="py-1"><img src="${val}" class="h-20 w-auto rounded border border-slate-200 object-cover"></div>`;
    }

    if (mode === "compact")
      return `<div class="text-[9px]"><b class="uppercase">${this.def.label}:</b> ${val}</div>`;

    return `
      <div class="mb-2 page-break avoid-break-inside">
         <dt class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">${this.def.label}</dt>
         <dd class="text-sm text-blue-700 border-b border-slate-100 pb-1 font-medium underline break-all">
            ${val}
         </dd>
      </div>`;
  }
}
