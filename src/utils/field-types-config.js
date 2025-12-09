// src/utils/field-types-config.js

/**
 * Definición centralizada de tipos de campo.
 * NOTA: Los tipos numéricos usan inputType: 'text' para permitir
 * la escritura de fórmulas matemáticas (ej: 200+50).
 */
const FIELD_TYPES = [
  { value: "string", label: "Texto corto", inputType: "text" },
  { value: "text", label: "Texto largo", inputType: "textarea" },

  // 👇 CAMBIO: Usamos 'text' para permitir fórmulas
  { value: "number", label: "Número", inputType: "text" },
  { value: "currency", label: "Monto (Moneda)", inputType: "text" },
  { value: "percentage", label: "Porcentaje", inputType: "text" },

  { value: "boolean", label: "Sí/No", inputType: "checkbox" },
  { value: "date", label: "Fecha", inputType: "date" },
  { value: "url", label: "URL", inputType: "url" },
  { value: "email", label: "Email", inputType: "email" },
  { value: "secret", label: "Contraseña / Secreto", inputType: "password" },
  { value: "select", label: "Selección Simple", inputType: "select" },
  { value: "table", label: "Tabla / Lista de Ítems", inputType: "table" },
];

export const getFieldTypesConfig = () => FIELD_TYPES;

export const getFieldTypeMetadata = (value) => {
  return FIELD_TYPES.find((type) => type.value === value);
};
