import { BaseElement } from "../BaseElement.js";

export class StringElement extends BaseElement {
  static getType() {
    return "string";
  }
  static getLabel() {
    return "Texto Breve";
  }
  static getIcon() {
    return "fas fa-font";
  }
  static getDescription() {
    return "Nombres, títulos o datos cortos.";
  }

  renderSettings() {
    return `
      <div class="md:col-span-12">
        <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Placeholder</label>
        <input type="text" id="setting-placeholder-${this.def.id}" value="${
      this.def.placeholder || ""
    }" 
               class="w-full px-3 py-2 bg-white/60 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition font-medium text-slate-700 text-sm">
      </div>`;
  }

  postRenderSettings(container, updateConfig) {
    container
      .querySelector(`#setting-placeholder-${this.def.id}`)
      ?.addEventListener("input", (e) =>
        updateConfig("placeholder", e.target.value)
      );
  }

  renderEditor() {
    const requiredBadge = this.def.required
      ? '<span class="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded border border-red-100 font-bold">REQ</span>'
      : "";
    const inputClasses =
      "block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm placeholder-slate-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none";

    return `
      <div class="field-wrapper flex flex-col mb-4 md:col-span-1 print:col-span-1" data-field-id="${
        this.def.id
      }">
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 ml-1 flex items-center justify-between">
           <span>${this.def.label}</span>${requiredBadge}
        </label>
        <div class="relative group/std">
          <input type="text" id="${this.def.id}" name="${this.def.id}" value="${
      this.value || ""
    }" class="${inputClasses}" placeholder="${this.def.placeholder || ""}">
        </div>
      </div>`;
  }

  postRenderEditor(container, onChange) {
    // Busca el elemento por ID y asigna el evento. Si el ID falta en el render, esto falla silenciosamente y luego el Guardar explota.
    container
      .querySelector(`#${this.def.id}`)
      ?.addEventListener("input", (e) => onChange(this.def.id, e.target.value));
  }

  renderViewer() {
    const val = this.value || "—";
    return `<div class="prose prose-sm max-w-none text-slate-600 whitespace-pre-line">${val}</div>`;
  }

  renderPrint(mode) {
    const val = this.value || "—";
    if (mode === "compact")
      return `<div class="text-[9px]"><b class="uppercase">${this.def.label}:</b> ${val}</div>`;
    if (mode === "accessible")
      return `<div class="mb-2"><div class="font-bold text-lg">${this.def.label}</div><div class="text-xl">${val}</div></div>`;
    return `<div class="mb-2 page-break"><dt class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">${this.def.label}</dt><dd class="text-sm text-slate-900 border-b border-slate-100 pb-1 font-medium">${val}</dd></div>`;
  }
}
