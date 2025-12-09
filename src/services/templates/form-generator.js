// src/services/templates/form-generator.js
import { getFieldTypeMetadata } from "../../utils/field-types-config.js";

/**
 * Servicio para generar la representación HTML/DOM (formulario)
 */
class TemplateFormGenerator {
  renderField(field, currentValue = "") {
    if (!field || !field.type) {
      return `<p class="text-red-500">Error: Tipo de campo no definido.</p>`;
    }

    const requiredAttr = field.required ? "required" : "";
    let inputHtml = "";

    const metadata = getFieldTypeMetadata(field.type);
    let inputType = metadata?.inputType || "text";

    switch (inputType) {
      case "checkbox":
        inputHtml = `<input type="checkbox" id="${field.id}" name="${
          field.id
        }" class="form-checkbox" ${currentValue ? "checked" : ""} />`;
        break;
      case "textarea":
        inputHtml = `<textarea id="${field.id}" name="${
          field.id
        }" class="form-textarea" placeholder="${
          field.placeholder || ""
        }" ${requiredAttr}>${currentValue}</textarea>`;
        break;

      case "url":
        let urlVal = currentValue;
        let textVal = "";

        if (typeof currentValue === "object" && currentValue !== null) {
          urlVal = currentValue.url || "";
          textVal = currentValue.text || "";
        }

        inputHtml = `
          <div class="flex flex-col sm:flex-row gap-2 url-group">
             <div class="flex-grow">
               <input type="url" id="${field.id}_url" class="form-input w-full" 
                      placeholder="https://ejemplo.com" value="${urlVal}" ${requiredAttr} />
             </div>
             <div class="w-full sm:w-1/3">
               <input type="text" id="${field.id}_text" class="form-input w-full" 
                      placeholder="Texto del enlace (Opcional)" value="${textVal}" />
             </div>
          </div>
        `;
        break;

      case "select":
        const optionsHtml = (field.options || [])
          .map(
            (option) => `
          <option value="${option}" ${
              currentValue === option ? "selected" : ""
            }>
            ${option}
          </option>
        `
          )
          .join("");

        inputHtml = `
          <select id="${field.id}" name="${
          field.id
        }" class="form-select" ${requiredAttr}>
            <option value="" disabled ${
              !currentValue ? "selected" : ""
            }>Seleccionar...</option>
            ${optionsHtml}
          </select>`;
        break;

      case "table":
        const headers = (field.columns || [])
          .map(
            (c) =>
              `<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${c.name}</th>`
          )
          .join("");

        const rowsData = Array.isArray(currentValue) ? currentValue : [];

        inputHtml = `
          <div class="table-input-container" data-field-id="${field.id}">
            <input type="hidden" id="${field.id}" name="${
          field.id
        }" value='${JSON.stringify(rowsData)}' class="form-table-data">
            <div class="overflow-x-auto border border-gray-300 rounded-lg">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50"><tr>${headers}<th class="w-10"></th></tr></thead>
                <tbody class="bg-white divide-y divide-gray-200 table-body"></tbody>
              </table>
            </div>
            <button type="button" class="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium add-row-btn">
              <i class="fas fa-plus-circle mr-1"></i> Agregar Fila
            </button>
          </div>
          <script type="application/json" class="columns-def">${JSON.stringify(
            field.columns || []
          )}</script>
        `;
        break;

      default:
        const finalType =
          field.type === "number" ||
          field.type === "currency" ||
          field.type === "percentage"
            ? "text"
            : inputType;
        inputHtml = `<input type="${finalType}" id="${field.id}" name="${
          field.id
        }" class="form-input" placeholder="${
          field.placeholder || ""
        }" value="${currentValue}" ${requiredAttr} />`;
        break;
    }

    // 👇 LÓGICA DE DISEÑO: Si es Tabla o Texto Largo, ocupa 2 columnas en PC
    // 'md:col-span-2' es una clase de Tailwind que hace que el elemento ocupe 2 espacios en la grilla
    const isFullWidth = field.type === "table" || field.type === "text";
    const layoutClass = isFullWidth ? "md:col-span-2" : "";

    return `
      <div class="mb-4 field-wrapper ${layoutClass}">
        <label for="${field.id}" class="block text-sm font-medium text-gray-700 mb-1">
            ${field.label} 
        </label>
        ${inputHtml}
      </div>
    `;
  }

  generateFormHtml(template, data = {}) {
    if (!template || !template.fields)
      return `<div class="p-4 text-red-600">Error: Plantilla inválida.</div>`;

    const fieldsHtml = template.fields
      .map((field) => {
        const currentValue = data[field.id] || "";
        return this.renderField(field, currentValue);
      })
      .join("");

    return `<form id="templateForm_${template.id}">${fieldsHtml}</form>`;
  }
}

export const templateFormGenerator = new TemplateFormGenerator();
