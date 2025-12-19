import { BaseElement } from "../BaseElement.js";

export class NumberElement extends BaseElement {
  static getType() {
    return "number";
  }
  static getLabel() {
    return "Número";
  }
  static getIcon() {
    return "fas fa-hashtag";
  }
  static getDescription() {
    return "Cantidades, edades, unidades.";
  }

  renderEditor() {
    return `
      <label class="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">${
        this.def.label
      }</label>
      <input type="number" id="${this.def.id}" value="${this.value || ""}" 
        class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:border-brand-500 outline-none transition-all"
        placeholder="0">
    `;
  }

  postRenderEditor(container, onChange) {
    const input = container.querySelector(`#${this.def.id}`);
    input?.addEventListener("input", (e) =>
      onChange(this.def.id, Number(e.target.value))
    );
  }

  renderViewer() {
    return `<span class="font-mono text-slate-700">${
      this.value !== null ? this.value : "—"
    }</span>`;
  }
}
