import { BaseElement } from "../BaseElement.js";

export class UrlElement extends BaseElement {
  static getType() {
    return "url";
  }
  static getLabel() {
    return "Enlace Web (URL)";
  }
  static getIcon() {
    return "fas fa-link";
  }
  static getDescription() {
    return "Link a sitio web o imagen.";
  }

  renderEditor() {
    // CORRECCIÓN: Verificamos que 'this.value' exista (no sea null) antes de verificar si es objeto.
    let val = "";

    if (this.value && typeof this.value === "object") {
      val = this.value.url || "";
    } else {
      val = this.value || "";
    }

    return `
      <label class="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">${this.def.label}</label>
      <div class="relative">
        <input type="url" id="${this.def.id}" value="${val}" 
          class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm text-blue-600 focus:bg-white focus:border-brand-500 outline-none transition-all placeholder:text-slate-300"
          placeholder="https://...">
        <i class="fas fa-link absolute left-3 top-2.5 text-slate-400 text-xs"></i>
      </div>
    `;
  }

  postRenderEditor(container, onChange) {
    const input = container.querySelector(`#${this.def.id}`);
    input?.addEventListener("input", (e) => {
      // Mantenemos compatibilidad con el formato objeto {url, text}
      onChange(this.def.id, { url: e.target.value, text: e.target.value });
    });
  }

  renderViewer() {
    const val =
      this.value && typeof this.value === "object"
        ? this.value.url
        : this.value;
    if (!val) return "—";

    // Auto-detectar imagen
    if (val.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
      return `
        <div class="mt-1">
            <img src="${val}" class="max-w-full h-auto max-h-48 rounded-lg border border-slate-200 shadow-sm" loading="lazy" alt="Preview">
            <a href="${val}" target="_blank" class="block mt-1 text-xs text-brand-600 hover:underline">Ver original</a>
        </div>`;
    }

    return `<a href="${val}" target="_blank" class="text-brand-600 hover:underline flex items-center gap-2 truncate max-w-xs"><i class="fas fa-external-link-alt text-xs"></i> ${val}</a>`;
  }

  getWhatsAppText() {
    const val =
      this.value && typeof this.value === "object"
        ? this.value.url
        : this.value;
    return `${this.def.label}: ${val}`;
  }
}
