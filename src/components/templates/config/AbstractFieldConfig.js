import { ElementRegistry } from "../../elements/ElementRegistry.js";

export class AbstractFieldConfig {
  /**
   * @param {Object} data - Datos iniciales del campo {id, label, type, required...}
   * @param {number} index - Posición en la lista
   * @param {Object} callbacks - { onChange, onRemove, onTypeChange }
   */
  constructor(data, index, callbacks) {
    this.data = { ...data };
    this.index = index;
    // Callbacks para comunicar eventos al padre (TemplateForm)
    this.callbacks = callbacks || {};

    this.domElement = null;
  }

  /**
   * Genera el HTML completo de la tarjeta de configuración.
   */
  render() {
    // Reutilizamos tus estilos de Tailwind para mantener consistencia
    return `
      <div class="field-item-config group relative bg-white border border-slate-200 rounded-2xl p-1 transition-all duration-300 hover:shadow-lg hover:border-primary/50 mb-4" data-id="${
        this.data.id
      }">
        <div class="flex items-stretch">
          
          <div class="w-10 flex flex-col items-center justify-center text-slate-300 cursor-grab active:cursor-grabbing hover:text-indigo-500 drag-handle rounded-l-xl border-r border-slate-200/50 transition-colors">
              <i class="fas fa-grip-vertical"></i>
          </div>

          <div class="flex-grow p-4">
              <div class="grid grid-cols-1 md:grid-cols-12 gap-4 mb-3">
                  <div class="md:col-span-7">
                      <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">
                          Etiqueta del Campo
                      </label>
                      <input type="text" class="field-label-input w-full px-3 py-2 bg-white/60 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition font-semibold text-slate-700 text-sm" 
                             value="${this.data.label || ""}" 
                             placeholder="Ej: Nombre del Cliente" required />
                  </div>
                  
                  <div class="md:col-span-5">
                      <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Tipo de Dato</label>
                      <div class="relative">
                          <select class="field-type-select w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition appearance-none cursor-pointer text-sm font-medium text-slate-600">
                              ${this.renderTypeOptions()}
                          </select>
                          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400"><i class="fas fa-chevron-down text-xs"></i></div>
                      </div>
                  </div>
              </div>

              <div class="specific-settings-container space-y-3">
                  ${this.renderSpecificSettings()}
              </div>

              <div class="flex items-center justify-end pt-2 mt-2 border-t border-slate-50">
                  <label class="flex items-center cursor-pointer select-none group/check p-1.5 rounded-lg hover:bg-slate-50 transition">
                      <input type="checkbox" class="field-required-check form-checkbox h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 transition" 
                        ${this.data.required ? "checked" : ""}>
                      <span class="ml-2 text-xs font-bold text-slate-400 group-hover/check:text-slate-600 transition-colors">Campo Obligatorio</span>
                  </label>
              </div>
          </div>

          <button type="button" class="btn-remove-field absolute -top-3 -right-3 w-8 h-8 bg-white text-slate-300 hover:text-white hover:bg-red-500 border border-slate-200 hover:border-red-500 rounded-full shadow-md flex items-center justify-center transition-all z-20 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100">
              <i class="fas fa-times text-sm"></i>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Helper para renderizar las opciones del select de tipos.
   */
  renderTypeOptions() {
    const types = ElementRegistry.getAvailableTypes();
    return types
      .map(
        (t) =>
          `<option value="${t.type}" ${
            this.data.type === t.type ? "selected" : ""
          }>${t.label}</option>`
      )
      .join("");
  }

  /**
   * Método polimórfico: Las subclases sobrescribirán esto para mostrar sus inputs propios
   * (ej: opciones de select, botón de tabla, etc).
   */
  renderSpecificSettings() {
    try {
      const ElementClass = ElementRegistry.get(this.data.type);
      // Instanciamos solo con la definición (value es null en configuración)
      const element = new ElementClass(this.data, null);

      // Si el elemento tiene renderSettings, lo usamos. Si no, string vacío.
      return element.renderSettings ? element.renderSettings() : "";
    } catch (e) {
      console.warn(`Error renderizando settings para ${this.data.type}`, e);
      return "";
    }
  }

  /**
   * Se llama después de insertar el HTML en el DOM.
   * Aquí atamos los listeners.
   */
  postRender(container) {
    this.domElement = container.querySelector(`[data-id="${this.data.id}"]`);
    if (!this.domElement) return;

    this.attachCommonListeners();
    this.attachSpecificListeners();
  }

  attachCommonListeners() {
    const labelInput = this.domElement.querySelector(".field-label-input");
    const typeSelect = this.domElement.querySelector(".field-type-select");
    const reqCheck = this.domElement.querySelector(".field-required-check");
    const removeBtn = this.domElement.querySelector(".btn-remove-field");

    // Listener Label
    labelInput?.addEventListener("input", (e) => {
      this.data.label = e.target.value;
      this.notifyChange();
    });

    // Listener Tipo (Es especial porque puede requerir cambiar toda la instancia)
    typeSelect?.addEventListener("change", (e) => {
      const newType = e.target.value;
      this.data.type = newType;
      if (this.callbacks.onTypeChange) {
        this.callbacks.onTypeChange(this, newType);
      }
    });

    // Listener Requerido
    reqCheck?.addEventListener("change", (e) => {
      this.data.required = e.target.checked;
      this.notifyChange();
    });

    // Listener Eliminar
    removeBtn?.addEventListener("click", () => {
      if (this.callbacks.onRemove) {
        this.callbacks.onRemove(this);
      }
    });
  }

  /**
   * Método polimórfico para listeners específicos.
   */
  // MODIFICAR: Delegación de Listeners
  attachSpecificListeners() {
    try {
      const ElementClass = ElementRegistry.get(this.data.type);
      const element = new ElementClass(this.data, null);

      if (element.postRenderSettings) {
        // Pasamos un callback para actualizar this.data de forma segura
        element.postRenderSettings(this.domElement, (key, value) => {
          this.data[key] = value;
          this.notifyChange(); // Importante: avisa al formulario principal que hubo cambios
        });
      }
    } catch (e) {
      console.warn(`Error adjuntando listeners para ${this.data.type}`, e);
    }
  }

  notifyChange() {
    if (this.callbacks.onChange) {
      this.callbacks.onChange(this.getDefinition());
    }
  }

  /**
   * Devuelve el objeto de datos limpio para guardar.
   */
  getDefinition() {
    return { ...this.data };
  }
}
