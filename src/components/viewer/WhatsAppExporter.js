// src/components/viewer/WhatsAppExporter.js

export async function copyToWhatsApp(
  documentMetadata,
  template,
  decryptedData,
  currencyConfig
) {
  try {
    let waText = `*${documentMetadata.title}*\n_${template.name}_\n\n`;

    template.fields.forEach((field) => {
      // Ignorar separadores
      if (field.type === "separator") return;

      const value = decryptedData[field.id];

      // CASO 1: TABLAS
      if (field.type === "table") {
        const rows = Array.isArray(value) ? value : [];
        // Solo mostramos el título si hay datos, o indicamos "Sin datos"
        waText += `*${field.label}:* ${
          rows.length === 0 ? "_Sin datos_" : ""
        }\n`;

        rows.forEach((row, i) => {
          waText += `  ${i + 1}. `;

          // Recorremos las columnas configuradas
          if (field.columns) {
            field.columns.forEach((col, index) => {
              const cellValue = row[col.id];

              // CAMBIO 1: Pasamos el objeto columna completo 'col'
              const formattedCell = formatValue(col, cellValue, currencyConfig);

              // Agregamos separador " | " solo si no es la última columna
              const separator = index < field.columns.length - 1 ? " | " : "";
              waText += `${col.label}: ${formattedCell}${separator}`;
            });
          }
          waText += `\n`;
        });
        waText += `\n`; // Salto de línea extra después de la tabla
        return; // Continuar con el siguiente campo
      }

      // CASO 2: CAMPOS NORMALES
      // CAMBIO 2: Pasamos el objeto campo completo 'field'
      const formattedValue = formatValue(field, value, currencyConfig);
      waText += `*${field.label}:* ${formattedValue}\n`;
    });

    // Agregar pie de página o firma si se desea
    waText += `\n_Generado el ${new Date().toLocaleDateString()}_`;

    await navigator.clipboard.writeText(waText);
    return true; // Éxito
  } catch (e) {
    console.error("Error generando WhatsApp:", e);
    throw e;
  }
}

/**
 * Función auxiliar para dar formato de TEXTO (no HTML) a los valores.
 * Maneja objetos complejos como {url, text}
 * * AHORA RECIBE EL OBJETO DE CONFIGURACIÓN COMPLETO (fieldDefinition)
 */
function formatValue(fieldDefinition, value, currencyConfig) {
  const type = fieldDefinition.type;

  // 1. Manejo de vacíos
  if (value === undefined || value === null || value === "") return "_N/A_";

  // 2. Manejo de OBJETOS (imágenes, urls)
  if (typeof value === "object" && value !== null) {
    if (value.url) {
      const display =
        value.text && value.text !== value.url ? `${value.text}: ` : "";
      return `${display}${value.url}`;
    }
    return JSON.stringify(value);
  }

  // 3. Formatos específicos por tipo
  switch (type) {
    case "boolean":
      return value ? "Sí" : "No";

    case "currency":
      // CAMBIO 3: Usamos el símbolo del campo y formato manual
      const symbol = fieldDefinition.currencySymbol || "$";
      let formatted;
      try {
        formatted = new Intl.NumberFormat("es-ES", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(Number(value));
      } catch (e) {
        formatted = value;
      }
      return `${symbol} ${formatted}`;

    case "date":
      // Intentar formatear fecha si es string YYYY-MM-DD
      try {
        if (String(value).includes("-")) {
          const [y, m, d] = String(value).split("-");
          return `${d}/${m}/${y}`;
        }
      } catch (e) {}
      return value;

    default:
      return String(value);
  }
}
