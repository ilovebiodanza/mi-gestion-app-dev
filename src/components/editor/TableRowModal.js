// src/components/editor/TableRowModal.js
import { renderCellInput } from "./InputRenderers.js";

export class TableRowModal {
  constructor() {
    this.modalId = "table-row-editor-modal";
    this.formId = "table-row-editor-form";
    this.onSave = null;
    this.currentColumns = [];
    this.renderBase();
  }

  renderBase() {
    if (document.getElementById(this.modalId)) return;

    const html = `
        <div id="${this.modalId}" class="fixed inset-0 z-[80] hidden">
            <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" id="${this.modalId}-backdrop"></div>
            
            <div class="relative w-full h-full flex items-center justify-center p-4">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all scale-100 flex flex-col max-h-[90vh] animate-fade-in-up">
                    
                    <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                        <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <i class="fas fa-edit text-indigo-500"></i> <span id="${this.modalId}-title">Editar Registro</span>
                        </h3>
                        <button type="button" class="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition" id="${this.modalId}-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <div class="p-6 overflow-y-auto custom-scrollbar">
                        <form id="${this.formId}" class="space-y-5">
                            </form>
                    </div>

                    <div class="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
                        <button type="button" class="px-4 py-2 text-slate-600 font-bold hover:bg-white hover:shadow-sm rounded-lg border border-transparent hover:border-slate-200 transition text-sm" id="${this.modalId}-cancel">
                            Cancelar
                        </button>
                        <button type="button" class="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition transform active:scale-95 text-sm" id="${this.modalId}-save">
                            <i class="fas fa-check mr-1.5"></i> Guardar
                        </button>
                    </div>
                </div>
            </div>
        </div>`;

    document.body.insertAdjacentHTML("beforeend", html);

    const close = () =>
      document.getElementById(this.modalId).classList.add("hidden");
    document.getElementById(`${this.modalId}-backdrop`).onclick = close;
    document.getElementById(`${this.modalId}-close`).onclick = close;
    document.getElementById(`${this.modalId}-cancel`).onclick = close;

    document.getElementById(`${this.modalId}-save`).onclick = () =>
      this.handleSave();
  }

  open(columnsDef, rowData, rowIndex, onSaveCallback) {
    this.currentColumns = columnsDef;
    this.onSave = onSaveCallback;
    this.rowIndex = rowIndex;

    const title = document.getElementById(`${this.modalId}-title`);
    title.textContent =
      rowIndex !== null ? "Editar Registro" : "Nuevo Registro";

    const formContainer = document.getElementById(this.formId);
    formContainer.innerHTML = "";

    columnsDef.forEach((col) => {
      const val = rowData ? rowData[col.id] : null;
      // Generamos el HTML base (que viene con estilos de tabla "invisibles")
      const inputHtml = renderCellInput(col, val);

      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">${col.label}</label>
                <div class="input-wrapper-modal relative">${inputHtml}</div>
            `;

      // Limpieza de wrappers extra que trae renderCellInput
      const innerP1 = wrapper.querySelector(".p-1");
      if (innerP1) {
        // Extraemos el contenido del p-1 para evitar padding doble
        const content = innerP1.innerHTML;
        innerP1.outerHTML = content;
      }

      formContainer.appendChild(wrapper);
    });

    // 1. TRANSFORMACIÓN VISUAL: De "Tabla" a "Formulario"
    this.transformInputsToModalStyle(formContainer);

    // 2. ACTIVAR FUNCIONALIDAD
    this.attachListeners(formContainer);

    document.getElementById(this.modalId).classList.remove("hidden");
  }

  /**
   * Esta función es la CLAVE. Busca los inputs "invisibles" de la tabla
   * y les aplica las clases de formulario estándar (bordes, fondo, etc.)
   */
  transformInputsToModalStyle(container) {
    const inputs = container.querySelectorAll("input, select, textarea");

    inputs.forEach((input) => {
      // Quitamos clases de "Tabla transparente"
      input.classList.remove(
        "bg-transparent",
        "border-0",
        "focus:ring-0",
        "text-right"
      );

      // Agregamos clases de "Formulario Modal" (Igual que en AuthForms o Editor Principal)
      input.classList.add(
        "w-full",
        "bg-slate-50",
        "border",
        "border-slate-200",
        "rounded-xl",
        "focus:bg-white",
        "focus:ring-2",
        "focus:ring-primary/50",
        "focus:border-primary",
        "transition-all",
        "px-4",
        "py-3" // Más padding para que se vea bien en el modal
      );

      // Ajustes específicos
      if (input.tagName === "TEXTAREA") {
        input.classList.add("min-h-[100px]"); // Forzar altura en modal
      }

      // Si es numérico/matemático, alineamos a la izquierda en el modal (o derecha si prefieres)
      // pero quitamos 'text-right' forzado de la tabla para que se vea más natural en form móvil
      if (input.classList.contains("math-input")) {
        // Opcional: input.classList.add('text-right');
      }
    });

    // Arreglo especial para el grupo URL (que tiene estructura compleja)
    container.querySelectorAll(".url-cell-group").forEach((group) => {
      group.classList.remove("p-1");
      group.classList.add("space-y-3");
      group
        .querySelectorAll(".border-none")
        .forEach((i) => i.classList.remove("border-none"));
    });
  }

  handleSave() {
    const formContainer = document.getElementById(this.formId);
    const rowObj = {};

    formContainer.querySelectorAll(".cell-input").forEach((input) => {
      const colId = input.dataset.colId;
      const colDef = this.currentColumns.find((c) => c.id === colId);

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
          // Evaluar matemáticas antes de guardar por si acaso
          if (input.classList.contains("math-input"))
            this.evaluateMathInput(input);
          val =
            input.value === "" || isNaN(input.value)
              ? null
              : Number(input.value);
        }
      }
      rowObj[colId] = val;
    });

    if (this.onSave) this.onSave(rowObj, this.rowIndex);
    document.getElementById(this.modalId).classList.add("hidden");
  }

  attachListeners(container) {
    // 1. Toggle Passwords
    container.querySelectorAll(".toggle-pass-cell").forEach((btn) => {
      // Ajuste visual del botón en el modal (estaba flotando raro)
      btn.classList.add("absolute", "right-3", "top-3", "z-10");

      btn.onclick = (e) => {
        e.preventDefault();
        const wrapper = btn.closest(".input-wrapper-modal");
        const input = wrapper.querySelector("input");
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
      };
    });

    // 2. Sync URLs
    container.querySelectorAll(".url-cell-group").forEach((group) => {
      const hidden = group.querySelector(".url-json-store");
      const link = group.querySelector(".url-part-link");
      const text = group.querySelector(".url-part-text");
      const sync = () => {
        hidden.value = JSON.stringify({
          url: link.value.trim(),
          text: text.value.trim(),
        });
      };
      link.oninput = sync;
      text.oninput = sync;
    });

    // 3. Math Inputs
    container.querySelectorAll(".math-input").forEach((input) => {
      const handleMath = () => this.evaluateMathInput(input);

      input.addEventListener("blur", handleMath);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === "=") {
          e.preventDefault();
          handleMath();
        }
      });
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
          // Efecto visual en el modal
          const oldBorder = input.style.borderColor;
          input.style.borderColor = "#10b981"; // Emerald
          input.style.backgroundColor = "#ecfdf5"; // Emerald-50
          setTimeout(() => {
            input.style.borderColor = oldBorder;
            input.style.backgroundColor = "";
          }, 800);
        }
      } catch (e) {}
    }
  }
}

export const tableRowModal = new TableRowModal();
