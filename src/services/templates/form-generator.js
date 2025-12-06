// src/services/templates/templates-form-generator.js

/**
 * Servicio para generar la representación HTML/DOM (formulario)
 * a partir de la definición de una plantilla (Fase IV).
 */
class TemplateFormGenerator {
  /**
   * Genera el HTML para un campo de formulario individual
   * @param {Object} field - Definición del campo de la plantilla.
   * @param {*} currentValue - Valor actual del campo (para edición).
   */
  renderField(field, currentValue = "") {
    const requiredAttr = field.required ? "required" : "";
    let inputHtml = "";

    // Mapeo básico de tipos a input HTML
    let inputType = "text";
    switch (field.type) {
      case "number":
        inputType = "number";
        break;
      case "date":
        inputType = "date";
        break;
      case "boolean":
        // Checkbox para boolean
        inputHtml = `<input type="checkbox" id="${field.id}" name="${
          field.id
        }" class="form-checkbox" ${currentValue ? "checked" : ""} />`;
        break;
      case "text":
        // Textarea para bloques largos
        inputHtml = `<textarea id="${field.id}" name="${
          field.id
        }" class="form-textarea" placeholder="${
          field.placeholder || ""
        }" ${requiredAttr}>${currentValue}</textarea>`;
        break;
      case "url":
        inputType = "url";
        break;
      case "email":
        inputType = "email";
        break;
      case "string":
      default:
        // Input tipo texto para string, url, etc.
        inputType = "text";
        inputHtml = `<input type="${inputType}" id="${field.id}" name="${
          field.id
        }" class="form-input" placeholder="${
          field.placeholder || ""
        }" value="${currentValue}" ${requiredAttr} />`;
        break;
    }

    // Si no es un checkbox/textarea, usa la estructura de input simple
    if (!inputHtml) {
      inputHtml = `<input type="${inputType}" id="${field.id}" name="${
        field.id
      }" class="form-input" placeholder="${
        field.placeholder || ""
      }" value="${currentValue}" ${requiredAttr} />`;
    }

    // Estructura envolvente del campo
    return `
      <div class="mb-4">
        <label for="${
          field.id
        }" class="block text-sm font-medium text-gray-700">
            ${field.label} 
            ${
              field.sensitive
                ? '<i class="fas fa-lock text-red-500 ml-1" title="Campo Sensible"></i>'
                : ""
            }
        </label>
        ${inputHtml}
      </div>
    `;
  }

  /**
   * Genera el formulario completo para una plantilla
   */
  generateFormHtml(template, data = {}) {
    if (!template || !template.fields) {
      return `<div class="p-4 text-red-600">Error: Plantilla inválida.</div>`;
    }

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
