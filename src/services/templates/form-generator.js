// src/services/templates/form-generator.js
import { getFieldTypeMetadata } from "../../utils/field-types-config.js";

/**
 * Servicio para generar la representación HTML/DOM con estilos Tailwind Nativos
 */
class TemplateFormGenerator {
  get inputBaseClass() {
    return "block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm placeholder-slate-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none";
  }

  renderField(field, currentValue = "") {
    if (!field || !field.type)
      return `<p class="text-red-500 text-xs">Error: Campo sin tipo.</p>`;

    const requiredAttr = field.required ? "required" : "";
    const metadata = getFieldTypeMetadata(field.type);
    let inputType = metadata?.inputType || "text";
    let inputHtml = "";

    // --- SEPARADOR (NUEVO) ---
    if (inputType === "separator") {
      return `
            <div class="col-span-1 md:col-span-2 mt-6 mb-2 group animate-fade-in">
                <div class="flex items-center gap-4">
                    <h3 class="text-lg font-bold text-slate-700 whitespace-nowrap">${field.label}</h3>
                    <div class="h-px bg-slate-200 w-full rounded-full"></div>
                </div>
            </div>
        `;
    }

    // 1. Checkbox
    if (inputType === "checkbox") {
      inputHtml = `
        <div class="flex items-center h-full min-h-[50px]">
          <label class="relative inline-flex items-center cursor-pointer group">
            <input type="checkbox" id="${field.id}" name="${field.id}" 
                   class="peer sr-only form-checkbox" ${
                     currentValue ? "checked" : ""
                   } />
            <div class="w-12 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 transition-colors"></div>
            <span class="ml-3 text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors">Habilitado</span>
          </label>
        </div>`;
    }
    // 2. Textarea
    else if (inputType === "textarea") {
      inputHtml = `<textarea id="${field.id}" name="${field.id}" rows="4"
        class="${this.inputBaseClass} resize-y" 
        placeholder="${
          field.placeholder || "Escribe aquí..."
        }" ${requiredAttr}>${currentValue}</textarea>`;
    }
    // 3. URL
    else if (inputType === "url") {
      let urlVal =
        currentValue?.url ||
        (typeof currentValue === "string" ? currentValue : "");
      let textVal = currentValue?.text || "";

      inputHtml = `
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 url-group p-1">
             <div class="relative group/url">
               <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Enlace Web</label>
               <div class="absolute inset-y-0 left-0 pl-4 top-6 flex items-center pointer-events-none text-slate-400 group-focus-within/url:text-blue-500 transition-colors"><i class="fas fa-link text-sm"></i></div>
               <input type="url" id="${field.id}_url" class="${this.inputBaseClass} pl-11 font-mono text-blue-600" placeholder="https://..." value="${urlVal}" ${requiredAttr} />
             </div>
             <div class="relative group/text">
               <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Nombre Visible (Opcional)</label>
               <div class="absolute inset-y-0 left-0 pl-4 top-6 flex items-center pointer-events-none text-slate-400 group-focus-within/text:text-slate-600 transition-colors"><i class="fas fa-font text-sm"></i></div>
               <input type="text" id="${field.id}_text" class="${this.inputBaseClass} pl-11" placeholder="Ej: Acceso Cliente" value="${textVal}" />
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
        <div class="relative group/select">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within/select:text-primary transition-colors"><i class="fas fa-list-ul"></i></div>
          <select id="${field.id}" name="${field.id}" class="${
        this.inputBaseClass
      } appearance-none cursor-pointer pl-11" ${requiredAttr}>
            <option value="" disabled ${
              !currentValue ? "selected" : ""
            }>Seleccionar opción...</option>
            ${optionsHtml}
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400"><i class="fas fa-chevron-down text-xs"></i></div>
        </div>`;
    }
    // 5. Tabla
    else if (inputType === "table") {
      const headers = (field.columns || [])
        .map(
          (c) =>
            `<th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100 first:rounded-tl-lg">${c.label}</th>`
        )
        .join("");
      const rowsData = Array.isArray(currentValue) ? currentValue : [];
      inputHtml = `
        <div class="table-input-container w-full overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100/50" data-field-id="${
          field.id
        }">
          <input type="hidden" id="${field.id}" name="${
        field.id
      }" value='${JSON.stringify(rowsData)}' class="form-table-data">
          <div class="overflow-x-auto custom-scrollbar">
            <table class="min-w-full divide-y divide-slate-100">
              <thead><tr>${headers}<th class="w-12 bg-slate-50 border-b border-slate-100 rounded-tr-lg"></th></tr></thead>
              <tbody class="bg-white divide-y divide-slate-100 table-body"></tbody>
            </table>
          </div>
          <button type="button" class="add-row-btn w-full py-3.5 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-wide transition-colors border-t border-slate-100 flex items-center justify-center gap-2 group">
            <i class="fas fa-plus-circle group-hover:scale-110 transition-transform"></i> Agregar Registro
          </button>
        </div>
        <script type="application/json" class="columns-def">${JSON.stringify(
          field.columns || []
        )}</script>
      `;
    }
    // 6. Secret (Toggle)
    else if (field.type === "secret") {
      inputHtml = `
        <div class="relative group/pass">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within/pass:text-secondary transition-colors"><i class="fas fa-key"></i></div>
            <input type="password" id="${field.id}" name="${field.id}" class="${this.inputBaseClass} pl-11 pr-12 font-mono tracking-wider" placeholder="••••••••" value="${currentValue}" ${requiredAttr} />
            <button type="button" class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-secondary cursor-pointer focus:outline-none transition-colors toggle-pass-visibility" tabindex="-1"><i class="fas fa-eye"></i></button>
        </div>
        <script>
            document.currentScript.previousElementSibling.querySelector('.toggle-pass-visibility').onclick = function(e) {
                const input = e.currentTarget.previousElementSibling;
                const icon = e.currentTarget.querySelector('i');
                if(input.type === 'password') { input.type = 'text'; icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); e.currentTarget.classList.add('text-secondary'); } 
                else { input.type = 'password'; icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); e.currentTarget.classList.remove('text-secondary'); }
            };
        </script>
      `;
    }
    // 7. Inputs estándar
    else {
      let finalType = ["number", "currency", "percentage"].includes(field.type)
        ? "text"
        : inputType;
      let icon = "";
      let extraClasses = "";
      if (field.type === "email") icon = "fa-envelope";
      else if (field.type === "date") icon = "fa-calendar-alt";
      else if (field.type === "currency") {
        icon = "fa-dollar-sign";
        extraClasses = "font-mono text-right";
      } else if (field.type === "percentage") {
        icon = "fa-percent";
        extraClasses = "font-mono text-right";
      } else if (field.type === "number") {
        icon = "fa-hashtag";
        extraClasses = "font-mono text-right";
      }

      const iconHtml = icon
        ? `<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within/std:text-primary transition-colors"><i class="fas ${icon}"></i></div>`
        : "";
      const paddingClass = icon ? "pl-11" : "";
      inputHtml = `<div class="relative group/std">${iconHtml}<input type="${finalType}" id="${
        field.id
      }" name="${field.id}" class="${
        this.inputBaseClass
      } ${paddingClass} ${extraClasses}" placeholder="${
        field.placeholder || ""
      }" value="${currentValue}" ${requiredAttr} /></div>`;
    }

    const isFullWidth = [
      "table",
      "text",
      "url",
      "textarea",
      "separator",
    ].includes(field.type);
    const layoutClass = isFullWidth ? "md:col-span-2" : "md:col-span-1";

    return `
      <div class="field-wrapper ${layoutClass} group animate-fade-in-up">
        ${
          inputType !== "separator"
            ? `<label for="${
                field.id
              }" class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 ml-1 flex items-center justify-between"><span>${
                field.label
              }</span>${
                field.required
                  ? '<span class="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded border border-red-100 font-bold">REQ</span>'
                  : ""
              }</label>`
            : ""
        }
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
