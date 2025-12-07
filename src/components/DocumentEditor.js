// src/components/DocumentEditor.js

import { templateFormGenerator } from "../services/templates/form-generator.js";
import { documentService } from "../services/documents/index.js";

export class DocumentEditor {
  constructor(initialData, onSaveSuccess, onCancel) {
    // initialData puede ser: { template: T } (Creación) o
    // { documentId: ID, template: T, formData: F, metadata: M } (Edición)
    this.initialData = initialData;
    this.onSaveSuccess = onSaveSuccess;
    this.onCancel = onCancel;

    this.isEditing = !!initialData.documentId;
    this.documentId = initialData.documentId || null;

    // Si la data viene pre-cargada (desde DocumentViewer), la usamos directamente.
    this.template = initialData.template || null;
    this.initialFormData = initialData.formData || {};
    this.documentMetadata = initialData.metadata || {};

    this.isSubmitting = false;

    // Si estamos editando y solo tenemos el ID (ej: acceso futuro directo),
    // necesitamos cargar los datos. Sin embargo, para este flujo, asumimos
    // que app.js siempre precarga los datos. Dejamos el load en el constructor
    // para robustez en caso de que la plantilla no esté precargada.
    if (this.isEditing && !this.template) {
      this.loadExistingDocument();
    }
  }

  // Si no se precargaron los datos descifrados (flujo de emergencia/futuro)
  async loadExistingDocument() {
    this.updateEditorState(true, "Cargando datos...");
    try {
      const loadedData = await documentService.loadDocumentForEditing(
        this.documentId
      );

      // Asignar datos cargados
      this.template = loadedData.template;
      this.initialFormData = loadedData.formData;
      this.documentMetadata = loadedData.metadata;

      this.render();
      this.setupEventListeners();
      this.updateEditorState(false);
    } catch (error) {
      console.error("Error al cargar documento para edición:", error);
      this.renderError("Error al cargar datos cifrados: " + error.message);
    }
  }

  render() {
    if (!this.template && this.isEditing) {
      // Muestra spinner inicial mientras loadExistingDocument trabaja
      return `<div id="editorContainer" class="max-w-3xl mx-auto py-8">
            <div class="flex justify-center items-center">
                <i class="fas fa-spinner fa-spin text-2xl text-blue-600"></i>
            </div>
        </div>`;
    }

    if (!this.template) {
      return `<div id="editorContainer">Error: Plantilla no definida.</div>`;
    }

    const title = this.isEditing
      ? `Editando: ${this.documentMetadata?.title || this.template.name}`
      : `Nuevo: ${this.template.name}`;
    const submitText = this.isEditing
      ? "Actualizar y Recifrar"
      : "Guardar y Cifrar";
    const statusMessage = this.isEditing ? "recifrados" : "cifrados";

    return `
      <div id="editorContainer" class="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in">
        <div class="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center text-xl mr-3" 
                 style="background-color: ${this.template.color}20; color: ${
      this.template.color
    }">
              ${this.template.icon}
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-800">${title}</h2>
              <p class="text-xs text-gray-500">Los datos serán ${statusMessage} antes de guardarse</p>
            </div>
          </div>
          <button id="closeEditorBtn" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="p-6">
          <div id="dynamicFormContainer">
            ${templateFormGenerator.generateFormHtml(
              this.template,
              this.initialFormData
            )}
          </div>

          <div class="mt-6 mb-6 flex items-start p-3 bg-green-50 border border-green-100 rounded-lg">
            <i class="fas fa-lock text-green-600 mt-1 mr-3"></i>
            <div class="text-sm text-green-800">
              <p class="font-medium">Protección E2EE Activa</p>
              <p class="text-green-700 opacity-90">
                Tu clave maestra se usará para sellar este documento digitalmente.
              </p>
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button id="cancelDocBtn" class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition">
              Cancelar
            </button>
            <button id="saveDocBtn" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md hover:shadow-lg transition flex items-center">
              <i class="fas fa-save mr-2"></i>
              ${submitText}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    document
      .getElementById("closeEditorBtn")
      ?.addEventListener("click", () => this.onCancel());
    document
      .getElementById("cancelDocBtn")
      ?.addEventListener("click", () => this.onCancel());
    document
      .getElementById("saveDocBtn")
      ?.addEventListener("click", () => this.handleSave());
  }

  // Maneja Creación y Edición
  async handleSave() {
    if (this.isSubmitting) return;

    const form = document.querySelector(`form[id^="templateForm_"]`);
    if (!form || !form.checkValidity()) {
      form?.reportValidity();
      return;
    }

    this.updateEditorState(
      true,
      this.isEditing ? "Actualizando..." : "Cifrando..."
    );

    try {
      const formData = this.collectFormData(form);

      let result;
      if (this.isEditing) {
        // Llama a la función de ACTUALIZACIÓN (sobrescribir)
        result = await documentService.updateDocument(
          this.documentId,
          this.template,
          formData
        );
      } else {
        // Llama a la función de CREACIÓN
        result = await documentService.createDocument(this.template, formData);
      }

      if (this.onSaveSuccess) this.onSaveSuccess(result);
    } catch (error) {
      console.error("Error al guardar documento:", error);
      alert("Error al guardar: " + error.message);
      this.updateEditorState(false);
    }
  }

  // Auxiliar para extraer los datos del formulario
  collectFormData(form) {
    const formData = {};
    this.template.fields.forEach((field) => {
      const input = document.getElementById(field.id);
      if (input) {
        if (field.type === "boolean") {
          formData[field.id] = input.checked;
        } else if (
          field.type === "number" ||
          field.type === "currency" ||
          field.type === "percentage"
        ) {
          formData[field.id] = Number(input.value);
        } else {
          formData[field.id] = input.value;
        }
      }
    });
    return formData;
  }

  // Auxiliar para manejar el estado visual del botón
  updateEditorState(isLoading, message = null) {
    this.isSubmitting = isLoading;
    const btn = document.getElementById("saveDocBtn");

    if (!btn) return;

    if (isLoading) {
      btn.disabled = true;
      btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> ${
        message || "Procesando..."
      }`;
      btn.classList.add("opacity-75", "cursor-not-allowed");
    } else {
      btn.disabled = false;
      const submitText = this.isEditing
        ? "Actualizar y Recifrar"
        : "Guardar y Cifrar";
      btn.innerHTML = `<i class="fas fa-save mr-2"></i> ${submitText}`;
      btn.classList.remove("opacity-75", "cursor-not-allowed");
    }

    // Deshabilitar/habilitar todos los inputs del formulario
    const inputs = document.querySelectorAll(
      "#dynamicFormContainer input, #dynamicFormContainer textarea, #dynamicFormContainer select"
    );
    inputs.forEach((input) => (input.disabled = isLoading));
  }

  renderError(msg) {
    const container = document.getElementById("editorContainer");
    if (container) {
      container.innerHTML = `
        <div class="p-6">
            <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg max-w-3xl mx-auto">
                <h4 class="text-red-800 font-bold mb-2">Error Crítico</h4>
                <p class="text-red-700">${msg}</p>
                <button id="backBtnError" class="mt-4 bg-white border border-red-300 text-red-700 px-4 py-2 rounded hover:bg-red-50 transition">
                  Volver al Listado
                </button>
            </div>
        </div>
      `;
      document
        .getElementById("backBtnError")
        ?.addEventListener("click", () => this.onCancel());
    }
  }
}
