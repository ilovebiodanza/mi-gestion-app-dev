import { BaseElement } from "../BaseElement.js";

export class SelectElement extends BaseElement {
  static getType() {
    return "select";
  }
  static getLabel() {
    return "Lista de Opciones";
  }
  static getIcon() {
    return "fas fa-list-ul";
  }
  static getDescription() {
    return "Menú desplegable.";
  }

  renderTemplate() {
    // Necesitamos definir las opciones en el template
    const opts =
      this.def.settings && this.def.settings.options
        ? this.def.settings.options
        : "";
    return `
      <div class="flex flex-col gap-1">
        <label class="text-[10px] font-bold text-slate-400 uppercase">Opciones (separadas por coma)</label>
        <textarea name="options" class="border border-slate-200 rounded px-2 py-1 text-sm h-16" placeholder="Opción 1, Opción 2, Opción 3">${opts}</textarea>
      </div>`;
  }

  renderEditor() {
    // Convertir string de opciones a array
    const optionsStr =
      this.def.settings && this.def.settings.options
        ? this.def.settings.options
        : "";
    const options = optionsStr
      .split(",")
      .map((o) => o.trim())
      .filter((o) => o);

    const optionsHtml = options
      .map(
        (opt) =>
          `<option value="${opt}" ${
            this.value === opt ? "selected" : ""
          }>${opt}</option>`
      )
      .join("");

    return `
      <label class="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">${this.def.label}</label>
      <div class="relative">
        <select id="${this.def.id}" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm appearance-none focus:bg-white focus:border-brand-500 outline-none">
            <option value="">-- Seleccionar --</option>
            ${optionsHtml}
        </select>
        <i class="fas fa-chevron-down absolute right-3 top-3 text-slate-400 pointer-events-none text-xs"></i>
      </div>
    `;
  }

  postRenderEditor(container, onChange) {
    const input = container.querySelector(`#${this.def.id}`);
    input?.addEventListener("change", (e) =>
      onChange(this.def.id, e.target.value)
    );
  }

  renderViewer() {
    return `<span class="px-2 py-1 bg-slate-100 rounded text-slate-700 font-medium text-sm border border-slate-200">${
      this.value || "—"
    }</span>`;
  }
}
