// src/components/elements/defaults/SeparatorElement.js
import { BaseElement } from "../BaseElement.js";

export class SeparatorElement extends BaseElement {
  static getType() {
    return "separator";
  }
  static getLabel() {
    return "Separador / Título";
  }
  static getIcon() {
    return "fas fa-heading";
  }

  // 1. Template: Solo pide el texto del título
  renderTemplate() {
    return `<p class="text-xs text-slate-500">Este elemento crea una división visual.</p>`;
  }

  // 2. Editor: Muestra el título visualmente, no hay input
  renderEditor() {
    return `<h3 class="text-lg font-bold border-b mt-4">${this.def.label}</h3>`;
  }

  // No hay validate() porque no guarda valor

  // 3. Viewer
  renderViewer() {
    return `<div class="border-b-2 border-slate-200 mt-6 mb-4"><h2 class="text-xl text-brand-600">${this.def.label}</h2></div>`;
  }

  // 4. Print
  renderPrint(mode) {
    if (mode === "compact")
      return `<hr class="border-black my-2"><strong>${this.def.label}</strong>`;
    return `<div class="page-break mt-4 border-b-2 border-black"><h3>${this.def.label}</h3></div>`;
  }

  // 5. WhatsApp
  getWhatsAppText() {
    return `\n=== ${this.def.label.toUpperCase()} ===\n`;
  }
}
