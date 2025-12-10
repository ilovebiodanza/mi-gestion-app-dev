// src/services/templates/form-generator.js
import { getFieldTypeMetadata } from "../../utils/field-types-config.js";

/**
 * Servicio para generar la representación HTML/DOM con estilos Tailwind Nativos
 */
class TemplateFormGenerator {
  // Estilos base reutilizables
  get inputBaseClass() {
    return "block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm placeholder-slate-400 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none";
  }

  renderField(field, currentValue = "") {
    if (!field || !field.type)
      return `<p class="text-red-500 text-xs">Error: Campo sin tipo.</p>`;

    const requiredAttr = field.required ? "required" : "";
    const metadata = getFieldTypeMetadata(field.type);
    let inputType = metadata?.inputType || "text";
    let inputHtml = "";

    // 1. Checkbox
    if (inputType === "checkbox") {
      inputHtml = `
        <div class="flex items-center h-full pt-1">
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="${field.id}" name="${field.id}" 
                   class="peer sr-only form-checkbox" ${
                     currentValue ? "checked" : ""
                   } />
            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            <span class="ml-3 text-sm font-medium text-slate-600 select-none cursor-pointer">Activar</span>
          </label>
        </div>`;
    }
    // 2. Textarea
    else if (inputType === "textarea") {
      inputHtml = `<textarea id="${field.id}" name="${field.id}" rows="3"
        class="${this.inputBaseClass}" 
        placeholder="${
          field.placeholder || "Escribe aquí..."
        }" ${requiredAttr}>${currentValue}</textarea>`;
    }
    // 3. URL Compuesta
    else if (inputType === "url") {
      // Aseguramos que manejamos tanto si viene como objeto {url, text} o string antiguo
      let urlVal =
        currentValue?.url ||
        (typeof currentValue === "string" ? currentValue : "");
      let textVal = currentValue?.text || "";

      inputHtml = `
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 url-group">
             <div class="relative">
               <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Dirección Web (Link)</label>
               <div class="absolute inset-y-0 left-0 pl-3 top-6 flex items-center pointer-events-none text-slate-400">
                 <i class="fas fa-link text-xs"></i>
               </div>
               <input type="url" id="${field.id}_url" 
                      class="${this.inputBaseClass} pl-9" 
                      placeholder="https://ejemplo.com" 
                      value="${urlVal}" ${requiredAttr} />
             </div>
             
             <div class="relative">
               <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Texto Visible (Opcional)</label>
               <div class="absolute inset-y-0 left-0 pl-3 top-6 flex items-center pointer-events-none text-slate-400">
                 <i class="fas fa-font text-xs"></i>
               </div>
               <input type="text" id="${field.id}_text" 
                      class="${this.inputBaseClass} pl-9" 
                      placeholder="Ej: Ver Factura" 
                      value="${textVal}" />
             </div>
          </div>
        `;
    }
    // 4. Select
    else if (inputType === "select") {
      const optionsHtml = (field.options || [])
        .map(
          (opt) =>
            `<option value="${opt}" ${
              currentValue === opt ? "selected" : ""
            }>${opt}</option>`
        )
        .join("");

      inputHtml = `
        <div class="relative">
          <select id="${field.id}" name="${field.id}" class="${
        this.inputBaseClass
      } appearance-none cursor-pointer" ${requiredAttr}>
            <option value="" disabled ${
              !currentValue ? "selected" : ""
            }>Seleccionar opción...</option>
            ${optionsHtml}
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
            <i class="fas fa-chevron-down text-xs"></i>
          </div>
        </div>`;
    }
    // 5. Tabla Dinámica
    else if (inputType === "table") {
      const headers = (field.columns || [])
        .map(
          (c) =>
            `<th class="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-100">${c.label}</th>`
        )
        .join("");

      const rowsData = Array.isArray(currentValue) ? currentValue : [];

      inputHtml = `
        <div class="table-input-container rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm" data-field-id="${
          field.id
        }">
          <input type="hidden" id="${field.id}" name="${
        field.id
      }" value='${JSON.stringify(rowsData)}' class="form-table-data">
          
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-100">
              <thead><tr>${headers}<th class="w-10 bg-slate-50 border-b border-slate-100"></th></tr></thead>
              <tbody class="bg-white divide-y divide-slate-100 table-body"></tbody>
            </table>
          </div>
          
          <button type="button" class="add-row-btn w-full py-3 bg-slate-50 hover:bg-slate-100 text-primary font-medium text-sm transition-colors border-t border-slate-200 flex items-center justify-center gap-2">
            <i class="fas fa-plus-circle"></i> Agregar Fila
          </button>
        </div>
        <script type="application/json" class="columns-def">${JSON.stringify(
          field.columns || []
        )}</script>
      `;
    }
    // 6. Inputs Estándar (Texto, Número, Password, etc)
    else {
      let finalType = ["number", "currency", "percentage"].includes(field.type)
        ? "text"
        : inputType;
      // Icono contextual
      let icon = "";
      if (field.type === "email") icon = "fa-envelope";
      else if (field.type === "date") icon = "fa-calendar";
      else if (field.type === "secret") icon = "fa-key";
      else if (field.type === "currency") icon = "fa-dollar-sign";

      const iconHtml = icon
        ? `<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><i class="fas ${icon}"></i></div>`
        : "";
      const paddingClass = icon ? "pl-10" : "";

      inputHtml = `
        <div class="relative">
          ${iconHtml}
          <input type="${finalType}" id="${field.id}" name="${field.id}" 
            class="${this.inputBaseClass} ${paddingClass}" 
            placeholder="${
              field.placeholder || ""
            }" value="${currentValue}" ${requiredAttr} />
        </div>
      `;
    }

    const isFullWidth =
      field.type === "table" ||
      field.type === "text" ||
      field.type === "url" ||
      field.type === "textarea";
    const layoutClass = isFullWidth ? "md:col-span-2" : "md:col-span-1";

    return `
      <div class="field-wrapper ${layoutClass} group">
        <label for="${
          field.id
        }" class="block text-sm font-bold text-slate-700 mb-1.5 ml-1 flex items-center justify-between">
            <span>${field.label} ${
      field.required ? '<span class="text-red-400">*</span>' : ""
    }</span>
        </label>
        ${inputHtml}
      </div>
    `;
  }

  generateFormHtml(template, data = {}) {
    if (!template || !template.fields)
      return `<div class="p-4 bg-red-50 text-red-600 rounded-lg">Error: Plantilla dañada.</div>`;
    return template.fields
      .map((field) => this.renderField(field, data[field.id] || ""))
      .join("");
  }
}

export const templateFormGenerator = new TemplateFormGenerator();
