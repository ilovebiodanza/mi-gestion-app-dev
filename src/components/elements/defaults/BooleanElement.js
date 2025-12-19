import { BaseElement } from "../BaseElement.js";

export class BooleanElement extends BaseElement {
  static getType() {
    return "boolean";
  }
  static getLabel() {
    return "Sí / No";
  }
  static getIcon() {
    return "fas fa-check-square";
  }
  static getDescription() {
    return "Opción binaria verdadero/falso.";
  }

  renderEditor() {
    const isChecked = this.value === true || this.value === "true";
    return `
      <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-white transition-colors">
        <label class="text-sm font-bold text-slate-600 cursor-pointer select-none flex-1" for="${
          this.def.id
        }">
            ${this.def.label}
        </label>
        <div class="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
            <input type="checkbox" name="${this.def.id}" id="${
      this.def.id
    }" class="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ${
      isChecked ? "right-0 border-brand-600" : "left-0 border-slate-300"
    }" ${isChecked ? "checked" : ""}/>
            <label for="${
              this.def.id
            }" class="toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${
      isChecked ? "bg-brand-600" : "bg-slate-300"
    }"></label>
        </div>
      </div>
    `;
  }

  postRenderEditor(container, onChange) {
    const input = container.querySelector(`#${this.def.id}`);
    input?.addEventListener("change", (e) =>
      onChange(this.def.id, e.target.checked)
    );
  }

  renderViewer() {
    const isTrue = this.value === true || this.value === "true";
    return isTrue
      ? `<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold"><i class="fas fa-check"></i> SÍ</span>`
      : `<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold"><i class="fas fa-times"></i> NO</span>`;
  }

  getWhatsAppText() {
    return `${this.def.label}: ${this.value ? "SÍ" : "NO"}`;
  }
}
