// src/components/DocumentEditor.js

import { templateFormGenerator } from "../services/templates/form-generator.js";
import { documentService } from "../services/documents/index.js";
import { encryptionService } from "../services/encryption/index.js";

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

    // Seguridad: Si editamos sin datos descifrados, forzar carga segura
    if (this.isEditing && !this.template) {
      this.checkSecurityAndLoad();
    }
  }

  checkSecurityAndLoad() {
    if (!encryptionService.isReady()) {
      console.log("🔐 Bóveda cerrada. Solicitando llave...");
      if (window.app && window.app.requireEncryption) {
        window.app.requireEncryption(() => this.loadExistingDocument());
      } else {
        this.renderError(
          "Sistema de seguridad no disponible. Recarga la página."
        );
      }
    } else {
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
      console.error("Error carga:", error);
      this.renderError("Error al cargar datos cifrados: " + error.message);
    }
  }

  render() {
    // Loading State
    if (!this.template && this.isEditing) {
      return `
        <div id="editorContainer" class="flex flex-col justify-center items-center py-32 animate-fade-in">
            <div class="relative">
                <div class="w-16 h-16 rounded-full border-4 border-slate-100 border-t-primary animate-spin"></div>
                <div class="absolute inset-0 flex items-center justify-center text-primary"><i class="fas fa-lock-open"></i></div>
            </div>
            <p class="mt-4 text-slate-400 font-medium animate-pulse">Descifrando documento seguro...</p>
        </div>`;
    }

    if (!this.template) {
      return `<div id="editorContainer" class="p-8 text-center bg-red-50 rounded-2xl text-red-600 font-bold border border-red-100">Error: Plantilla no definida.</div>`;
    }

    // Título inicial (si es edición viene de metadata, si es nuevo se deja vacío o default)
    const initialTitle = this.isEditing ? this.documentMetadata?.title : ""; // Vacío para obligar al usuario a escribir, o poner "Nuevo Registro"

    const submitText = this.isEditing ? "Actualizar" : "Guardar";
    const submitIcon = this.isEditing ? "fa-sync-alt" : "fa-save";

    // Layout Principal
    return `
      <div id="editorContainer" class="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-fade-in-up mb-20 relative">
        
        <div class="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center sticky top-0 z-30 bg-white/90 backdrop-blur-md transition-all shadow-sm gap-4">
          
          <div class="flex items-center gap-4 w-full sm:w-auto overflow-hidden flex-1 mr-4">
            <div class="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner" 
                 style="background-color: ${this.template.color}15; color: ${
      this.template.color
    }">
                ${this.template.icon}
            </div>
            <div class="flex-1">
              <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Identificación del Registro</label>
              <input type="text" id="documentTitleInput" 
                     class="w-full bg-transparent border-none p-0 text-lg font-bold text-slate-800 placeholder-slate-300 focus:ring-0 focus:outline-none truncate" 
                     placeholder="Ej: Tarjeta de Crédito Banesco" 
                     value="${initialTitle}" required autofocus>
            </div>
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto">
             <button id="cancelDocBtn" class="flex-1 sm:flex-none p-2 sm:px-4 sm:py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition font-medium text-sm border border-transparent hover:border-slate-200">
                <span class="hidden sm:inline">Cancelar</span>
                <span class="sm:hidden">Cancelar</span>
             </button>
             <button id="saveDocBtn" class="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white rounded-xl shadow-lg shadow-indigo-500/30 font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2 text-sm">
               <i class="fas ${submitIcon}"></i> <span>${submitText}</span>
             </button>
          </div>
        </div>

        <div class="p-6 sm:p-10 bg-slate-50/50 min-h-[500px]">
          
          <div id="dynamicFormContainer" class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            ${templateFormGenerator.generateFormHtml(
              this.template,
              this.initialFormData
            )}
          </div>

          <div class="mt-12 flex items-center justify-center p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-center">
            <div class="text-xs text-indigo-400 font-medium">
              <i class="fas fa-info-circle mr-1"></i>
              Todos los campos son cifrados localmente antes de guardarse.
            </div>
          </div>

        </div>
      </div>
      
      <style>
        /* Ajustes de Grid para campos anchos */
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
        /* Estilo para placeholder del título si está vacío */
        #documentTitleInput:placeholder-shown {
            font-style: italic;
        }
      </style>
    `;
  }

  setupEventListeners() {
    document
      .getElementById("cancelDocBtn")
      ?.addEventListener("click", () => this.onCancel());
    document
      .getElementById("saveDocBtn")
      ?.addEventListener("click", () => this.handleSave());

    // Iniciar lógica de cálculos y tablas
    this.setupMathCalculations();
    this.setupTableInteractivity();
  }

  // ... (setupTableInteractivity, attachRowListeners, updateHiddenTableInput, setupMathCalculations, evaluateMathInput SE MANTIENEN IGUALES)
  // Copia esos métodos del archivo original que subiste, no cambian.
  // ...

  // MÉTODOS AUXILIARES (REPETIR CÓDIGO EXISTENTE PARA COMPLETITUD SI LO NECESITAS)
  setupTableInteractivity() {
    const containers = document.querySelectorAll(".table-input-container");
    containers.forEach((container) => {
      container.className =
        "table-input-container w-full overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100";
      const fieldId = container.dataset.fieldId;
      const hiddenInput = container.querySelector(`#${fieldId}`);
      const tbody = container.querySelector(".table-body");
      const addBtn = container.querySelector(".add-row-btn");
      if (addBtn) {
        addBtn.className =
          "add-row-btn w-full py-3 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-wider transition-colors border-t border-slate-100 flex items-center justify-center gap-2 group";
        addBtn.innerHTML =
          '<i class="fas fa-plus-circle group-hover:scale-110 transition-transform"></i> Agregar Registro';
      }
      const thead = container.querySelector("thead");
      if (thead)
        thead.className =
          "bg-slate-50/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100";
      const ths = container.querySelectorAll("th");
      ths.forEach((th) => (th.className = "px-4 py-3 text-left tracking-wide"));
      let columnsDef = [];
      try {
        columnsDef = JSON.parse(container.nextElementSibling.textContent);
      } catch (e) {}
      const renderCellInput = (col, val) => {
        const commonClass =
          "w-full text-sm border-0 bg-transparent focus:ring-0 p-2 placeholder-slate-300 font-medium text-slate-700";
        const value = val !== undefined && val !== null ? val : "";
        if (col.type === "url") {
          let urlVal = val?.url || (typeof val === "string" ? val : "") || "";
          let textVal = val?.text || "";
          const jsonValue = JSON.stringify({
            url: urlVal,
            text: textVal,
          }).replace(/"/g, "&quot;");
          return `<div class="url-cell-group min-w-[200px] space-y-1.5 p-1"><input type="hidden" class="cell-input url-json-store" data-col-id="${col.id}" value="${jsonValue}"><div class="flex items-center bg-slate-50 rounded-lg border border-slate-200 px-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all"><i class="fas fa-link text-[10px] text-slate-400 mr-2"></i><input type="text" class="url-part-link w-full bg-transparent border-none text-xs py-1.5 focus:ring-0 text-blue-600 placeholder-slate-400 font-mono" placeholder="https://..." value="${urlVal}"></div><div class="flex items-center bg-white rounded-lg border border-slate-200 px-2 focus-within:border-slate-300 transition-colors"><i class="fas fa-font text-[10px] text-slate-300 mr-2"></i><input type="text" class="url-part-text w-full bg-transparent border-none text-xs py-1.5 focus:ring-0 text-slate-600 placeholder-slate-300" placeholder="Texto descriptivo" value="${textVal}"></div></div>`;
        }
        if (col.type === "secret") {
          return `<div class="relative group p-1"><div class="flex items-center bg-slate-50 rounded-lg border border-slate-200 focus-within:border-secondary focus-within:bg-white transition-colors"><input type="password" class="${commonClass} rounded-lg" data-col-id="${col.id}" value="${value}" placeholder="••••"><button type="button" class="toggle-pass-cell px-3 text-slate-400 hover:text-secondary focus:outline-none" tabindex="-1"><i class="fas fa-eye text-xs"></i></button></div></div>`;
        }
        if (col.type === "boolean") {
          return `<div class="flex justify-center items-center h-full py-2"><input type="checkbox" class="w-5 h-5 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer cell-input transition-all" data-col-id="${
            col.id
          }" ${value ? "checked" : ""}></div>`;
        }
        if (col.type === "select") {
          const opts = (col.options || [])
            .map(
              (o) =>
                `<option value="${o}" ${
                  value === o ? "selected" : ""
                }>${o}</option>`
            )
            .join("");
          return `<div class="p-1"><select class="${commonClass} bg-slate-50 rounded-lg cursor-pointer cell-input" data-col-id="${col.id}"><option value="">--</option>${opts}</select></div>`;
        }
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
        return `<div class="p-1"><input type="${inputType}" class="${inputClass} rounded-lg hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all cell-input" data-col-id="${col.id}" value="${value}" placeholder="${placeholder}"></div>`;
      };
      const renderRow = (rowData = {}) => {
        const tr = document.createElement("tr");
        tr.className =
          "group border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors";
        let tds = "";
        columnsDef.forEach((col) => {
          tds += `<td class="p-1 border-r border-slate-50 last:border-0 align-top">${renderCellInput(
            col,
            rowData[col.id]
          )}</td>`;
        });
        tds += `<td class="w-10 text-center p-0 align-middle"><button type="button" class="remove-row-btn w-8 h-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all mx-auto flex items-center justify-center opacity-0 group-hover:opacity-100"><i class="fas fa-times"></i></button></td>`;
        tr.innerHTML = tds;
        tbody.appendChild(tr);
        this.attachRowListeners(tr);
      };
      const initialData = JSON.parse(hiddenInput.value || "[]");
      initialData.forEach((row) => renderRow(row));
      addBtn.addEventListener("click", () => renderRow({}));
      tbody.addEventListener("click", (e) => {
        if (e.target.closest(".remove-row-btn")) {
          e.target.closest("tr").remove();
          this.updateHiddenTableInput(tbody, columnsDef, hiddenInput);
        }
      });
      tbody.addEventListener("input", () =>
        this.updateHiddenTableInput(tbody, columnsDef, hiddenInput)
      );
      tbody.addEventListener("change", () =>
        this.updateHiddenTableInput(tbody, columnsDef, hiddenInput)
      );
    });
  }
  attachRowListeners(tr) {
    tr.querySelectorAll(".math-input").forEach((input) => {
      input.addEventListener("blur", () => this.evaluateMathInput(input));
      input.addEventListener(
        "keydown",
        (e) =>
          (e.key === "Enter" || e.key === "=") && this.evaluateMathInput(input)
      );
    });
    tr.querySelectorAll(".url-cell-group").forEach((group) => {
      const hidden = group.querySelector(".url-json-store");
      const link = group.querySelector(".url-part-link");
      const text = group.querySelector(".url-part-text");
      const sync = () => {
        hidden.value = JSON.stringify({
          url: link.value.trim(),
          text: text.value.trim(),
        });
        hidden.dispatchEvent(new Event("change", { bubbles: true }));
      };
      link.addEventListener("input", sync);
      text.addEventListener("input", sync);
    });
    tr.querySelectorAll(".toggle-pass-cell").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = btn.previousElementSibling;
        const icon = btn.querySelector("i");
        if (input.type === "password") {
          input.type = "text";
          icon.className = "fas fa-eye-slash";
          btn.classList.add("text-secondary");
        } else {
          input.type = "password";
          icon.className = "fas fa-eye";
          btn.classList.remove("text-secondary");
        }
      });
    });
  }
  updateHiddenTableInput(tbody, columnsDef, hiddenInput) {
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
  }
  setupMathCalculations() {
    this.template.fields
      .filter((f) => ["number", "currency", "percentage"].includes(f.type))
      .forEach((field) => {
        const input = document.getElementById(field.id);
        if (!input) return;
        input.classList.add("font-mono", "text-right");
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
          input.classList.add("text-emerald-600", "font-bold", "bg-emerald-50");
          setTimeout(
            () =>
              input.classList.remove(
                "text-emerald-600",
                "font-bold",
                "bg-emerald-50"
              ),
            800
          );
        }
      } catch (e) {}
    }
  }

  // MODIFICADO: handleSave ahora toma el título del Header
  async handleSave() {
    if (this.isSubmitting) return;

    // 1. Validar Título Principal
    const titleInput = document.getElementById("documentTitleInput");
    const explicitTitle = titleInput.value.trim();
    if (!explicitTitle) {
      alert(
        "Por favor, asigna un nombre o identificación al registro en el encabezado."
      );
      titleInput.focus();
      titleInput.classList.add("ring-2", "ring-red-500", "bg-red-50");
      setTimeout(
        () =>
          titleInput.classList.remove("ring-2", "ring-red-500", "bg-red-50"),
        2000
      );
      return;
    }

    // 2. Validar Formulario Dinámico
    const form = document.querySelector(`form[id^="templateForm_"]`);
    // Nota: como ya no usamos form tag en render, validamos inputs manualmente si tienen 'required'
    // Opcional: Implementar validación manual simple
    const requiredInputs = document.querySelectorAll("[required]");
    let isValid = true;
    requiredInputs.forEach((input) => {
      if (!input.value && input.id !== "documentTitleInput") {
        isValid = false;
        input.classList.add("border-red-500");
      }
    });
    if (!isValid) {
      alert("Por favor completa los campos requeridos marcados.");
      return;
    }

    if (!encryptionService.isReady()) {
      if (window.app && window.app.requireEncryption) {
        window.app.requireEncryption(() => this.handleSave());
      }
      return;
    }

    this.updateEditorState(
      true,
      this.isEditing ? "Cifrando cambios..." : "Creando seguro..."
    );

    try {
      document
        .querySelectorAll(".math-input")
        .forEach((inp) => this.evaluateMathInput(inp));
      await new Promise((r) => setTimeout(r, 100));

      const formData = this.collectFormData();
      let result;

      if (this.isEditing) {
        // Pasamos explicitTitle como 4to argumento (necesitaremos actualizar el servicio)
        // O mejor: pasamos un objeto de opciones
        result = await documentService.updateDocument(
          this.documentId,
          this.template,
          formData,
          explicitTitle // <--- NUEVO
        );
      } else {
        result = await documentService.createDocument(
          this.template,
          formData,
          explicitTitle // <--- NUEVO
        );
      }

      if (this.onSaveSuccess) this.onSaveSuccess(result);
    } catch (error) {
      console.error("Error save:", error);
      alert("Error: " + error.message);
      this.updateEditorState(false);
    }
  }

  collectFormData() {
    const formData = {};
    this.template.fields.forEach((field) => {
      if (field.type === "separator") return; // Ignorar separadores

      if (field.type === "url") {
        const u = document.getElementById(`${field.id}_url`);
        const t = document.getElementById(`${field.id}_text`);
        if (u)
          formData[field.id] = {
            url: u.value.trim(),
            text: t ? t.value.trim() : "",
          };
        return;
      }

      const input = document.getElementById(field.id);
      if (input) {
        if (field.type === "boolean") formData[field.id] = input.checked;
        else if (["number", "currency", "percentage"].includes(field.type)) {
          let val = input.value;
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
      btn.innerHTML = `<i class="fas fa-circle-notch fa-spin mr-2"></i> ${message}`;
      btn.classList.add("opacity-75", "cursor-wait");
    } else {
      btn.disabled = false;
      const icon = this.isEditing ? "fa-sync-alt" : "fa-save";
      const text = this.isEditing ? "Actualizar" : "Guardar";
      btn.innerHTML = `<i class="fas ${icon} mr-2"></i> ${text}`;
      btn.classList.remove("opacity-75", "cursor-wait");
    }
  }

  renderError(msg) {
    document.getElementById("editorContainer").innerHTML = `
        <div class="p-8 text-center bg-white rounded-3xl border border-red-100 shadow-xl">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500 mb-4 animate-bounce">
                <i class="fas fa-bug text-2xl"></i>
            </div>
            <h3 class="text-xl font-bold text-slate-800 mb-2">Algo salió mal</h3>
            <p class="text-slate-500 mb-6">${msg}</p>
            <button id="cancelDocBtn" class="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-bold">Volver</button>
        </div>
    `;
    document
      .getElementById("cancelDocBtn")
      ?.addEventListener("click", () => this.onCancel());
  }
}
