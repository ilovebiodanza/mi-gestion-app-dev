import { getLocalCurrency } from "../../utils/helpers.js";

export function printDocument(
  documentMetadata,
  template,
  decryptedData,
  isCompact = false
) {
  const existingIframe = document.getElementById("print-target-iframe");
  if (existingIframe) {
    document.body.removeChild(existingIframe);
  }
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  const currencyConfig = getLocalCurrency();

  const contentHtml = generatePrintHtml(
    documentMetadata,
    template,
    decryptedData,
    currencyConfig,
    isCompact
  );

  doc.open();
  doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${documentMetadata.title}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                @media print {
                    /* Márgenes: Compacto = 1cm, Estándar = 1.5cm */
                    @page { margin: ${
                      isCompact ? "1cm" : "1.5cm"
                    }; size: auto; }
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .page-break { break-inside: avoid; }
                }
                body { 
                    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    padding: 20px; 
                    background-color: white;
                }
            </style>
        </head>
        <body>
            ${contentHtml}
            <script>
                window.onload = () => {
                    setTimeout(() => {
                        window.print();
                        // window.parent.document.body.removeChild(window.frameElement);
                    }, 800);
                };
            </script>
        </body>
        </html>
    `);
  doc.close();
}

function generatePrintHtml(
  metadata,
  template,
  data,
  currencyConfig,
  isCompact
) {
  const date = new Date(metadata.updatedAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const docId = metadata.id || "SIN-ID";

  // --- 1. HEADER ---
  let headerHtml = "";

  if (isCompact) {
    // HEADER COMPACTO (Ahorro de tinta y espacio)
    headerHtml = `
        <div class="flex justify-between items-end border-b-2 border-slate-800 pb-2 mb-4">
            <div class="flex items-center gap-3">
                <div class="text-xl w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    ${template.icon || '<i class="fas fa-file"></i>'}
                </div>
                <div>
                    <h1 class="text-xl font-bold text-slate-900 leading-none">${
                      metadata.title
                    }</h1>
                    <p class="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">${
                      template.name
                    }</p>
                </div>
            </div>
            <div class="text-right text-[10px] text-slate-400">
                <p>Actualizado: ${date}</p>
                <p>ID: ${docId.substring(0, 8)}</p>
            </div>
        </div>`;
  } else {
    // HEADER ESTÁNDAR (Idéntico a Pantalla)
    headerHtml = `
        <div class="relative overflow-hidden mb-8 rounded-3xl border border-slate-100 shadow-sm print:shadow-none">
             <div class="absolute inset-0 opacity-10" style="background-color: ${
               template.color || "#3b82f6"
             }"></div>
             <div class="absolute top-0 left-0 w-full h-1.5" style="background-color: ${
               template.color || "#3b82f6"
             }"></div>
             
             <div class="relative z-10 flex gap-6 items-start p-8">
                <div class="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-md bg-white" style="color: ${
                  template.color || "#3b82f6"
                }">
                    ${template.icon || '<i class="fas fa-file"></i>'}
                </div>
                <div>
                   <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight leading-tight mb-2">${
                     metadata.title
                   }</h1>
                   <div class="flex flex-wrap items-center gap-3 text-sm">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-lg font-bold text-xs uppercase tracking-wide bg-white/60 border border-slate-200/50 text-slate-600 backdrop-blur-sm">${
                        template.name
                      }</span>
                      <span class="text-slate-500 flex items-center text-xs"><i class="far fa-clock mr-1.5"></i> ${date}</span>
                      <span class="text-slate-400 text-[10px] font-mono">ID: ${docId}</span>
                   </div>
                </div>
             </div>
        </div>`;
  }

  // --- 2. GRID CONFIG ---
  // Compacto: 4 columnas. Estándar: 2 columnas (igual que pantalla PC).
  const gridCols = isCompact
    ? "grid-cols-4 gap-x-4 gap-y-2"
    : "grid-cols-2 gap-6";

  let html = `
        ${headerHtml}
        <div class="grid ${gridCols}">
    `;

  // --- 3. LOOP DE CAMPOS ---
  template.fields.forEach((field) => {
    const value = data[field.id];

    // Determinar ancho (ColSpan)
    let spanClass = "col-span-1";
    const isWideType = ["separator", "table", "text", "textarea"].includes(
      field.type
    );

    if (isCompact) {
      spanClass = isWideType ? "col-span-4" : "col-span-1";
    } else {
      // En Estándar: Tablas, separadores y textos largos ocupan todo (2 cols). El resto mitad (1 col).
      spanClass = isWideType ? "col-span-2" : "col-span-1";
    }

    // A) SEPARADORES
    if (field.type === "separator") {
      const sepStyle = isCompact
        ? "mt-4 border-b border-slate-300 pb-1 mb-1 text-sm"
        : "mt-6 border-b border-slate-200 pb-2 mb-2 text-lg";

      html += `
                <div class="${spanClass} ${sepStyle} page-break">
                    <h3 class="font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        ${
                          !isCompact
                            ? '<div class="w-1.5 h-6 bg-slate-400 rounded-full"></div>'
                            : ""
                        } 
                        ${field.label}
                    </h3>
                </div>`;
      return;
    }

    // B) TABLAS
    if (field.type === "table") {
      html += `<div class="${spanClass}">${renderPrintTable(
        field,
        value,
        currencyConfig,
        isCompact
      )}</div>`;
      return;
    }

    // C) CAMPOS NORMALES
    const displayValue = formatPrintValue(
      field.type,
      value,
      currencyConfig,
      isCompact
    );

    if (isCompact) {
      // MODO COMPACTO (Sin cajas, líneas simples)
      html += `
            <div class="${spanClass} border-b border-slate-200 py-1 page-break">
              <dt class="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">${field.label}</dt>
              <dd class="text-xs font-semibold text-slate-900 whitespace-pre-wrap leading-tight mt-0.5">${displayValue}</dd>
            </div>`;
    } else {
      // MODO ESTÁNDAR (Tarjeta idéntica a pantalla pero con PADDING REDUCIDO)
      // Original pantalla: p-4. Nuevo impresión: px-4 py-2.
      html += `
            <div class="${spanClass} bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 page-break">
              <dt class="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-2">
                 ${field.label}
              </dt>
              <dd class="text-sm text-slate-800 break-words leading-relaxed font-medium">
                 ${displayValue}
              </dd>
            </div>`;
    }
  });

  html += `</div>`;

  // Footer solo en modo estándar
  if (!isCompact) {
    html += `
        <div class="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
           <div class="flex items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                <i class="fas fa-shield-alt mr-2"></i> Documento Confidencial
           </div>
           <div class="text-slate-300 text-[10px]">Generado por Mi Gestión</div>
        </div>`;
  }

  return html;
}

// --- HELPERS ---

function renderPrintTable(field, rows, currencyConfig, isCompact) {
  if (!Array.isArray(rows) || rows.length === 0) {
    if (isCompact) return "";
    return `<div class="p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-center text-xs text-slate-400 flex flex-col items-center gap-2"><i class="fas fa-table text-xl opacity-20"></i>Tabla vacía</div>`;
  }

  const padding = isCompact ? "px-2 py-1" : "px-4 py-2";
  const fontSize = isCompact ? "text-[10px]" : "text-xs";
  const cellClass = isCompact ? "text-[11px]" : "text-sm text-slate-600";

  const headers = field.columns
    .map(
      (c) =>
        `<th class="${padding} text-left ${fontSize} font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 bg-slate-50">${c.label}</th>`
    )
    .join("");

  const body = rows
    .map((row) => {
      const cells = field.columns
        .map(
          (col) =>
            `<td class="${padding} ${cellClass} border-b border-slate-50 align-top">${formatPrintValue(
              col.type,
              row[col.id],
              currencyConfig,
              isCompact
            )}</td>`
        )
        .join("");
      return `<tr class="page-break">${cells}</tr>`;
    })
    .join("");

  return `
        <div class="mt-2 mb-2 page-break">
            ${
              !isCompact
                ? `<div class="flex items-center mb-2 gap-2"><label class="text-xs font-bold text-slate-400 uppercase"><i class="fas fa-table"></i> ${field.label}</label></div>`
                : ""
            }
            <div class="border border-slate-200 ${
              isCompact ? "rounded" : "rounded-xl"
            } overflow-hidden bg-white">
                <table class="min-w-full w-full">
                    <thead><tr>${headers}</tr></thead>
                    <tbody>${body}</tbody>
                </table>
            </div>
        </div>`;
}

/**
 * Devuelve HTML formateado con clases para asegurar que se vea IGUAL que en pantalla.
 * (Negritas, colores, fondos, etc.)
 */
function formatPrintValue(type, value, currencyConfig, isCompact) {
  // 1. Manejo de vacíos
  if (value === undefined || value === null || value === "") {
    return isCompact
      ? "—"
      : '<span class="text-slate-300 italic text-xs">Vacío</span>';
  }

  // 2. Manejo de OBJETOS (URL / Imagen)
  if (typeof value === "object" && value.url) {
    // CASO A: IMAGEN (Miniatura)
    if (type === "url" && value.url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
      const size = isCompact ? "w-8 h-8" : "w-12 h-12";
      const textSize = isCompact ? "text-[10px]" : "text-sm";

      return `<div class="flex items-center gap-3">
                        <div class="relative rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-50 ${size} flex-shrink-0">
                            <img src="${
                              value.url
                            }" class="w-full h-full object-cover">
                        </div>
                        <span class="${textSize} font-bold text-slate-700 break-words">${
        value.text || "Imagen"
      }</span>
                     </div>`;
    }

    // CASO B: ENLACE NORMAL (Texto + URL)
    // Aquí aplicamos tu requerimiento: Texto normal + URL pequeña abajo, sin azul ni subrayado.
    const displayText = value.text || value.url;
    const urlText = value.url;

    // Estilos base
    const mainTextClass = isCompact
      ? "text-xs font-bold text-slate-800"
      : "text-sm font-bold text-slate-800";
    const subTextClass = isCompact
      ? "text-[9px] text-slate-400"
      : "text-[10px] text-slate-400";

    // Si el texto es idéntico a la URL, solo imprimimos la URL limpia
    if (displayText === urlText) {
      return `<div class="${
        isCompact ? "text-[10px]" : "text-sm"
      } text-slate-600 break-all font-mono">${urlText}</div>`;
    }

    // Si hay texto descriptivo (Ej: "Sitio Web Empresa"), imprimimos texto + url abajo
    return `
        <div class="flex flex-col">
            <span class="${mainTextClass} leading-tight">${displayText}</span>
            <span class="${subTextClass} break-all font-mono mt-0.5 leading-tight">${urlText}</span>
        </div>`;
  }

  // 3. TIPOS DE DATOS SIMPLES (Manteniendo estilos de pantalla)
  switch (type) {
    case "boolean":
      return value
        ? '<span class="inline-flex items-center gap-1 font-bold text-emerald-700 text-xs"><i class="fas fa-check"></i> Sí</span>'
        : '<span class="inline-flex items-center gap-1 font-bold text-slate-500 text-xs">No</span>';

    case "currency":
      const formatted = new Intl.NumberFormat(currencyConfig.locale, {
        style: "currency",
        currency: currencyConfig.codigo,
      }).format(Number(value));
      // Fondo gris claro para resaltar cifras monetarias
      return `<span class="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-xs border border-slate-200 inline-block">${formatted}</span>`;

    case "percentage":
      return `<span class="font-mono font-bold text-slate-800">${value}%</span>`;

    case "date":
      try {
        const [y, m, d] = String(value).split("-");
        // Negrita en la fecha para legibilidad
        return `<span class="font-bold text-slate-700 flex items-center gap-1.5"><i class="far fa-calendar text-slate-400 text-xs"></i> ${d}/${m}/${y}</span>`;
      } catch (e) {
        return value;
      }

    case "text":
    case "textarea":
      // Texto normal
      return `<div class="whitespace-pre-line text-slate-700 ${
        isCompact ? "text-xs" : "text-sm"
      }">${value}</div>`;

    default:
      return String(value);
  }
}
