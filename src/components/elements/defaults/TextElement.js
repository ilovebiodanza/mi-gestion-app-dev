import { BaseElement } from "../BaseElement.js";

export class TextElement extends BaseElement {
  static getType() {
    return "text";
  }
  static getLabel() {
    return "Texto Largo / Notas";
  }
  static getIcon() {
    return "fas fa-align-left";
  }
  static getDescription() {
    return "Descripciones detalladas o párrafos.";
  }
  static getColumns() {
    return 2;
  }

  // --- 1. CONFIGURACIÓN (Template) ---
  // Igual que String, pero adaptado semánticamente
  renderSettings() {
    return `
      <div class="md:col-span-12">
        <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">
          Placeholder (Texto de ayuda)
        </label>
        <input type="text" 
               id="setting-placeholder-${this.def.id}"
               value="${this.def.placeholder || ""}" 
               class="w-full px-3 py-2 bg-white/60 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition font-medium text-slate-700 text-sm"
               placeholder="Ej: Describe los detalles aquí...">
      </div>`;
  }

  postRenderSettings(container, updateConfig) {
    container
      .querySelector(`#setting-placeholder-${this.def.id}`)
      ?.addEventListener("input", (e) =>
        updateConfig("placeholder", e.target.value)
      );
  }

  // --- 2. EDITOR (InputRenderers / form-generator) ---
  renderEditor() {
    const requiredBadge = this.def.required
      ? '<span class="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded border border-red-100 font-bold">REQ</span>'
      : "";
    const inputClasses =
      "block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm placeholder-slate-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-y";

    return `
      <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 ml-1 flex items-center justify-between">
         <span>${this.def.label}</span>${requiredBadge}
      </label>
      <div class="relative group/std">
        <textarea id="${
          this.def.id
        }" rows="4" class="${inputClasses}" placeholder="${
      this.def.placeholder || "Escribe aquí..."
    }">${this.value || ""}</textarea>
      </div>`;
  }

  postRenderEditor(container, onChange) {
    const input = container.querySelector(`#${this.def.id}`);
    input?.addEventListener("input", (e) =>
      onChange(this.def.id, e.target.value)
    );
  }

  // --- 3. VISUALIZACIÓN (TextViewer homologado) ---
  renderViewer() {
    const val = this.value || "—";
    // Estilos copiados de TextViewer.js (prose, whitespace-pre-line)
    return `<div class="prose prose-sm max-w-none text-slate-600 whitespace-pre-line">${val}</div>`;
  }

  // --- 4. IMPRESIÓN ---
  renderPrint(mode) {
    const val = this.value || "—";
    if (mode === "compact")
      return `<div class="text-[9px] mb-1"><b class="uppercase">${this.def.label}:</b> <span class="whitespace-pre-wrap">${val}</span></div>`;

    // Standard Print
    return `
      <div class="mb-4 page-break avoid-break-inside">
         <dt class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">${this.def.label}</dt>
         <dd class="text-sm text-slate-900 border-l-2 border-slate-200 pl-3 py-1 font-medium whitespace-pre-line">${val}</dd>
      </div>`;
  }
}
