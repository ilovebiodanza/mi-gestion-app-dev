// src/components/viewer/PrintExporter.js
import { getLocalCurrency } from "../../utils/helpers.js";

// Aceptamos 'printMode' en lugar de un booleano
export const printDocument = (
  documentMetadata,
  template,
  decryptedData,
  printMode = "standard" // Opciones: 'standard', 'compact', 'accessible'
) => {
  const isCompact = printMode === "compact";
  const isAccessible = printMode === "accessible";

  // 1. LIMPIEZA TOTAL
  const iframeId = "print-target-iframe";
  const oldFrames = document.querySelectorAll(
    `#${iframeId}, iframe[name='print_frame']`
  );
  oldFrames.forEach((frame) => frame.remove());

  // 2. CREACIÓN BLINDADA
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

  // Definición de márgenes según modo
  let pageMargin = "1.5cm";
  if (isCompact) pageMargin = "1cm";
  if (isAccessible) pageMargin = "0.5cm"; // Márgenes mínimos para aprovechar espacio

  // Definición de fuente y color según modo
  const baseFontSize = isAccessible ? "14px" : "12px";
  const baseColor = isAccessible ? "#000000" : "#0f172a";
  const lineHeight = isAccessible ? "1.4" : "1.5";

  // 3. HTML ESTRUCTURAL
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
                    font-family: 'Inter', sans-serif;
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
                
                /* Ajustes específicos para accesibilidad */
                ${
                  isAccessible
                    ? `
                    strong, b, h1, h2, h3, th, dt, .font-bold {
                        color: #000000 !important;
                        font-weight: 800 !important;
                    }
                    .text-slate-500, .text-slate-400, .text-slate-300 {
                        color: #000000 !important; /* Eliminar grises */
                    }
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
  const isAccessible = printMode === "accessible";

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

  // Para 'accessible' usamos el layout compacto (ahorra espacio) pero con letra grande
  if (isCompact || isAccessible) {
    headerHtml = `
        <div class="flex justify-between items-end border-b-2 border-black pb-3 mb-6">
            <div class="flex items-center gap-3">
                <div class="${isAccessible ? "text-2xl" : "text-lg"}">
                    ${template.icon || '<i class="fas fa-file"></i>'}
                </div>
                <div>
                    <h1 class="${
                      isAccessible ? "text-2xl" : "text-xl"
                    } font-bold leading-none">${metadata.title}</h1>
                    <p class="${
                      isAccessible
                        ? "text-xs mt-1 font-bold uppercase"
                        : "text-[10px] text-slate-500 mt-1 uppercase tracking-widest"
                    }">${template.name}</p>
                </div>
            </div>
            <div class="text-right ${isAccessible ? "text-xs" : "text-[10px]"}">
                <p class="font-bold">${date}</p>
                <p class="${
                  isAccessible ? "" : "text-slate-400"
                } font-mono">ID: ${docId.substring(0, 8)}</p>
            </div>
        </div>`;
  } else {
    // ESTILO STANDARD
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
  // Accesible: 1 columna para lectura lineal. Compacto: 4 columnas. Standard: 2 columnas.
  let gridCols = "grid-cols-2 gap-x-8 gap-y-6";
  if (isCompact) gridCols = "grid-cols-4 gap-4";
  if (isAccessible) gridCols = "grid-cols-1 gap-2";

  let html = `${headerHtml}<div class="grid ${gridCols}">`;

  template.fields.forEach((field) => {
    const value = data[field.id];

    // Cálculo de columnas (Span)
    let spanClass = "col-span-1";
    const isWideType =
      ["separator", "table", "textarea"].includes(field.type) ||
      (field.type === "text" && String(value).length > 60);

    if (isAccessible) {
      spanClass = "col-span-1"; // Siempre ancho completo en modo accesible
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
                  isAccessible ? "text-base" : "text-sm"
                } font-bold uppercase tracking-wider pb-1 flex items-center gap-2">
                    ${
                      !isCompact && !isAccessible
                        ? `<i class="fas fa-chevron-right text-[10px] text-slate-400"></i>`
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
        printMode
      )}</div>`;
      return;
    }

    // C) CAMPOS
    // CAMBIO IMPORTANTE: Pasamos el objeto 'field' completo, no solo 'field.type'
    const displayValue = formatPrintValue(
      field, // <--- CAMBIO AQUÍ
      value,
      currencyConfig,
      printMode
    );

    if (isAccessible) {
      // Diseño Accesible: Label: Valor (lineal, muy claro)
      html += `
            <div class="${spanClass} border-b border-black py-2 page-break">
              <span class="font-bold uppercase text-xs mr-2 block sm:inline">${field.label}:</span>
              <span class="text-base font-bold">${displayValue}</span>
            </div>`;
    } else if (isCompact) {
      // Diseño Compacto
      html += `
            <div class="${spanClass} border-b border-slate-100 py-1 page-break">
              <span class="text-[10px] font-bold text-slate-500 uppercase mr-1">${field.label}:</span>
              <span class="text-xs font-semibold text-slate-900">${displayValue}</span>
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
  if (!isCompact) {
    // En modo accesible mantenemos el footer pero simplificado y con alto contraste
    const footerClass = isAccessible
      ? "border-black text-black font-bold mt-8 pt-4"
      : "border-slate-200 text-slate-400 mt-16 pt-6";

    html += `
        <div class="${footerClass} border-t flex items-center justify-between">
           <div class="flex items-center text-[10px] font-bold uppercase tracking-widest gap-2">
                ${
                  isAccessible
                    ? ""
                    : '<i class="fas fa-lock text-slate-300"></i>'
                }
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
    if (isCompact) return "";
    return `<div class="py-2 text-xs italic text-center border-b border-slate-100">${field.label} (Sin datos)</div>`;
  }

  let padding = "px-2 py-2";
  let fontSize = "text-[11px]";

  if (isCompact) {
    padding = "px-1 py-1";
    fontSize = "text-[9px]";
  }
  if (isAccessible) {
    padding = "px-1 py-0.5";
    fontSize = "text-xs";
  }

  const borderColor = isAccessible ? "border-black" : "border-slate-200";
  const headerText = isAccessible
    ? "text-black border-black"
    : "text-slate-500 border-slate-200";

  const headers = field.columns
    .map(
      (c) =>
        `<th class="${padding} text-left ${fontSize} font-bold ${headerText} uppercase tracking-wider border-b-2">${c.label}</th>`
    )
    .join("");

  const body = rows
    .map((row) => {
      const cells = field.columns
        .map(
          (col) =>
            // CAMBIO IMPORTANTE: Pasamos la columna 'col' completa a formatPrintValue
            `<td class="${padding} ${fontSize} ${borderColor} border-b align-top">${formatPrintValue(
              col, // <--- CAMBIO AQUÍ (Antes era col.type)
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
              !isCompact
                ? `<label class="block text-[10px] font-bold uppercase mb-1 ${
                    isAccessible ? "text-black" : "text-slate-400"
                  }">${field.label}</label>`
                : ""
            }
            <table class="w-full border-collapse">
                <thead><tr>${headers}</tr></thead>
                <tbody>${body}</tbody>
            </table>
        </div>`;
}

/**
 * Función central de formato.
 * AHORA RECIBE EL OBJETO 'FIELD' COMPLETO en el primer argumento.
 */
function formatPrintValue(field, value, currencyConfig, printMode) {
  const isCompact = printMode === "compact";
  const isAccessible = printMode === "accessible";
  const type = field.type; // Extraemos el tipo del objeto

  if (value === undefined || value === null || value === "") {
    if (isAccessible) return "—";
    return isCompact ? "—" : '<span class="text-slate-300 italic">Vacío</span>';
  }

  if (typeof value === "object" && value.url) {
    // Imágenes
    if (type === "url" && value.url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
      const size = isCompact || isAccessible ? "w-6 h-6" : "w-12 h-12";
      return `<div class="flex items-center gap-2">
                <img src="${
                  value.url
                }" class="${size} object-cover rounded border border-slate-200 bg-slate-50">
                <span class="text-xs font-medium">${
                  value.text || "Imagen"
                }</span>
             </div>`;
    }
    return `<span class="text-xs font-medium">${
      value.text || value.url
    }</span>`;
  }

  switch (type) {
    case "boolean":
      return value ? "SÍ" : "NO";

    // --- LÓGICA CORREGIDA PARA MONEDA ---
    case "currency":
      // 1. Usamos el símbolo del campo (o fallback a $)
      const symbol = field.currencySymbol || "$";

      // 2. Formateamos solo el número (sin código de moneda automático)
      let formatted;
      try {
        formatted = new Intl.NumberFormat("es-ES", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(Number(value));
      } catch (e) {
        formatted = value;
      }

      // 3. Concatenamos manualmente
      return `<span class="font-mono font-bold">${symbol} ${formatted}</span>`;

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
