// src/components/editor/InputRenderers.js

/**
 * Genera una VISTA PREVIA de texto simple para la fila del editor.
 */
export function renderCellPreview(col, val) {
  if (val === undefined || val === null || val === "")
    return '<span class="text-slate-300 italic text-xs">--</span>';

  if (col.type === "url") {
    const urlVal = val?.url || (typeof val === "string" ? val : "") || "";
    const textVal = val?.text || "";
    const display = textVal || urlVal;
    return `<div class="flex items-center gap-1.5 overflow-hidden">
                  <i class="fas fa-link text-[10px] text-indigo-400 flex-shrink-0"></i>
                  <span class="truncate text-xs text-slate-600 font-medium" title="${urlVal}">${display}</span>
                </div>`;
  }
  if (col.type === "boolean") {
    return val
      ? '<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700"><i class="fas fa-check mr-1"></i> Sí</span>'
      : '<span class="text-slate-400 text-xs">No</span>';
  }
  if (col.type === "secret") {
    return '<span class="text-slate-400 text-xs tracking-widest">••••••</span>';
  }
  if (["currency", "percentage"].includes(col.type)) {
    return `<span class="font-mono text-xs text-slate-700 font-bold">${val}${
      col.type === "percentage" ? "%" : ""
    }</span>`;
  }
  // Vista previa corta para textos largos
  if (col.type === "textarea" || col.type === "longText") {
    const shortVal =
      typeof val === "string" && val.length > 30
        ? val.substring(0, 30) + "..."
        : val;
    return `<span class="text-xs text-slate-600 truncate block" title="${val}"><i class="fas fa-paragraph text-slate-300 mr-1"></i>${shortVal}</span>`;
  }

  return `<span class="text-xs text-slate-600 truncate block" title="${val}">${val}</span>`;
}

/**
 * Genera el HTML para un input.
 * El estilo base es "Table Cell" (transparente), pero TableRowModal lo transformará.
 */
export function renderCellInput(col, val) {
  // Clases base "desnudas" para la tabla. El modal las quitará y pondrá las suyas.
  const commonClass =
    "w-full text-sm border-0 bg-transparent focus:ring-0 p-2 placeholder-slate-300 font-medium text-slate-700";
  const value = val !== undefined && val !== null ? val : "";

  if (col.type === "url") {
    let urlVal = val?.url || (typeof val === "string" ? val : "") || "";
    let textVal = val?.text || "";
    const jsonValue = JSON.stringify({ url: urlVal, text: textVal }).replace(
      /"/g,
      "&quot;"
    );

    return `
        <div class="url-cell-group min-w-[200px] space-y-1.5 p-1">
            <input type="hidden" class="cell-input url-json-store" data-col-id="${col.id}" value="${jsonValue}">
            <div class="flex items-center bg-slate-50 rounded-lg border border-slate-200 px-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                <i class="fas fa-link text-[10px] text-slate-400 mr-2"></i>
                <input type="text" class="url-part-link w-full bg-transparent border-none text-xs py-1.5 focus:ring-0 text-blue-600 placeholder-slate-400 font-mono" 
                       placeholder="https://..." value="${urlVal}">
            </div>
            <div class="flex items-center bg-white rounded-lg border border-slate-200 px-2 focus-within:border-slate-300 transition-colors">
                <i class="fas fa-font text-[10px] text-slate-300 mr-2"></i>
                <input type="text" class="url-part-text w-full bg-transparent border-none text-xs py-1.5 focus:ring-0 text-slate-600 placeholder-slate-300" 
                       placeholder="Texto descriptivo" value="${textVal}">
            </div>
        </div>`;
  }

  if (col.type === "secret") {
    return `
        <div class="relative group p-1">
            <div class="flex items-center bg-slate-50 rounded-lg border border-slate-200 focus-within:border-secondary focus-within:bg-white transition-colors">
                <input type="password" class="${commonClass} rounded-lg cell-input" data-col-id="${col.id}" value="${value}" placeholder="••••">
                <button type="button" class="toggle-pass-cell px-3 text-slate-400 hover:text-secondary focus:outline-none" tabindex="-1">
                    <i class="fas fa-eye text-xs"></i>
                </button>
            </div>
        </div>`;
  }

  if (col.type === "boolean") {
    return `
        <div class="flex justify-center items-center h-full py-2">
            <input type="checkbox" class="w-5 h-5 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer cell-input transition-all" 
                   data-col-id="${col.id}" ${value ? "checked" : ""}>
        </div>`;
  }

  if (col.type === "select") {
    const opts = (col.options || [])
      .map(
        (o) =>
          `<option value="${o}" ${value === o ? "selected" : ""}>${o}</option>`
      )
      .join("");
    return `
        <div class="p-1">
            <select class="${commonClass} bg-slate-50 rounded-lg cursor-pointer cell-input" data-col-id="${col.id}">
                <option value="">--</option>
                ${opts}
            </select>
        </div>`;
  }

  // AQUÍ ESTÁ LA LÓGICA DEL TEXTAREA
  if (col.type === "textarea" || col.type === "longText") {
    return `
      <div class="p-1">
        <textarea class="${commonClass} rounded-lg hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all cell-input resize-y min-h-[40px]" 
                  data-col-id="${col.id}" 
                  rows="1"
                  placeholder="Escribir...">${value}</textarea>
      </div>`;
  }

  const isNumeric = ["number", "currency", "percentage"].includes(col.type);
  const inputClass = `${commonClass} ${
    isNumeric ? "font-mono text-right math-input" : ""
  }`;
  const placeholder = isNumeric
    ? "0.00"
    : col.type === "date"
    ? ""
    : "Escribir...";
  // Usamos 'text' incluso para números para permitir la operación matemática (ej: 15+20)
  const inputType = col.type === "date" ? "date" : "text";

  return `
    <div class="p-1">
        <input type="${inputType}" 
               class="${inputClass} rounded-lg hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all cell-input" 
               data-col-id="${col.id}" 
               value="${value}" 
               placeholder="${placeholder}">
    </div>`;
}
