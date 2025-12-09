// src/components/DocumentEditor.js

import { templateFormGenerator } from "../services/templates/form-generator.js";
import { documentService } from "../services/documents/index.js";

export class DocumentEditor {
  constructor(initialData, onSaveSuccess, onCancel) {
    this.initialData = initialData;
    this.onSaveSuccess = onSaveSuccess;
    this.onCancel = onCancel;

    this.isEditing = !!initialData.documentId;
    this.documentId = initialData.documentId || null;

    this.template = initialData.template || null;
    this.initialFormData = initialData.formData || {};
    this.documentMetadata = initialData.metadata || {};

    this.isSubmitting = false;

    if (this.isEditing && !this.template) {
      this.loadExistingDocument();
    }
  }

  async loadExistingDocument() {
    this.updateEditorState(true, "Cargando datos...");
    try {
      const loadedData = await documentService.loadDocumentForEditing(
        this.documentId
      );
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

    // Inicializar cálculos matemáticos y tablas
    this.setupMathCalculations();
    this.setupTableInteractivity();
  }

  // --- LÓGICA MATEMÁTICA ---
  setupMathCalculations() {
    // Identificar campos numéricos en la plantilla
    const numericFields = this.template.fields.filter((f) =>
      ["number", "currency", "percentage"].includes(f.type)
    );

    numericFields.forEach((field) => {
      const input = document.getElementById(field.id);
      if (!input) return;

      // Ayuda visual: Placeholder especial si está vacío
      if (!input.value) {
        input.placeholder = "Escribe un valor o fórmula (ej: 100+20)";
      }

      // Listener: Al presionar teclas
      input.addEventListener("keydown", (e) => {
        // Si presiona ENTER o IGUAL (=)
        if (e.key === "Enter" || e.key === "=") {
          e.preventDefault(); // Evitar submit del form o escribir el =
          this.evaluateMathInput(input);
        }
      });

      // Listener: Al salir del campo (Blur)
      input.addEventListener("blur", () => {
        this.evaluateMathInput(input);
      });
    });
  }

  evaluateMathInput(input) {
    const value = input.value.trim();
    if (!value) return;

    // Solo evaluar si parece una operación matemática (tiene operadores)
    // Permitimos: números, +, -, *, /, (, ), ., y espacios
    if (/^[\d\s\.\+\-\*\/\(\)]+$/.test(value) && /[\+\-\*\/]/.test(value)) {
      try {
        // Evaluamos de forma segura (sin eval directo)
        // "use strict" previene acceso a globales
        const result = new Function('"use strict";return (' + value + ")")();

        if (isFinite(result)) {
          // Redondear a 2 decimales si es necesario para limpieza
          // Pero mantenemos precisión si es entero
          input.value = Math.round(result * 100) / 100;

          // Feedback visual breve (flash verde)
          input.classList.add("bg-green-50", "text-green-700");
          setTimeout(
            () => input.classList.remove("bg-green-50", "text-green-700"),
            500
          );
        }
      } catch (e) {
        // Si la fórmula está mal (ej: "200+"), no hacemos nada, dejamos que el usuario corrija
        console.warn("Fórmula inválida:", value);
      }
    }
  }
  // -------------------------

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
      // Forzar evaluación matemática de todos los campos antes de guardar
      // por si el usuario dio clic en Guardar sin salir del último campo
      this.template.fields.forEach((f) => {
        if (["number", "currency", "percentage"].includes(f.type)) {
          const inp = document.getElementById(f.id);
          if (inp) this.evaluateMathInput(inp);
        }
      });

      const formData = this.collectFormData();

      let result;
      if (this.isEditing) {
        result = await documentService.updateDocument(
          this.documentId,
          this.template,
          formData
        );
      } else {
        result = await documentService.createDocument(this.template, formData);
      }

      if (this.onSaveSuccess) this.onSaveSuccess(result);
    } catch (error) {
      console.error("Error al guardar documento:", error);
      alert("Error al guardar: " + error.message);
      this.updateEditorState(false);
    }
  }

  // src/components/DocumentEditor.js -> collectFormData

  collectFormData() {
    const formData = {};

    this.template.fields.forEach((field) => {
      // --- MANEJO ESPECIAL PARA URL (Doble Input) ---
      if (field.type === "url") {
        const urlInput = document.getElementById(`${field.id}_url`);
        const textInput = document.getElementById(`${field.id}_text`);

        if (urlInput) {
          formData[field.id] = {
            url: urlInput.value,
            text: textInput.value || "", // Si está vacío, guardamos cadena vacía
          };
        }
        return; // Saltamos al siguiente campo
      }
      // ----------------------------------------------

      const input = document.getElementById(field.id);

      if (input) {
        if (field.type === "boolean") {
          formData[field.id] = input.checked;
        } else if (
          field.type === "number" ||
          field.type === "currency" ||
          field.type === "percentage"
        ) {
          // Evaluar fórmulas matemáticas pendientes
          let val = input.value;
          try {
            if (/[\+\-\*\/]/.test(val)) {
              val = new Function('"use strict";return (' + val + ")")();
            }
          } catch (e) {}
          formData[field.id] = val === "" || isNaN(val) ? null : Number(val);
        } else if (field.type === "table") {
          try {
            formData[field.id] = JSON.parse(input.value || "[]");
          } catch (e) {
            formData[field.id] = [];
          }
        } else {
          formData[field.id] = input.value;
        }
      }
    });

    return formData;
  }

  setupTableInteractivity() {
    const containers = document.querySelectorAll(".table-input-container");

    containers.forEach((container) => {
      const fieldId = container.dataset.fieldId;
      const hiddenInput = container.querySelector(`#${fieldId}`);
      const tbody = container.querySelector(".table-body");
      const addBtn = container.querySelector(".add-row-btn");
      const columnsDef = JSON.parse(container.nextElementSibling.textContent);

      const renderRow = (rowData = {}) => {
        const tr = document.createElement("tr");
        let tds = "";

        columnsDef.forEach((col) => {
          const val = rowData[col.id] || "";
          tds += `
                    <td class="px-2 py-2">
                        <input type="${
                          col.type === "number" || col.type === "currency"
                            ? "number"
                            : "text"
                        }" 
                               class="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 cell-input"
                               data-col-id="${col.id}"
                               value="${val}">
                    </td>`;
        });

        tds += `<td class="px-2 py-2 text-center">
                <button type="button" class="text-red-400 hover:text-red-600 remove-row-btn"><i class="fas fa-trash"></i></button>
            </td>`;

        tr.innerHTML = tds;
        tbody.appendChild(tr);
      };

      const initialData = JSON.parse(hiddenInput.value || "[]");
      initialData.forEach((row) => renderRow(row));

      addBtn.addEventListener("click", () => renderRow({}));

      tbody.addEventListener("click", (e) => {
        if (e.target.closest(".remove-row-btn")) {
          e.target.closest("tr").remove();
          updateHiddenInput();
        }
      });

      tbody.addEventListener("input", () => updateHiddenInput());

      const updateHiddenInput = () => {
        const rows = [];
        tbody.querySelectorAll("tr").forEach((tr) => {
          const rowObj = {};
          tr.querySelectorAll(".cell-input").forEach((input) => {
            let val = input.value;
            if (input.type === "number") val = parseFloat(val) || 0;
            rowObj[input.dataset.colId] = val;
          });
          rows.push(rowObj);
        });
        hiddenInput.value = JSON.stringify(rows);
      };
    });
  }

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
