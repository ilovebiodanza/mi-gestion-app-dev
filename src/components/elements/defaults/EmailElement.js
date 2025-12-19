import { BaseElement } from "../BaseElement.js";

export class EmailElement extends BaseElement {
  static getType() {
    return "email";
  }
  static getLabel() {
    return "Correo Electrónico";
  }
  static getIcon() {
    return "fas fa-envelope";
  }
  static getDescription() {
    return "Validación de formato email.";
  }

  renderEditor() {
    return `
      <label class="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">${
        this.def.label
      }</label>
      <div class="relative">
        <input type="email" id="${this.def.id}" value="${this.value || ""}" 
          class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:bg-white focus:border-brand-500 outline-none transition-all placeholder:text-slate-300"
          placeholder="ejemplo@correo.com">
        <i class="fas fa-at absolute left-3 top-2.5 text-slate-400 text-xs"></i>
      </div>
    `;
  }

  postRenderEditor(container, onChange) {
    const input = container.querySelector(`#${this.def.id}`);
    input?.addEventListener("input", (e) =>
      onChange(this.def.id, e.target.value)
    );
  }

  renderViewer() {
    if (!this.value) return "—";
    return `<a href="mailto:${this.value}" class="text-brand-600 hover:underline flex items-center gap-2"><i class="far fa-envelope"></i> ${this.value}</a>`;
  }
}
