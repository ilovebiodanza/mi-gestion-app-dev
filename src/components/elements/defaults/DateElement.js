import { BaseElement } from "../BaseElement.js";

export class DateElement extends BaseElement {
  static getType() {
    return "date";
  }
  static getLabel() {
    return "Fecha";
  }
  static getIcon() {
    return "far fa-calendar-alt";
  }
  static getDescription() {
    return "Selector de calendario.";
  }

  renderEditor() {
    return `
      <label class="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">${
        this.def.label
      }</label>
      <input type="date" id="${this.def.id}" value="${this.value || ""}" 
        class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:border-brand-500 outline-none">
    `;
  }

  postRenderEditor(container, onChange) {
    const input = container.querySelector(`#${this.def.id}`);
    input?.addEventListener("change", (e) =>
      onChange(this.def.id, e.target.value)
    );
  }

  renderViewer() {
    if (!this.value) return "—";
    const date = new Date(this.value);
    // Ajuste de zona horaria simple
    const userDate = new Date(
      date.getTime() + date.getTimezoneOffset() * 60000
    );

    return `
      <div class="flex items-center gap-2 text-slate-700">
        <i class="far fa-calendar text-slate-400"></i>
        <span class="font-medium">${userDate.toLocaleDateString()}</span>
      </div>`;
  }
}
