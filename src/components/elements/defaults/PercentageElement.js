import { BaseElement } from "../BaseElement.js";

export class PercentageElement extends BaseElement {
  static getType() {
    return "percentage";
  }
  static getLabel() {
    return "Porcentaje";
  }
  static getIcon() {
    return "fas fa-percent";
  }
  static getDescription() {
    return "Valores porcentuales (0-100).";
  }

  renderEditor() {
    return `
      <label class="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">${
        this.def.label
      }</label>
      <div class="flex items-center gap-2">
        <input type="range" min="0" max="100" value="${
          this.value || 0
        }" class="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600" id="range-${
      this.def.id
    }">
        <div class="relative w-20">
            <input type="number" id="${this.def.id}" value="${
      this.value || 0
    }" min="0" max="100"
              class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-sm text-right focus:bg-white focus:border-brand-500 outline-none">
            <span class="absolute right-6 top-1.5 text-xs text-slate-400 pointer-events-none">%</span>
        </div>
      </div>
    `;
  }

  postRenderEditor(container, onChange) {
    const input = container.querySelector(`#${this.def.id}`);
    const range = container.querySelector(`#range-${this.def.id}`);

    const update = (val) => {
      if (input) input.value = val;
      if (range) range.value = val;
      onChange(this.def.id, val);
    };

    input?.addEventListener("input", (e) => update(e.target.value));
    range?.addEventListener("input", (e) => update(e.target.value));
  }

  renderViewer() {
    return `
      <div class="flex items-center gap-2">
        <div class="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div class="h-full bg-brand-500" style="width: ${
              this.value || 0
            }%"></div>
        </div>
        <span class="text-sm font-bold text-slate-700">${
          this.value || 0
        }%</span>
      </div>`;
  }
}
