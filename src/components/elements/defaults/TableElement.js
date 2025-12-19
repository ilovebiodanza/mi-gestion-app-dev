import { BaseElement } from "../BaseElement.js";
// Ajustamos la ruta para llegar a components/editor/core/FormManager.js
// Desde elements/defaults/ -> ../../ es components/
import { FormManager } from "../../editor/core/FormManager.js";

export class TableElement extends BaseElement {
  static getType() {
    return "table";
  }
  static getLabel() {
    return "Tabla Dinámica";
  }
  static getIcon() {
    return "fas fa-table";
  }
  static getDescription() {
    return "Lista de ítems con columnas.";
  }

  constructor(def, value) {
    super(def, Array.isArray(value) ? value : []);
    this.columns = def.columns || [];
  }

  renderTemplate() {
    return `<div class="p-2 bg-amber-50 text-amber-700 text-xs rounded border border-amber-200">
        Las columnas de la tabla se configuran en el editor avanzado.
    </div>`;
  }

  // --- EDITOR ---
  renderEditor() {
    const headers = this.columns
      .map(
        (c) =>
          `<th class="px-2 py-1 text-left text-[10px] font-bold text-slate-400 uppercase">${c.label}</th>`
      )
      .join("");

    return `
      <div class="table-element-wrapper border border-slate-200 rounded-xl overflow-hidden bg-white mt-2">
         <div class="bg-slate-50 px-3 py-2 border-b border-slate-200 flex justify-between items-center">
            <span class="text-xs font-bold text-slate-500 uppercase"><i class="fas fa-table mr-1"></i> ${
              this.def.label
            }</span>
            <button type="button" class="add-row-btn text-xs bg-white border border-slate-200 hover:border-brand-500 hover:text-brand-600 px-2 py-1 rounded transition-colors shadow-sm font-bold">
                <i class="fas fa-plus"></i> Agregar
            </button>
         </div>
         <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-slate-50 border-b border-slate-200"><tr>${headers}<th class="w-16"></th></tr></thead>
                <tbody id="tbody-${
                  this.def.id
                }" class="divide-y divide-slate-100">
                    ${this._renderRows()}
                </tbody>
            </table>
         </div>
         ${
           this.value.length === 0
             ? '<div class="p-4 text-center text-xs text-slate-400 italic">Sin registros</div>'
             : ""
         }
      </div>
    `;
  }

