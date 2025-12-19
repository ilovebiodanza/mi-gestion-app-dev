import { BaseElement } from "../BaseElement.js";
import { getLocalCurrency } from "../../../utils/helpers.js"; // Asegúrate de que esta ruta sea correcta o ajustala

export class CurrencyElement extends BaseElement {
  static getType() {
    return "currency";
  }
  static getLabel() {
    return "Moneda / Dinero";
  }
  static getIcon() {
    return "fas fa-dollar-sign";
  }
  static getDescription() {
    return "Importes financieros.";
  }

  renderEditor() {
    return `
      <label class="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">${
        this.def.label
      }</label>
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span class="text-slate-400 text-sm">$</span>
        </div>
        <input type="number" id="${this.def.id}" value="${
      this.value || ""
    }" step="0.01"
          class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm font-mono focus:bg-white focus:border-brand-500 outline-none transition-all"
          placeholder="0.00">
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
    // Formateo simple, idealmente usaríamos la config del usuario
    const formatted = new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
    }).format(this.value);
    return `<span class="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">${formatted}</span>`;
  }

  getWhatsAppText() {
    return `*${this.def.label}*: $${this.value}`;
  }
}
