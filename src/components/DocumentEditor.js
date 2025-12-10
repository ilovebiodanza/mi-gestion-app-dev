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
    this.updateEditorState(true, "Descifrando datos...");
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
      console.error(error);
      this.renderError(
        "No se pudo descifrar el documento. Verifica tu contraseña."
      );
    }
  }

  render() {
    if (!this.template && this.isEditing) {
      return `<div id="editorContainer" class="flex justify-center items-center py-20"><div class="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-primary"></div></div>`;
    }

    if (!this.template)
      return `<div class="p-4 text-red-500">Error crítico: Plantilla perdida.</div>`;

    const title = this.isEditing ? "Editar Documento" : "Nuevo Documento";
    const subtitle = this.isEditing
      ? `Actualizando: ${this.documentMetadata?.title}`
      : `Plantilla: ${this.template.name}`;
    const submitText = this.isEditing ? "Guardar Cambios" : "Crear Documento";

    return `
      <div id="editorContainer" class="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in mb-10">
        <div class="px-6 py-5 border-b border-slate-100 bg-white flex justify-between items-center sticky top-0 z-20 backdrop-blur-md bg-white/90">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-slate-50" style="background-color: ${
              this.template.color
            }10; color: ${this.template.color}">
                ${this.template.icon}
            </div>
            <div>
              <h2 class="text-xl font-bold text-slate-800 tracking-tight">${title}</h2>
              <p class="text-sm text-slate-500 font-medium">${subtitle}</p>
            </div>
          </div>
          <button id="closeEditorBtn" class="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition"><i class="fas fa-times text-lg"></i></button>
        </div>

        <div class="p-6 sm:p-8 bg-slate-50/30">
          <div id="dynamicFormContainer" class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            ${templateFormGenerator.generateFormHtml(
              this.template,
              this.initialFormData
            )}
          </div>

          <div class="mt-8 mb-6 flex items-start p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
            <div class="p-2 bg-emerald-100 rounded-lg text-emerald-600 mr-4">
                <i class="fas fa-shield-alt text-xl"></i>
            </div>
            <div class="text-sm text-emerald-800">
              <p class="font-bold">Seguridad E2EE Activa</p>
              <p class="opacity-90 mt-1">Antes de guardar, todos los datos serán cifrados en tu dispositivo usando tu llave maestra. El servidor solo recibirá código ilegible.</p>
            </div>
          </div>

          <div class="flex justify-end items-center gap-3 pt-6 border-t border-slate-200">
            <button id="cancelDocBtn" class="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition shadow-sm">
                Cancelar
            </button>
            <button id="saveDocBtn" class="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-lg shadow-blue-500/20 font-bold transition-all transform active:scale-95 flex items-center">
              <i class="fas fa-save mr-2"></i> <span>${submitText}</span>
            </button>
          </div>
        </div>
      </div>
      
      <style>
        /* Hacemos que los campos de texto largo y tablas ocupen 2 columnas */
        #dynamicFormContainer > div:has(textarea),
        #dynamicFormContainer > div:has(.table-input-container) {
            grid-column: span 1;
        }
        @media (min-width: 768px) {
            #dynamicFormContainer > div:has(textarea),
            #dynamicFormContainer > div:has(.table-input-container) {
                grid-column: span 2;
            }
        }
        /* Estilos base para inputs generados */
        #dynamicFormContainer label { display: block; font-size: 0.875rem; font-weight: 600; color: #334155; margin-bottom: 0.5rem; }
        #dynamicFormContainer input[type="text"],
        #dynamicFormContainer input[type="number"],
        #dynamicFormContainer input[type="date"],
        #dynamicFormContainer input[type="password"],
        #dynamicFormContainer input[type="url"],
        #dynamicFormContainer select,
        #dynamicFormContainer textarea {
            width: 100%;
            padding: 0.75rem 1rem;
            background-color: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 0.75rem;
            font-size: 0.875rem;
            transition: all 0.2s;
            outline: none;
        }
        #dynamicFormContainer input:focus,
        #dynamicFormContainer select:focus,
        #dynamicFormContainer textarea:focus {
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
      </style>
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

    this.setupMathCalculations();
    this.setupTableInteractivity();
  }

  // En src/components/DocumentEditor.js

  // En src/components/DocumentEditor.js

  setupTableInteractivity() {
    const containers = document.querySelectorAll(".table-input-container");
    containers.forEach((container) => {
      // ... (Configuración inicial igual) ...
      container.className =
        "table-input-container w-full overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm";
      const fieldId = container.dataset.fieldId;
      const hiddenInput = container.querySelector(`#${fieldId}`);
      const tbody = container.querySelector(".table-body");
      const addBtn = container.querySelector(".add-row-btn");

      // ... (Estilos de botones y headers igual) ...
      if (addBtn) {
        addBtn.className =
          "add-row-btn w-full py-3 bg-slate-50 hover:bg-slate-100 text-primary font-medium text-sm transition-colors border-t border-slate-200 flex items-center justify-center gap-2";
        addBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Agregar Fila';
      }

      const thead = container.querySelector("thead");
      if (thead)
        thead.className =
          "bg-slate-50 text-xs uppercase font-semibold text-slate-500";
      const ths = container.querySelectorAll("th");
      ths.forEach(
        (th) => (th.className = "px-4 py-3 text-left tracking-wider")
      );

      let columnsDef = [];
      try {
        columnsDef = JSON.parse(container.nextElementSibling.textContent);
      } catch (e) {}

      // --- RENDERIZADO DE CELDA ---
      const renderCellInput = (col, val) => {
        const commonClass =
          "w-full text-sm border-0 bg-transparent focus:ring-0 p-2 placeholder-slate-300";
        const value = val !== undefined && val !== null ? val : "";

        // 1. URL (Mantenemos la lógica anterior)
        if (col.type === "url") {
          let urlVal = val?.url || (typeof val === "string" ? val : "") || "";
          let textVal = val?.text || "";
          const jsonValue = JSON.stringify({
            url: urlVal,
            text: textVal,
          }).replace(/"/g, "&quot;");
          return `
             <div class="url-cell-group min-w-[180px] space-y-1">
                 <input type="hidden" class="cell-input url-json-store" data-col-id="${col.id}" value="${jsonValue}">
                 <div class="flex items-center bg-slate-50 rounded-md border border-slate-200 px-2">
                     <i class="fas fa-link text-[10px] text-slate-400 mr-2"></i>
                     <input type="text" class="url-part-link w-full bg-transparent border-none text-xs py-1.5 focus:ring-0 text-blue-600 placeholder-slate-400" placeholder="https://..." value="${urlVal}">
                 </div>
                 <div class="flex items-center bg-white rounded-md border border-slate-200 px-2">
                     <i class="fas fa-font text-[10px] text-slate-400 mr-2"></i>
                     <input type="text" class="url-part-text w-full bg-transparent border-none text-xs py-1.5 focus:ring-0 text-slate-700 placeholder-slate-300" placeholder="Texto visible" value="${textVal}">
                 </div>
             </div>`;
        }

        // 2. SECRETO / PASSWORD (¡NUEVO!)
        if (col.type === "secret") {
          return `
            <div class="relative group">
                <input type="password" class="${commonClass} pr-8 cell-input" data-col-id="${col.id}" value="${value}" placeholder="••••">
                <button type="button" class="toggle-pass-cell absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors focus:outline-none" tabindex="-1">
                    <i class="fas fa-eye text-xs"></i>
                </button>
            </div>`;
        }

        // 3. BOOLEAN
        if (col.type === "boolean") {
          return `<div class="flex justify-center"><input type="checkbox" class="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer cell-input" data-col-id="${
            col.id
          }" ${value ? "checked" : ""}></div>`;
        }

        // 4. SELECT
        if (col.type === "select") {
          const opts = (col.options || [])
            .map(
              (o) =>
                `<option value="${o}" ${
                  value === o ? "selected" : ""
                }>${o}</option>`
            )
            .join("");
          return `<select class="${commonClass} cursor-pointer cell-input" data-col-id="${col.id}"><option value="">Seleccionar...</option>${opts}</select>`;
        }

        // 5. RESTO (Texto, Números)
        const isNumeric = ["number", "currency", "percentage"].includes(
          col.type
        );
        const inputClass = `${commonClass} ${
          isNumeric ? "font-mono text-right math-input" : ""
        }`;
        const placeholder = isNumeric
          ? "0.00"
          : col.type === "date"
          ? ""
          : "Escribir...";
        const inputType = col.type === "date" ? "date" : "text";

        return `<input type="${inputType}" class="${inputClass} cell-input" data-col-id="${col.id}" value="${value}" placeholder="${placeholder}">`;
      };

      const renderRow = (rowData = {}) => {
        const tr = document.createElement("tr");
        tr.className =
          "group border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors";

        let tds = "";
        columnsDef.forEach((col) => {
          tds += `<td class="p-2 border-r border-slate-100 last:border-0 align-top">${renderCellInput(
            col,
            rowData[col.id]
          )}</td>`;
        });

        tds += `<td class="w-10 text-center p-0 align-middle">
                <button type="button" class="remove-row-btn w-full h-full min-h-[40px] text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
                    <i class="fas fa-times"></i>
                </button>
            </td>`;

        tr.innerHTML = tds;
        tbody.appendChild(tr);

        // Listeners Matemáticas
        tr.querySelectorAll(".math-input").forEach((input) => {
          input.addEventListener("blur", () => this.evaluateMathInput(input));
          input.addEventListener(
            "keydown",
            (e) =>
              (e.key === "Enter" || e.key === "=") &&
              this.evaluateMathInput(input)
          );
        });

        // Listeners URL (Sincronización)
        tr.querySelectorAll(".url-cell-group").forEach((group) => {
          const hidden = group.querySelector(".url-json-store");
          const linkInput = group.querySelector(".url-part-link");
          const textInput = group.querySelector(".url-part-text");
          const syncUrl = () => {
            hidden.value = JSON.stringify({
              url: linkInput.value.trim(),
              text: textInput.value.trim(),
            });
            hidden.dispatchEvent(new Event("change", { bubbles: true }));
          };
          linkInput.addEventListener("input", syncUrl);
          textInput.addEventListener("input", syncUrl);
        });

        // Listener PASSWORD (¡NUEVO!)
        tr.querySelectorAll(".toggle-pass-cell").forEach((btn) => {
          btn.addEventListener("click", () => {
            const input = btn.previousElementSibling;
            const icon = btn.querySelector("i");
            if (input.type === "password") {
              input.type = "text";
              icon.className = "fas fa-eye-slash";
              btn.classList.add("text-primary");
            } else {
              input.type = "password";
              icon.className = "fas fa-eye";
              btn.classList.remove("text-primary");
            }
          });
        });
      };

      // Inicialización y Listeners generales...
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
      tbody.addEventListener("change", () => updateHiddenInput());

      const updateHiddenInput = () => {
        const rows = [];
        tbody.querySelectorAll("tr").forEach((tr) => {
          const rowObj = {};
          tr.querySelectorAll(".cell-input").forEach((input) => {
            const colId = input.dataset.colId;
            const colDef = columnsDef.find((c) => c.id === colId);
            let val;

            if (colDef && colDef.type === "url") {
              try {
                val = JSON.parse(input.value);
              } catch (e) {
                val = { url: input.value, text: "" };
              }
            } else if (input.type === "checkbox") {
              val = input.checked;
            } else {
              val = input.value;
              if (
                colDef &&
                ["number", "currency", "percentage"].includes(colDef.type)
              ) {
                val = val === "" || isNaN(val) ? null : Number(val);
              }
            }
            rowObj[colId] = val;
          });
          rows.push(rowObj);
        });
        hiddenInput.value = JSON.stringify(rows);
      };
    });
  }

  // --- LÓGICA MATEMÁTICA Y GUARDADO (Mantenida, mejoras visuales en evaluate) ---
  setupMathCalculations() {
    this.template.fields
      .filter((f) => ["number", "currency", "percentage"].includes(f.type))
      .forEach((field) => {
        const input = document.getElementById(field.id);
        if (!input) return;
        if (!input.placeholder) input.placeholder = "0.00 (admite fórmulas)";
        input.classList.add("font-mono", "text-right"); // Alineación numérica

        input.addEventListener(
          "keydown",
          (e) =>
            (e.key === "Enter" || e.key === "=") &&
            (e.preventDefault(), this.evaluateMathInput(input))
        );
        input.addEventListener("blur", () => this.evaluateMathInput(input));
      });
  }

  evaluateMathInput(input) {
    const value = input.value.trim();
    if (!value) return;
    if (/^[\d\s\.\+\-\*\/\(\)]+$/.test(value) && /[\+\-\*\/]/.test(value)) {
      try {
        const result = new Function('"use strict";return (' + value + ")")();
        if (isFinite(result)) {
          input.value = Math.round(result * 100) / 100;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          // Feedback Visual Mejorado
          input.classList.add(
            "bg-emerald-50",
            "text-emerald-700",
            "font-bold",
            "ring-2",
            "ring-emerald-500"
          );
          setTimeout(
            () =>
              input.classList.remove(
                "bg-emerald-50",
                "text-emerald-700",
                "font-bold",
                "ring-2",
                "ring-emerald-500"
              ),
            600
          );
        }
      } catch (e) {}
    }
  }

  async handleSave() {
    if (this.isSubmitting) return;
    const form = document.querySelector(`form[id^="templateForm_"]`);
    if (form && !form.checkValidity()) {
      form.reportValidity();
      return;
    }

    this.updateEditorState(
      true,
      this.isEditing ? "Guardando cambios..." : "Encriptando y guardando..."
    );

    try {
      document
        .querySelectorAll(".math-input")
        .forEach((inp) => this.evaluateMathInput(inp));
      await new Promise((r) => setTimeout(r, 100)); // Breve pausa para UI update

      const formData = this.collectFormData();
      const result = this.isEditing
        ? await documentService.updateDocument(
            this.documentId,
            this.template,
            formData
          )
        : await documentService.createDocument(this.template, formData);

      if (this.onSaveSuccess) this.onSaveSuccess(result);
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
      this.updateEditorState(false);
    }
  }

  // collectFormData se mantiene igual...
  collectFormData() {
    const formData = {};
    this.template.fields.forEach((field) => {
      if (field.type === "url") {
        const urlInput = document.getElementById(`${field.id}_url`);
        const textInput = document.getElementById(`${field.id}_text`);

        if (urlInput) {
          // Guardamos un objeto con ambas propiedades
          formData[field.id] = {
            url: urlInput.value.trim(),
            // Si no hay texto, guardamos cadena vacía (el viewer lo resolverá)
            text: textInput ? textInput.value.trim() : "",
          };
        }
        return; // Importante: salir aquí para no procesarlo abajo como input normal
      }
      const input = document.getElementById(field.id);
      if (input) {
        if (field.type === "boolean") formData[field.id] = input.checked;
        else if (["number", "currency", "percentage"].includes(field.type)) {
          let val = input.value;
          try {
            if (/[\+\-\*\/]/.test(val))
              val = new Function('"use strict";return (' + val + ")")();
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

  updateEditorState(isLoading, message = null) {
    this.isSubmitting = isLoading;
    const btn = document.getElementById("saveDocBtn");
    if (!btn) return;

    if (isLoading) {
      btn.disabled = true;
      btn.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ${message}`;
      btn.classList.add("opacity-80", "cursor-wait");
    } else {
      btn.disabled = false;
      btn.innerHTML = `<i class="fas fa-save mr-2"></i> ${
        this.isEditing ? "Guardar Cambios" : "Crear Documento"
      }`;
      btn.classList.remove("opacity-80", "cursor-wait");
    }

    // Deshabilitar inputs
    const container = document.getElementById("dynamicFormContainer");
    if (container) {
      const elements = container.querySelectorAll(
        "input, textarea, select, button"
      );
      elements.forEach((el) => (el.disabled = isLoading));
      container.style.opacity = isLoading ? "0.7" : "1";
    }
  }

  renderError(msg) {
    document.getElementById("editorContainer").innerHTML = `
        <div class="p-8 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
                <i class="fas fa-times text-2xl"></i>
            </div>
            <h3 class="text-xl font-bold text-slate-800 mb-2">Error de Carga</h3>
            <p class="text-slate-500 mb-6">${msg}</p>
            <button id="cancelDocBtn" class="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition">Volver</button>
        </div>
    `;
    document
      .getElementById("cancelDocBtn")
      ?.addEventListener("click", () => this.onCancel());
  }
}