  _renderRows() {
    return this.value
      .map((row, idx) => {
        const cells = this.columns
          .map((col) => {
            // Lógica interna para previsualizar celda (Reemplaza a renderCellPreview)
            let txt = row[col.id];

            // Manejo de objetos (como URLs o fechas complejas)
            if (txt && typeof txt === "object") {
              txt = txt.text || txt.url || JSON.stringify(txt);
            }

            // Manejo de booleanos
            if (typeof txt === "boolean") {
              txt = txt ? "Sí" : "No";
            }

            return `<td class="px-2 py-2 text-sm text-slate-700 truncate max-w-[150px]">${
              txt || "-"
            }</td>`;
          })
          .join("");

        return `
            <tr class="group hover:bg-slate-50 transition-colors">
                ${cells}
                <td class="px-2 py-2 text-right whitespace-nowrap">
                    <button type="button" class="btn-edit-row text-slate-400 hover:text-brand-600 mr-2 transition-colors" data-idx="${idx}"><i class="fas fa-pencil-alt"></i></button>
                    <button type="button" class="btn-del-row text-slate-400 hover:text-red-600 transition-colors" data-idx="${idx}"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
      })
      .join("");
  }

  postRenderEditor(container, onChange) {
    const tbody = container.querySelector(`#tbody-${this.def.id}`);
    const addBtn = container.querySelector(`.add-row-btn`);

    if (!tbody) return;

    // Listener Agregar
    addBtn?.addEventListener("click", () =>
      this._openModal(null, container, onChange)
    );

    // Listeners delegados para Editar/Borrar
    tbody.addEventListener("click", (e) => {
      const btnEdit = e.target.closest(".btn-edit-row");
      const btnDel = e.target.closest(".btn-del-row");

      if (btnDel) {
        if (confirm("¿Borrar fila?")) {
          this.value.splice(btnDel.dataset.idx, 1);
          onChange(this.def.id, this.value);
          // Re-render manual del componente
          this._refreshWrapper(container, onChange);
        }
      }

      if (btnEdit) {
        this._openModal(parseInt(btnEdit.dataset.idx), container, onChange);
      }
    });
  }

  _refreshWrapper(container, onChange) {
    // Método auxiliar para redibujar la tabla sin perder el contenedor padre
    const wrapper = container.querySelector(".table-element-wrapper");
    if (wrapper) {
      wrapper.outerHTML = this.renderEditor();
      // Importante: Volver a atar los eventos
      this.postRenderEditor(container, onChange);
    }
  }

  _openModal(rowIndex, container, onChange) {
    const isEdit = rowIndex !== null;
    const initialData = isEdit ? this.value[rowIndex] : {};

    // Instancia temporal de FormManager para el modal
    const formManager = new FormManager(this.columns, initialData);
    const modalId = `modal-${this.def.id}-${Date.now()}`;

    // HTML del Modal
    const modalHTML = `
        <div id="${modalId}" class="fixed inset-0 z-[100] flex items-center justify-center p-4" style="z-index: 9999;">
          <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity modal-backdrop"></div>
          <div class="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 class="font-bold text-lg text-slate-800">${
                isEdit ? "Editar Registro" : "Nuevo Registro"
              }</h3>
              <button type="button" class="modal-close text-slate-400 hover:text-slate-600"><i class="fas fa-times"></i></button>
            </div>
            <div class="p-6 overflow-y-auto custom-scrollbar space-y-4" id="modal-body-${modalId}">
                ${formManager.renderHtml()}
            </div>
            <div class="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
               <button type="button" class="modal-cancel px-4 py-2 text-slate-600 font-bold hover:bg-white rounded-lg transition text-sm">Cancelar</button>
               <button type="button" class="modal-save px-6 py-2 bg-brand-600 text-white font-bold rounded-lg shadow hover:bg-brand-700 transition text-sm">Guardar</button>
            </div>
          </div>
        </div>
      `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    const modalEl = document.getElementById(modalId);
    const modalBody = document.getElementById(`modal-body-${modalId}`);

    // Activar listeners del FormManager dentro del modal
    formManager.postRender(modalBody);

    const closeModal = () => modalEl.remove();

    // Eventos del Modal
    modalEl.querySelector(".modal-backdrop").onclick = closeModal;
    modalEl.querySelector(".modal-close").onclick = closeModal;
    modalEl.querySelector(".modal-cancel").onclick = closeModal;
    modalEl.querySelector(".modal-save").onclick = () => {
      const validData = formManager.getValidData();
      if (validData) {
        if (isEdit) this.value[rowIndex] = validData;
        else this.value.push(validData);

        onChange(this.def.id, this.value);
        this._refreshWrapper(container, onChange);
        closeModal();
      }
    };
  }

  // --- VIEWER ---
  renderViewer() {
    if (!this.value.length)
      return `<div class="text-xs text-slate-400 italic">Tabla vacía</div>`;

    const headers = this.columns
      .map(
        (c) =>
          `<th class="px-3 py-2 text-left text-[10px] font-bold uppercase text-slate-500 bg-slate-50 border-b border-slate-100">${c.label}</th>`
      )
      .join("");

    const rows = this.value
      .map((row) => {
        const cells = this.columns
          .map((c) => {
            let val = row[c.id];
            if (typeof val === "object" && val !== null)
              val = val.text || val.url || JSON.stringify(val);
            return `<td class="px-3 py-2 text-sm text-slate-700 border-b border-slate-50">${
              val || ""
            }</td>`;
          })
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");

    return `<div class="overflow-x-auto border border-slate-200 rounded-lg shadow-sm"><table class="w-full min-w-max"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }
}
