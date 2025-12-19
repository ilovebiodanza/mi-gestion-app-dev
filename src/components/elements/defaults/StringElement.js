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

  renderTemplate() {
    return `
      <div class="flex flex-col gap-2">
        <label class="text-[10px] font-bold text-slate-400 uppercase">Placeholder (Pista)</label>
        <input type="text" name="placeholder" value="${
          this.def.placeholder || ""
        }" class="border border-slate-200 rounded px-2 py-1 text-sm">
      </div>`;
  }

  renderEditor() {
    return `
      <label class="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">${
        this.def.label
      }</label>
      <input type="text" id="${this.def.id}" value="${this.value || ""}" 
        class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all" 
        placeholder="${this.def.placeholder || ""}">
    `;
  }

  postRenderEditor(container, onChange) {
    const input = container.querySelector(`#${this.def.id}`);
    input?.addEventListener("input", (e) =>
      onChange(this.def.id, e.target.value)
    );
  }

  renderViewer() {
    return `<span class="text-slate-800 font-medium">${
      this.value || "—"
    }</span>`;
  }

  renderPrint(mode) {
    const val = this.value || "—";
    if (mode === "compact")
      return `<div class="text-[9px]"><b class="uppercase">${this.def.label}:</b> ${val}</div>`;
    if (mode === "accessible")
      return `<div class="mb-2"><div class="font-bold text-lg">${this.def.label}</div><div class="text-xl">${val}</div></div>`;

    // Standard
    return `
      <div class="mb-2 page-break">
         <dt class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">${this.def.label}</dt>
         <dd class="text-sm text-slate-900 border-b border-slate-100 pb-1 font-medium">${val}</dd>
      </div>`;
  }
}
