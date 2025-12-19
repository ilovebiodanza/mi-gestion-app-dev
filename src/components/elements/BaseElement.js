export class BaseElement {
  /**
   * @param {Object} definition - La configuración del template (id, label, settings, etc.)
   * @param {any} value - El valor actual del dato
   */
  constructor(definition, value = null) {
    this.def = definition;
    this.value = value;
  }

  // --- 0. METADATOS ---
  static getType() {
    throw new Error("Debe implementar getType");
  }
  static getLabel() {
    throw new Error("Debe implementar getLabel");
  }
  static getIcon() {
    return "fas fa-cube";
  }
  static getDescription() {
    return "";
  }

  // --- 1. PROCESO TEMPLATE (Configuración) ---
  renderTemplate() {
    return ""; // Por defecto no hay configuración extra
  }

  // --- 2. PROCESO EDITOR (Entrada) ---
  renderEditor() {
    return `<div class="text-red-500">Editor no implementado para ${this.def.type}</div>`;
  }

  postRenderEditor(container, onChangeCallback) {
    // Opcional: Listeners del input
  }

  validate() {
    return null; // Null = Sin errores
  }

  // --- 3. PROCESO VIEWER (Visualización) ---
  renderViewer() {
    return `<span>${this.value || "—"}</span>`;
  }

  postRenderViewer(container) {
    // Opcional: Scripts visuales
  }

  // --- 4. PROCESO PRINT (Impresión) ---
  // mode: 'standard' | 'compact' | 'accessible'
  renderPrint(mode) {
    return this.renderViewer(); // Fallback
  }

  // --- 5. PROCESO WHATSAPP ---
  getWhatsAppText(currencyConfig) {
    return `${this.def.label}: ${this.value || "Vacío"}`;
  }
}
