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
        waText += `*${field.label}:* ${
          rows.length === 0 ? "_Sin datos_" : ""
        }\n`;

        rows.forEach((row, i) => {
          waText += `  ${i + 1}. `;

          // Recorremos las columnas configuradas
          if (field.columns) {
            field.columns.forEach((col, index) => {
              const cellValue = row[col.id];
              const formattedCell = formatValue(
                col.type,
                cellValue,
                currencyConfig
              );

              // Agregamos separador " | " solo si no es la última columna
              const separator = index < field.columns.length - 1 ? " | " : "";
              waText += `${col.label}: ${formattedCell}${separator}`;
            });
          }
          waText += `\n`;
        });
        waText += `\n`; // Salto de línea extra después de la tabla
      }
      // CASO 2: CAMPOS NORMALES
      else {
        waText += `*${field.label}:* ${formatValue(
          field.type,
          value,
          currencyConfig
        )}\n`;
      }
    });

    waText += `\n_Enviado desde Mi Gestión_`;

    // Copiar al portapapeles
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
 */
function formatValue(type, value, currencyConfig) {
  // 1. Manejo de vacíos
  if (value === undefined || value === null || value === "") return "_N/A_";

  // 2. Manejo de OBJETOS (Tu observación corregida)
  // Si es un objeto (ej. imagen o link en tabla), extraemos lo útil
  if (typeof value === "object" && value !== null) {
    // Si tiene propiedad 'text' y 'url' (común en tus campos URL/Imagen)
    if (value.url) {
      const display =
        value.text && value.text !== value.url ? `${value.text}: ` : "";
      return `${display}${value.url}`;
    }
    // Fallback por si es otro tipo de objeto
    return JSON.stringify(value);
  }

  // 3. Formatos específicos por tipo
  switch (type) {
    case "boolean":
      return value ? "Sí" : "No";
    case "currency":
      return new Intl.NumberFormat(currencyConfig.locale).format(Number(value));
    case "date":
      // Intentar formatear fecha si es string YYYY-MM-DD
      try {
        if (String(value).includes("-")) {
          const [y, m, d] = String(value).split("-");
          return `${d}/${m}/${y}`;
        }
      } catch (e) {}
      return String(value);
    case "percentage":
      return `${value}%`;
    default:
      return String(value);
  }
}
