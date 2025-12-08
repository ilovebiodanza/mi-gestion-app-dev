// src/utils/field-types-config.js

/**
 * Definición centralizada de tipos de campo.
 * * Cada tipo incluye:
 * - value: El identificador único y el valor usado en el objeto de plantilla.
 * - label: La descripción legible para el usuario (usada en la UI).
 * - inputType: El tipo de input HTML (o valor clave como 'textarea', 'checkbox')
 * para que el generador de formularios sepa qué renderizar.
 */
const FIELD_TYPES = [
  {
    value: "string",
    label: "Texto corto",
    inputType: "text",
  },
  {
    value: "text",
    label: "Texto largo",
    inputType: "textarea",
  },
  {
    value: "phone",
    label: "Número de teléfono",
    inputType: "tel",
  },
  {
    value: "number",
    label: "Número",
    inputType: "number",
  },
  {
    value: "currency", // <--- NUEVO TIPO DE CAMPO
    label: "Monto (Moneda)", // <--- ETIQUETA LEGIBLE
    inputType: "number", // <--- TIPO DE INPUT HTML
  },
  {
    value: "percentage",
    label: "Porcentaje",
    inputType: "number",
  },
  {
    value: "boolean",
    label: "Sí/No",
    inputType: "checkbox",
  },
  {
    value: "date",
    label: "Fecha",
    inputType: "date",
  },
  {
    value: "select", // <--- NUEVO VALOR
    label: "Selección Simple",
    inputType: "select", // <--- Clave para el generador de formularios
  },
  {
    value: "url",
    label: "URL",
    inputType: "url",
  },
  {
    value: "email",
    label: "Email",
    inputType: "email",
  },
  {
    value: "secret",
    label: "Contraseña / Secreto",
    inputType: "password", // Esto hace que al escribir se vean asteriscos automáticamente
  },
];

export const getFieldTypesConfig = () => FIELD_TYPES;

export const getFieldTypeMetadata = (value) => {
  return FIELD_TYPES.find((type) => type.value === value);
};
