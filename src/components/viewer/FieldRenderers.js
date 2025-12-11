import { detectMediaType } from "../../utils/helpers.js";

/**
 * Renderiza el HTML para un campo tipo URL (Audio, Imagen, Link).
 * Implementa el diseño de botón lateral + texto.
 */
export function renderUrlField(value, isTableContext = false) {
  let url = typeof value === "object" ? value.url : value;
  let text = typeof value === "object" ? value.text || url : value;

  if (!url) return '<span class="text-slate-300 italic text-xs">--</span>';

  const mediaType = detectMediaType(url);
  const display =
    text === url
      ? mediaType === "audio"
        ? "Archivo de Audio"
        : "Imagen Adjunta"
      : text;

  // Recortar texto si es muy largo en tabla
  const displayText =
    isTableContext && display.length > 25
      ? display.substring(0, 22) + "..."
      : display;

  // --- LÓGICA DE MEDIOS (Audio / Imagen) ---
  if (mediaType === "audio" || mediaType === "image") {
    const icon = mediaType === "audio" ? "fa-music" : "fa-image";
    const colorClass =
      mediaType === "audio"
        ? "text-pink-500 group-hover:text-pink-600"
        : "text-indigo-500 group-hover:text-indigo-600";
    const bgClass =
      mediaType === "audio"
        ? "bg-pink-50 group-hover:bg-pink-100"
        : "bg-indigo-50 group-hover:bg-indigo-100";

    // Botón circular a la izquierda + Texto enlace
    return `
            <div class="flex items-center gap-3 group">
                <button type="button" 
                        class="trigger-media-btn w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 ${bgClass} transition-all shadow-sm hover:scale-105"
                        data-type="${mediaType}" 
                        data-src="${url}" 
                        data-title="${display}"
                        title="Ver ${
                          mediaType === "audio" ? "Audio" : "Imagen"
                        }">
                    <i class="fas ${icon} ${colorClass} text-sm"></i>
                </button>
                <a href="${url}" target="_blank" class="text-sm font-medium text-slate-700 hover:text-primary hover:underline truncate">
                    ${displayText}
                    <i class="fas fa-external-link-alt text-[10px] ml-1 text-slate-300"></i>
                </a>
            </div>
        `;
  }

  // --- ENLACE NORMAL ---
  return `
        <a href="${url}" target="_blank" class="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors break-all text-sm">
            <i class="fas fa-link text-xs opacity-50 flex-shrink-0"></i> ${displayText}
        </a>`;
}

// Renderizadores simples
export function renderBoolean(value) {
  return value
    ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700"><i class="fas fa-check mr-1"></i> Sí</span>'
    : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">No</span>';
}

export function renderDate(value) {
  try {
    const [y, m, d] = String(value).split("-");
    const dateObj = new Date(y, m - 1, d);
    return `<span class="font-semibold text-slate-700"><i class="far fa-calendar text-slate-400 mr-2"></i>${dateObj.toLocaleDateString()}</span>`;
  } catch {
    return value;
  }
}

export function renderCurrency(value, currencyConfig) {
  const formatted = new Intl.NumberFormat(currencyConfig.locale, {
    style: "currency",
    currency: currencyConfig.codigo,
  }).format(Number(value));
  return `<span class="font-mono font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">${formatted}</span>`;
}

export function renderPercentage(value) {
  return `<span class="font-mono font-bold text-slate-700">${value}%</span>`;
}

export function renderSecret(value, isTableContext) {
  if (isTableContext) {
    return `<div class="group cursor-pointer select-none"><span class="blur-sm group-hover:blur-none transition-all font-mono text-xs bg-slate-100 px-1 rounded">••••••</span></div>`;
  }
  return `
        <div class="flex items-center gap-2">
            <div class="relative group overflow-hidden rounded-lg border border-slate-200 bg-white px-3 py-2 transition-all hover:border-indigo-200 hover:shadow-sm w-full">
                <span class="secret-mask filter blur-[5px] select-none transition-all duration-300 group-hover:blur-none font-mono text-sm text-slate-800 tracking-wider">••••••••••••••</span>
                <span class="secret-revealed hidden font-mono text-sm text-slate-800 select-all font-bold tracking-wide">${value}</span>
            </div>
            <button class="toggle-secret-btn w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors bg-white border border-slate-200" title="Revelar"><i class="fas fa-eye"></i></button>
            <button class="copy-btn w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors bg-white border border-slate-200" data-value="${value}" title="Copiar"><i class="far fa-copy"></i></button>
        </div>`;
}

export function renderText(value, isTableContext) {
  if (isTableContext)
    return value.length > 30 ? value.substring(0, 30) + "..." : value;
  return `<div class="prose prose-sm max-w-none text-slate-600 whitespace-pre-line">${value}</div>`;
}
