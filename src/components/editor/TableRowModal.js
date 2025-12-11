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

    // Listeners estáticos
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
    this.rowIndex = rowIndex; // null si es nuevo

    const title = document.getElementById(`${this.modalId}-title`);
    title.textContent =
      rowIndex !== null ? "Editar Registro" : "Nuevo Registro";

    const formContainer = document.getElementById(this.formId);
    formContainer.innerHTML = "";

    // Generar formulario
    columnsDef.forEach((col) => {
      const val = rowData ? rowData[col.id] : null;

      // Usamos renderCellInput (tu función existente)
      // Pero la envolvemos en un label bonito para el modal
      const inputHtml = renderCellInput(col, val);

      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">${col.label}</label>
                <div class="input-wrapper-modal">${inputHtml}</div>
            `;

      // Ajustes post-render (quitamos padding extra de celdas)
      const inputDiv = wrapper.querySelector(".p-1"); // renderCellInput suele tener p-1
      if (inputDiv) inputDiv.classList.remove("p-1");

      formContainer.appendChild(wrapper);
    });

    // Activar lógica JS de los inputs (toggle password, sync urls, math)
    // Reutilizamos la lógica que ya tenías o creamos una mini versión aquí
    this.attachListeners(formContainer);

    document.getElementById(this.modalId).classList.remove("hidden");
  }

  handleSave() {
    const formContainer = document.getElementById(this.formId);
    const rowObj = {};

    // Recolectar datos (Lógica similar a updateHiddenTableInput)
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
          val = val === "" || isNaN(val) ? null : Number(val);
        }
      }
      rowObj[colId] = val;
    });

    if (this.onSave) this.onSave(rowObj, this.rowIndex);
    document.getElementById(this.modalId).classList.add("hidden");
  }

  attachListeners(container) {
    // Toggle Passwords
    container.querySelectorAll(".toggle-pass-cell").forEach((btn) => {
      btn.onclick = () => {
        const input = btn.previousElementSibling;
        const icon = btn.querySelector("i");
        if (input.type === "password") {
          input.type = "text";
          icon.className = "fas fa-eye-slash";
        } else {
          input.type = "password";
          icon.className = "fas fa-eye";
        }
      };
    });

    // Sync URLs
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
  }
}

export const tableRowModal = new TableRowModal();
