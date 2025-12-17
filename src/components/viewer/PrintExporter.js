// src/components/viewer/PrintExporter.js
import { getLocalCurrency } from "../../utils/helpers.js";

export const printDocument = (
  documentMetadata,
  template,
  decryptedData,
  printMode = "standard" // 'standard' | 'compact' | 'accessible'
) => {
  const isCompact = printMode === "compact";
  const isAccessible = printMode === "accessible";

  // 1. LIMPIEZA
  const iframeId = "print-target-iframe";
  const oldFrames = document.querySelectorAll(
    `#${iframeId}, iframe[name='print_frame']`
  );
  oldFrames.forEach((frame) => frame.remove());

  // 2. CREACIÓN
  const iframe = document.createElement("iframe");
  iframe.id = iframeId;
  iframe.name = "print_frame";

  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
    visibility: "hidden",
    zIndex: "-1",
  });

  document.body.appendChild(iframe);

  const currencyConfig = getLocalCurrency();
  const contentHtml = generatePrintHtml(
    documentMetadata,
    template,
    decryptedData,
    currencyConfig,
    printMode
  );

  // CONFIGURACIÓN DE PÁGINA SEGÚN MODO
  // Standard: 1.5cm | Compacto: 1cm | Lectura Fácil: 0.5cm (mínimo)
  let pageMargin = "1.5cm";
  if (isCompact) pageMargin = "1cm";
  if (isAccessible) pageMargin = "0.5cm";

  // FUENTE SEGÚN MODO
  // Standard: 12px | Compacto: 9px (apretado) | Lectura Fácil: 16px (grande)
  let baseFontSize = "12px";
  if (isCompact) baseFontSize = "9px"; // Compacto original
  if (isAccessible) baseFontSize = "16px"; // Lectura fácil

  // COLOR
  // Accessible fuerza negro puro (#000000)
  const baseColor = isAccessible ? "#000000" : "#0f172a";
  const lineHeight = isAccessible ? "1.4" : "1.5";
  const fontFamily = isAccessible ? "Arial, sans-serif" : "'Inter', sans-serif";

  const fullHtml = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>${documentMetadata.title || "Impresión"}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            
            <style>
                @media print {
                    @page { 
                        margin: ${pageMargin}; 
                        size: auto; 
                    }
                    body { 
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important; 
                    }
                    .page-break { break-inside: avoid; }
                }
                
                body { 
                    font-family: ${fontFamily};
                    background-color: white;
                    color: ${baseColor};
                    font-size: ${baseFontSize};
                    line-height: ${lineHeight};
                }

                .print-card {
                    background-color: white !important;
                    border: 1px solid #e2e8f0;
                    box-shadow: none !important;
                }
                
                /* Forzar contraste máximo en modo Lectura Fácil */
                ${
                  isAccessible
                    ? `
                    .text-slate-500, .text-slate-400, .text-slate-300, .text-slate-900 {
                        color: #000000 !important;
                    }
                    .border-slate-100, .border-slate-200 {
                        border-color: #000000 !important;
                    }
                    /* Engrosar textos para legibilidad */
                    dd, span, p { font-weight: 600 !important; }
                `
                    : ""
                }
            </style>
        </head>
        <body class="antialiased">
            ${contentHtml}
            <script>
                window.onload = () => {
                    setTimeout(() => {
                        window.focus();
                        window.print();
                    }, 800);
                };
            </script>
        </body>
        </html>
    `;

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(fullHtml);
  doc.close();
};

function generatePrintHtml(
  metadata,
  template,
  data,
  currencyConfig,
  printMode
) {
  const isCompact = printMode === "compact";
  const isAccessible = printMode === "accessible"; // Modo Lectura Fácil

  let date = "Fecha desconocida";
  try {
    date = new Date(metadata.updatedAt).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch (e) {}

  const docId = metadata.id || "SIN-ID";
  const accentColor = template.color || "#0f172a";

  // --- 1. ENCABEZADO ---
  let headerHtml = "";

  // USAMOS EL DISEÑO COMPACTO PARA 'COMPACTO' Y 'LECTURA FÁCIL'
  if (isCompact || isAccessible) {
    headerHtml = `
        <div class="flex justify-between items-end border-b-2 border-black pb-2 mb-4">
            <div class="flex items-center gap-3">
                <div class="${isAccessible ? "text-2xl" : "text-lg"}">
                    ${template.icon || '<i class="fas fa-file"></i>'}
                </div>
                <div>
                    <h1 class="${
                      isAccessible ? "text-3xl" : "text-xl"
                    } font-bold leading-none">${metadata.title}</h1>
                    <p class="${
                      isAccessible
                        ? "text-sm mt-1 font-bold uppercase"
                        : "text-[10px] text-slate-500 mt-1 uppercase tracking-widest"
                    }">${template.name}</p>
                </div>
            </div>
            <div class="text-right ${isAccessible ? "text-sm" : "text-[10px]"}">
                <p class="font-bold">${date}</p>
                <p class="${
                  isAccessible ? "" : "text-slate-400"
                } font-mono">ID: ${docId.substring(0, 8)}</p>
            </div>
        </div>`;
  } else {
    // ESTILO STANDARD (Visual)
    headerHtml = `
        <div class="mb-10">
             <div class="flex justify-between items-start">
                <div class="flex gap-5 items-center">
                    <div class="w-16 h-16 flex items-center justify-center text-3xl border border-slate-200 rounded-lg text-slate-800 bg-white">
                        ${template.icon || '<i class="fas fa-file"></i>'}
                    </div>
                    <div>
                       <h1 class="text-3xl font-bold text-slate-900 leading-tight mb-1">${
                         metadata.title
                       }</h1>
                       <div class="flex items-center gap-3 text-sm text-slate-500">
                          <span class="font-semibold uppercase tracking-wide text-xs" style="color:${accentColor}">${
      template.name
    }</span>
                          <span class="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span>${date}</span>
                       </div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="inline-block bg-slate-50 border border-slate-200 px-3 py-1 rounded text-[10px] font-mono text-slate-500">
                        ID: ${docId}
                    </div>
                </div>
             </div>
             <div class="w-full h-1 mt-6 bg-slate-100 relative">
                <div class="absolute top-0 left-0 h-full w-24" style="background-color: ${accentColor}"></div>
             </div>
        </div>`;
  }

  // --- 2. CUERPO ---
  // Lógica de Grilla:
  // Compacto original: 4 columnas.
  // Lectura Fácil: 2 columnas (para que quepa la letra grande).
  let gridCols = "grid-cols-2 gap-x-8 gap-y-6"; // Standard
  if (isCompact) gridCols = "grid-cols-4 gap-4";
  if (isAccessible) gridCols = "grid-cols-2 gap-4"; // Modificado: 2 Cols pero estilo compacto

  let html = `${headerHtml}<div class="grid ${gridCols}">`;

  template.fields.forEach((field) => {
    const value = data[field.id];

    // Cálculo de Span
    let spanClass = "col-span-1";
    const isWideType =
      ["separator", "table", "textarea"].includes(field.type) ||
      (field.type === "text" && String(value).length > 60);

    if (isAccessible) {
      // En modo accesible, los campos anchos ocupan las 2 columnas
      spanClass = isWideType ? "col-span-2" : "col-span-1";
    } else if (isCompact) {
      spanClass = isWideType ? "col-span-4" : "col-span-1";
    } else {
      spanClass = isWideType ? "col-span-2" : "col-span-1";
    }

    // A) SEPARADORES
    if (field.type === "separator") {
      html += `
            <div class="${spanClass} mt-4 mb-2 page-break border-b-2 border-black">
                <h3 class="${
                  isAccessible ? "text-lg" : "text-sm"
                } font-bold uppercase tracking-wider pb-1 flex items-center gap-2">
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
        printMode
      )}</div>`;
      return;
    }

    // C) CAMPOS
    const displayValue = formatPrintValue(
      field,
      value,
      currencyConfig,
      printMode
    );

    // USAMOS EL DISEÑO COMPACTO PARA 'COMPACTO' Y 'LECTURA FÁCIL'
    // La diferencia es que 'isAccessible' tendrá clases CSS inyectadas para letra grande.
    if (isCompact || isAccessible) {
      // Diseño "Estilo Compacto" (Label pequeña arriba, Valor abajo, linea divisoria)
      // En Accessible se ve igual, pero todo es más grande gracias al font-size del body.
      html += `
            <div class="${spanClass} border-b border-slate-100 py-1 page-break">
              <span class="${
                isAccessible ? "text-xs" : "text-[9px]"
              } font-bold text-slate-500 uppercase mr-1 block">${
        field.label
      }:</span>
              <span class="${
                isAccessible ? "text-base" : "text-[10px]"
              } font-semibold text-slate-900">${displayValue}</span>
            </div>`;
    } else {
      // Diseño Standard
      html += `
            <div class="${spanClass} page-break mb-2">
              <dt class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">${field.label}</dt>
              <dd class="text-sm text-slate-900 border-b border-slate-100 pb-1 font-medium leading-relaxed">${displayValue}</dd>
            </div>`;
    }
  });

  html += `</div>`;

  // --- 3. PIE DE PÁGINA ---
  // Solo mostramos footer si NO es compacto/accesible (para ahorrar espacio al máximo)
  if (!isCompact && !isAccessible) {
    html += `
        <div class="border-t border-slate-200 text-slate-400 mt-16 pt-6 flex items-center justify-between">
           <div class="flex items-center text-[10px] font-bold uppercase tracking-widest gap-2">
                <i class="fas fa-lock text-slate-300"></i>
                <span>Documento Protegido (E2EE)</span>
           </div>
           <div class="text-[9px]">
                ${new Date().toLocaleString()}
           </div>
        </div>`;
  }

  return html;
}

// --- HELPERS ---

function renderPrintTable(field, rows, currencyConfig, printMode) {
  const isCompact = printMode === "compact";
  const isAccessible = printMode === "accessible";

  if (!Array.isArray(rows) || rows.length === 0) {
    if (isCompact || isAccessible) return "";
    return `<div class="py-2 text-xs italic text-center border-b border-slate-100">${field.label} (Sin datos)</div>`;
  }

  let padding = "px-2 py-2";
  let fontSize = "text-[11px]";

  if (isCompact) {
    padding = "px-1 py-1";
    fontSize = "text-[9px]";
  }
  if (isAccessible) {
    padding = "px-1 py-1"; // Padding reducido
    fontSize = "text-sm"; // Letra más grande en tablas
  }

  const headers = field.columns
    .map(
      (c) =>
        `<th class="${padding} text-left ${fontSize} font-bold uppercase tracking-wider border-b-2 border-black">${c.label}</th>`
    )
    .join("");

  const body = rows
    .map((row) => {
      const cells = field.columns
        .map(
          (col) =>
            `<td class="${padding} ${fontSize} border-b border-slate-200 align-top">${formatPrintValue(
              col,
              row[col.id],
              currencyConfig,
              printMode
            )}</td>`
        )
        .join("");
      return `<tr class="page-break">${cells}</tr>`;
    })
    .join("");

  return `
        <div class="mt-2 mb-4 page-break w-full">
            ${
              !isCompact // En compacto a veces se oculta el label si es obvio, pero aquí lo dejamos
                ? `<label class="block text-[10px] font-bold uppercase mb-1">${field.label}</label>`
                : `<label class="block text-[10px] font-bold uppercase mb-1 border-b border-black">${field.label}</label>`
            }
            <table class="w-full border-collapse">
                <thead><tr>${headers}</tr></thead>
                <tbody>${body}</tbody>
            </table>
        </div>`;
}

function formatPrintValue(field, value, currencyConfig, printMode) {
  const isCompact = printMode === "compact";
  const isAccessible = printMode === "accessible";
  const type = field.type;

  if (value === undefined || value === null || value === "") {
    if (isAccessible) return "—";
    return isCompact ? "—" : '<span class="text-slate-300 italic">Vacío</span>';
  }

  if (typeof value === "object" && value.url) {
    // Imágenes
    if (type === "url" && value.url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
      // En accesible las imágenes se ven un poco más grandes que en compacto para distinguirlas
      const size = isCompact
        ? "w-6 h-6"
        : isAccessible
        ? "w-10 h-10"
        : "w-12 h-12";
      return `<div class="flex items-center gap-2">
                <img src="${
                  value.url
                }" class="${size} object-cover rounded border border-slate-200 bg-slate-50">
                <span class="${
                  isAccessible ? "text-sm" : "text-xs"
                } font-medium">${value.text || "Imagen"}</span>
             </div>`;
    }
    return `<span class="text-xs font-medium">${
      value.text || value.url
    }</span>`;
  }

  switch (type) {
    case "boolean":
      return value ? "SÍ" : "NO";

    case "currency":
      const symbol = field.currencySymbol || "$";
      let formatted;
      try {
        formatted = new Intl.NumberFormat("es-ES", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(Number(value));
      } catch (e) {
        formatted = value;
      }
      return `<span class="font-mono font-bold whitespace-nowrap">${symbol} ${formatted}</span>`;

    case "date":
      try {
        const [y, m, d] = String(value).split("-");
        return `${d}/${m}/${y}`;
      } catch (e) {
        return value;
      }
    default:
      return `<span class="whitespace-pre-wrap">${String(value)}</span>`;
  }
}
