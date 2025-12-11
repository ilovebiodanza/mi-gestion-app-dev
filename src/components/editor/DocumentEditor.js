// src/components/editor/DocumentEditor.js

import { templateFormGenerator } from "../../services/templates/form-generator.js"; // Ajusta ruta si es necesario
import { documentService } from "../../services/documents/index.js";
import { encryptionService } from "../../services/encryption/index.js";
import { renderCellPreview } from "./InputRenderers.js"; // <--- IMPORTAR PREVIEW
import { tableRowModal } from "./TableRowModal.js"; // <--- IMPORTAR MODAL

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
    // Estado de Carga
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

    const initialTitle = this.isEditing ? this.documentMetadata?.title : "";
    const submitText = this.isEditing ? "Actualizar" : "Guardar";
    const submitIcon = this.isEditing ? "fa-sync-alt" : "fa-save";

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
        #documentTitleInput:placeholder-shown { font-style: italic; }
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

    this.setupMathCalculations();
    this.setupTableInteractivity();
  }

  // --- LÓGICA DE TABLAS (Refactorizada) ---
  setupTableInteractivity() {
    const containers = document.querySelectorAll(".table-input-container");

    containers.forEach((container) => {
      container.className =
        "table-input-container w-full overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100";

      const fieldId = container.dataset.fieldId;
      const hiddenInput = container.querySelector(`#${fieldId}`); // LA FUENTE DE LA VERDAD
      const tbody = container.querySelector(".table-body");

      // 1. Obtener definición de columnas
      let columnsDef = [];
      try {
        columnsDef = JSON.parse(container.nextElementSibling.textContent);
      } catch (e) {}

      // 2. Función Renderizado de Tabla (Solo Lectura + Botones)
      const renderTableFromJSON = () => {
        tbody.innerHTML = "";
        let currentData = [];
        try {
          // Intentamos parsear. Si falla (por el error de comillas), usamos array vacío
          // para que al menos la página cargue y te deje "reparar" la tabla manualmente.
          currentData = JSON.parse(hiddenInput.value || "[]");
        } catch (e) {
          console.error(
            "Error parseando datos de tabla (Recuperando modo seguro):",
            e
          );
          currentData = []; // Fallback a vacío para no romper la app

          // Opcional: Mostrar un aviso visual en la tabla
          tbody.innerHTML = `<tr><td colspan="100%" class="p-4 text-red-500 bg-red-50 text-xs font-bold text-center">Error cargando datos de esta tabla. Se ha reiniciado por seguridad.</td></tr>`;
          return;
        }
        if (currentData.length === 0) {
          tbody.innerHTML = `<tr><td colspan="${
            columnsDef.length + 1
          }" class="p-6 text-center text-xs text-slate-400 italic">No hay registros aún.</td></tr>`;
          return;
        }

        currentData.forEach((row, index) => {
          const tr = document.createElement("tr");
          tr.className =
            "border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group";

          let tds = "";
          columnsDef.forEach((col) => {
            // Usamos el renderCellPreview para mostrar texto bonito
            tds += `<td class="px-4 py-3 align-top border-r border-slate-50 last:border-0">${renderCellPreview(
              col,
              row[col.id]
            )}</td>`;
          });

          // Columna de Acciones
          tds += `
             <td class="w-24 text-center p-0 align-middle whitespace-nowrap">
                 <div class="flex items-center justify-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                     <button type="button" class="edit-row-btn w-8 h-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" data-index="${index}" title="Editar">
                        <i class="fas fa-pencil-alt text-xs"></i>
                     </button>
                     <button type="button" class="remove-row-btn w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" data-index="${index}" title="Eliminar">
                        <i class="fas fa-trash-alt text-xs"></i>
                     </button>
                 </div>
             </td>`;

          tr.innerHTML = tds;
          tbody.appendChild(tr);
        });
      };

      // 3. Render Inicial
      renderTableFromJSON();

      // 4. Botón Agregar (Abre Modal Vacío)
      const addBtn = container.querySelector(".add-row-btn");
      if (addBtn) {
        addBtn.className =
          "add-row-btn w-full py-3 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-wider transition-colors border-t border-slate-100 flex items-center justify-center gap-2 group";
        addBtn.innerHTML =
          '<i class="fas fa-plus-circle group-hover:scale-110 transition-transform"></i> Agregar Registro';

        // --- CLICK AGREGAR ---
        addBtn.addEventListener("click", () => {
          tableRowModal.open(columnsDef, {}, null, (newRowData) => {
            // Guardar Nuevo
            const currentData = JSON.parse(hiddenInput.value || "[]");
            currentData.push(newRowData);
            hiddenInput.value = JSON.stringify(currentData);
            renderTableFromJSON(); // Repintar
          });
        });
      }

      // 5. Delegación de Eventos (Editar / Eliminar)
      tbody.addEventListener("click", (e) => {
        // --- CLICK ELIMINAR ---
        const delBtn = e.target.closest(".remove-row-btn");
        if (delBtn) {
          const index = parseInt(delBtn.dataset.index);
          const currentData = JSON.parse(hiddenInput.value || "[]");
          currentData.splice(index, 1); // Borrar
          hiddenInput.value = JSON.stringify(currentData);
          renderTableFromJSON(); // Repintar
        }

        // --- CLICK EDITAR ---
        const editBtn = e.target.closest(".edit-row-btn");
        if (editBtn) {
          const index = parseInt(editBtn.dataset.index);
          const currentData = JSON.parse(hiddenInput.value || "[]");
          const rowData = currentData[index];

          tableRowModal.open(
            columnsDef,
            rowData,
            index,
            (updatedRowData, idx) => {
              // Guardar Edición
              const dataNow = JSON.parse(hiddenInput.value || "[]");
              dataNow[idx] = updatedRowData;
              hiddenInput.value = JSON.stringify(dataNow);
              renderTableFromJSON(); // Repintar
            }
          );
        }
      });
    });
  }

  attachRowListeners(tr) {
    // Math Inputs
    tr.querySelectorAll(".math-input").forEach((input) => {
      input.addEventListener("blur", () => this.evaluateMathInput(input));
      input.addEventListener(
        "keydown",
        (e) =>
          (e.key === "Enter" || e.key === "=") && this.evaluateMathInput(input)
      );
    });

    // URL Inputs (Sincronización JSON)
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

    // Toggle Password
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

  async handleSave() {
    if (this.isSubmitting) return;

    // 1. Validar Título
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

    // 2. Validar Formulario
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
      // Evaluar matemáticas pendientes
      document
        .querySelectorAll(".math-input")
        .forEach((inp) => this.evaluateMathInput(inp));
      await new Promise((r) => setTimeout(r, 100));

      const formData = this.collectFormData();
      let result;

      if (this.isEditing) {
        result = await documentService.updateDocument(
          this.documentId,
          this.template,
          formData,
          explicitTitle
        );
      } else {
        result = await documentService.createDocument(
          this.template,
          formData,
          explicitTitle
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
      if (field.type === "separator") return;

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
        </div>`;
    document
      .getElementById("cancelDocBtn")
      ?.addEventListener("click", () => this.onCancel());
  }
}
