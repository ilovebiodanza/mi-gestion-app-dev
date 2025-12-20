// src/components/editor/core/FieldRegistry.js
import { ElementRegistry } from "../../elements/ElementRegistry.js";
import { ElementAdapter } from "./ElementAdapter.js";

class FieldRegistry {
  constructor() {
    this.types = {};
  }

  register(type, classRef) {
    this.types[type] = classRef;
  }

  createController(fieldDef, initialValue, onChange) {
    // 1. Intentar obtener el elemento del nuevo sistema (ElementRegistry)
    const NewElementClass = ElementRegistry.get(fieldDef.type);

    // Verificamos si es un elemento real y no el fallback por defecto (o si es el que queremos probar)
    // En este caso, forzamos el uso del adaptador si el tipo es 'boolean'
    if (
      [
        "boolean",
        "date",
        "email",
        "secret",
        "select",
        "separator",
        "string",
        "text",
        "number",
        "percentage",
        "currency",
        "table",
      ].includes(fieldDef.type) &&
      NewElementClass
    ) {
      // console.log({ fieldDef, initialValue, onChange });

      //      console.log(`Migrando tipo: ${fieldDef.type} a ElementRegistry vía Adaptador`);
      return new ElementAdapter(NewElementClass, fieldDef, initialValue);
    }

    // 2. Fallback al sistema Legacy (lo que ya tenías)
    const FieldClass = this.types[fieldDef.type] || this.types["string"];
    return new FieldClass(fieldDef, initialValue, onChange);
  }
}

export const fieldRegistry = new FieldRegistry();
