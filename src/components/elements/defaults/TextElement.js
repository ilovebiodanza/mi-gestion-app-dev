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

  renderTemplate() {
    return `
      <div class="flex items-center gap-2 mt-2">
        <input type="checkbox" name="richText" disabled checked class="accent-brand-600"> 
        <span class="text-sm text-slate-600">Multilínea habilitado</span>
      </div>`;
  }

  renderEditor() {
    return `
      <label class="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">${
        this.def.label
      }</label>
      <textarea id="${
        this.def.id
      }" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:border-brand-500 outline-none transition-all min-h-[100px]" placeholder="Escribe aquí...">${
      this.value || ""
    }</textarea>
    `;
  }

  postRenderEditor(container, onChange) {
    const input = container.querySelector(`#${this.def.id}`);
    input?.addEventListener("input", (e) =>
      onChange(this.def.id, e.target.value)
    );
  }

  renderViewer() {
    if (!this.value)
      return `<span class="text-slate-300 italic">Sin notas</span>`;
    return `<div class="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100">${this.value}</div>`;
  }

  renderPrint(mode) {
    const val = this.value || "—";
    if (mode === "compact")
      return `<div class="col-span-4 mt-1 border-t border-slate-100 pt-1 text-[9px] italic">${val}</div>`;

    // Standard & Accessible
    return `
      <div class="col-span-2 mb-4 page-break">
         <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">${this.def.label}</h3>
         <div class="text-sm text-slate-900 bg-slate-50 p-3 rounded border border-slate-100 whitespace-pre-wrap">${val}</div>
      </div>`;
  }
}
