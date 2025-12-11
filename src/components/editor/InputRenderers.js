// src/components/editor/InputRenderers.js

/**
 * Genera el HTML para un input de celda de tabla basado en su configuración.
 * @param {Object} col - La definición de la columna (campo).
 * @param {any} val - El valor actual.
 */
export function renderCellInput(col, val) {
  const commonClass =
    "w-full text-sm border-0 bg-transparent focus:ring-0 p-2 placeholder-slate-300 font-medium text-slate-700";
  const value = val !== undefined && val !== null ? val : "";

  // 1. TIPO URL (Complejo: Link + Texto)
  if (col.type === "url") {
    let urlVal = val?.url || (typeof val === "string" ? val : "") || "";
    let textVal = val?.text || "";

    // Guardamos el objeto JSON en un input oculto para que el sistema lo lea fácil
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

  // 2. TIPO SECRETO (Password con toggle)
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

  // 3. TIPO BOOLEAN (Checkbox)
  if (col.type === "boolean") {
    return `
        <div class="flex justify-center items-center h-full py-2">
            <input type="checkbox" class="w-5 h-5 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer cell-input transition-all" 
                   data-col-id="${col.id}" ${value ? "checked" : ""}>
        </div>`;
  }

  // 4. TIPO SELECT
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

  // 5. TIPOS SIMPLES (Texto, Número, Moneda, Fecha)
  const isNumeric = ["number", "currency", "percentage"].includes(col.type);
  const inputClass = `${commonClass} ${
    isNumeric ? "font-mono text-right math-input" : ""
  }`;
  const placeholder = isNumeric
    ? "0.00"
    : col.type === "date"
    ? ""
    : "Escribir...";
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
