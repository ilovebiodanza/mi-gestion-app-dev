import { BaseElement } from "../BaseElement.js";
import { FormManager } from "../../editor/core/FormManager.js";
import { ElementRegistry } from "../ElementRegistry.js"; // IMPORTANTE

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
    return "Lista de ítems con columnas personalizadas.";
  }

  static getColumns() {
    return 2;
  }

  constructor(def, value) {
    super(def, Array.isArray(value) ? value : []);
    this.columns = def.columns || [];
    this.sortState = { colId: null, dir: null };
    this.cellInstances = [];
  }

  // --- 1. CONFIGURACIÓN ---
  renderSettings() {
    return `<div class="md:col-span-2 p-3 bg-indigo-50 text-indigo-700 text-xs rounded-xl border border-indigo-100 flex items-center gap-2">
        <i class="fas fa-info-circle"></i>
        <span>Las columnas se configuran en el editor de estructura.</span>
    </div>`;
  }

  // ===========================================================================
  //                              2. EDITOR (Input)
  // ===========================================================================

  renderEditor() {
    const headers = this.columns
      .map(
        (c) =>
          `<th class="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell border-b border-slate-200" data-type="${c.type}">${c.label}</th>`
      )
      .join("");

    const rowsHtml = this._renderEditorRows();

    return `
      <div class="table-element-container border border-slate-200 rounded-xl overflow-hidden bg-white mt-2 col-span-full flex flex-col gap-1">
        <div class="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <i class="fas fa-table"></i> ${this.def.label}
            </span>
            <div class="flex items-center gap-2">
                <button type="button" class="btn-export-csv text-slate-500 hover:text-indigo-600 hover:bg-white px-2 py-1 rounded-md transition-colors text-xs font-bold border border-transparent hover:border-slate-200 flex items-center gap-1">
                    <i class="fas fa-download"></i> <span class="hidden sm:inline">Exportar</span>
                </button>
                <label class="btn-import-csv cursor-pointer text-slate-500 hover:text-emerald-600 hover:bg-white px-2 py-1 rounded-md transition-colors text-xs font-bold border border-transparent hover:border-slate-200 flex items-center gap-1">
                    <input type="file" class="csv-input hidden" accept=".csv" id="csv-${this.def.id}">
                    <i class="fas fa-upload"></i> <span class="hidden sm:inline">Importar</span>
                </label>
            </div>
        </div>

        <div class="overflow-x-auto max-h-[400px] custom-scrollbar bg-slate-50/30">
          <table class="w-full text-left border-collapse">
            <thead class="bg-slate-50 hidden md:table-header-group sticky top-0 z-10 shadow-sm">
              <tr>${headers}<th class="w-24 px-4 py-2 text-center text-xs font-bold text-slate-500 uppercase hidden md:table-cell bg-slate-50 border-b border-slate-200">Acciones</th></tr>
            </thead>
            <tbody class="block md:table-row-group p-4 md:p-0 space-y-4 md:space-y-0 divide-y divide-slate-200 md:divide-slate-100" id="tbody-${this.def.id}">
              ${rowsHtml}
            </tbody>
          </table>
        </div>
        
        <button type="button" class="add-row-btn w-full py-3 bg-white hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-wider transition-colors border-t border-slate-200 flex items-center justify-center gap-2 group">
           <i class="fas fa-plus-circle group-hover:scale-110 transition-transform"></i> Agregar Registro
        </button>
      </div>`;
  }

  _renderEditorRows() {
    if (this.value.length === 0) {
      return `<tr><td colspan="${
        this.columns.length + 1
      }" class="block md:table-cell p-8 text-center text-xs text-slate-400 italic bg-white">
        <div class="flex flex-col items-center gap-2"><i class="fas fa-inbox text-2xl opacity-20"></i><span>Sin registros.</span></div>
      </td></tr>`;
    }

    return this.value
      .map((row, idx) => {
        const cells = this.columns
          .map((col) => {
            let displayHtml = "—";
            try {
              // 🟢 CLAVE: Usamos el ElementRegistry para renderizar la celda
              // Esto asegura que 'currency' se vea como moneda, 'date' como fecha, etc.
              const ElementClass = ElementRegistry.get(col.type);
              const cellEl = new ElementClass(col, row[col.id]);
              displayHtml = cellEl.renderViewer(); // Usamos el modo visor para la tabla
            } catch (e) {
              // Fallback por si falla
              displayHtml = String(row[col.id] || "-");
            }

            return `
            <td class="block md:table-cell px-4 py-2 md:py-3 align-top text-sm border-b md:border-none border-slate-100 last:border-0"${
              ["number", "percentage", "currency"].includes(col.type)
                ? ` data-col-value="${row[col.id]}"`
                : ``
            }>
                <span class="md:hidden block text-[10px] font-bold text-slate-400 uppercase mb-1">${
                  col.label
                }</span>
                <div class="text-slate-700 font-medium break-words truncate max-w-[200px]">${displayHtml}</div>
            </td>`;
          })
          .join("");

        return `
        <tr class="block md:table-row bg-white md:hover:bg-slate-50 transition-colors group rounded-xl shadow-sm md:shadow-none border border-slate-200 md:border-none mb-4 md:mb-0" data-idx="${idx}">
          ${cells}
          <td class="block md:table-cell px-4 py-3 md:py-3 text-right md:text-center align-middle whitespace-nowrap bg-slate-50 md:bg-transparent rounded-b-xl md:rounded-none border-t md:border-none border-slate-100">
             <div class="flex items-center justify-end md:justify-center gap-1">
                 <button type="button" class="btn-edit w-8 h-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" data-idx="${idx}"><i class="fas fa-pencil-alt text-xs"></i></button>
                 <button type="button" class="btn-del w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" data-idx="${idx}"><i class="fas fa-trash-alt text-xs"></i></button>
                 <button type="button" class="drag-handle w-8 h-8 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-move"><i class="fas fa-grip-vertical text-xs"></i></button>
             </div>
          </td>
        </tr>`;
      })
      .join("");
  }

  postRenderEditor(container, onChange) {
    const tbody = container.querySelector(`#tbody-${this.def.id}`);
    if (!tbody) return;

    if (window.Sortable) {
      new Sortable(tbody, {
        handle: ".drag-handle",
        animation: 150,
        ghostClass: "bg-indigo-50",
        onEnd: (evt) => {
          if (evt.oldIndex !== evt.newIndex) {
            const movedItem = this.value.splice(evt.oldIndex, 1)[0];
            this.value.splice(evt.newIndex, 0, movedItem);
            onChange(this.def.id, this.value);
            this._refreshEditor(container, onChange);
          }
        },
      });
    }

    container
      .querySelector(".add-row-btn")
      ?.addEventListener("click", () =>
        this._openModal(null, container, onChange)
      );

    // Importación CSV simplificada (placeholder)
    container
      .querySelector(`#csv-${this.def.id}`)
      ?.addEventListener("change", (e) => {
        if (e.target.files.length) {
          // Aquí iría tu lógica de importación CSV completa
          alert("Importación CSV en proceso de migración.");
          e.target.value = "";
        }
      });

    tbody.addEventListener("click", (e) => {
      const btnEdit = e.target.closest(".btn-edit");
      const btnDel = e.target.closest(".btn-del");

      if (btnEdit)
        this._openModal(parseInt(btnEdit.dataset.idx), container, onChange);

      if (btnDel && confirm("¿Eliminar este registro?")) {
        this.value.splice(parseInt(btnDel.dataset.idx), 1);
        onChange(this.def.id, this.value);
        this._refreshEditor(container, onChange);
      }
    });
  }

  _refreshEditor(container, onChange) {
    const wrapper = container.querySelector(".table-element-container");
    if (wrapper) {
      wrapper.outerHTML = this.renderEditor();
      this.postRenderEditor(container, onChange);
    }
  }

  _openModal(idx, container, onChange) {
    const isEdit = idx !== null;
    const initialData = isEdit ? this.value[idx] : {};
    const formManager = new FormManager(this.columns, initialData);
    const modalId = `modal-${this.def.id}-${Date.now()}`;

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
          <div class="p-6 overflow-y-auto custom-scrollbar space-y-4" id="modal-body-${modalId}">${formManager.renderHtml()}</div>
          <div class="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
             <button type="button" class="modal-cancel px-4 py-2 text-slate-600 font-bold hover:bg-white rounded-lg transition text-sm">Cancelar</button>
             <button type="button" class="modal-save px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow hover:bg-indigo-700 transition text-sm">Guardar</button>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    const modalEl = document.getElementById(modalId);

    // IMPORTANTE: Activar listeners del FormManager (para que funcionen los inputs dentro del modal)
    formManager.postRender(document.getElementById(`modal-body-${modalId}`));

    const close = () => modalEl.remove();
    modalEl.querySelector(".modal-backdrop").onclick = close;
    modalEl.querySelector(".modal-close").onclick = close;
    modalEl.querySelector(".modal-cancel").onclick = close;

    modalEl.querySelector(".modal-save").onclick = () => {
      const validData = formManager.getValidData();
      if (validData) {
        if (isEdit) this.value[idx] = validData;
        else this.value.push(validData);

        onChange(this.def.id, this.value);
        this._refreshEditor(container, onChange);
        close();
      }
    };
  }

  // ===========================================================================
  //                              3. VIEWER (Visualización)
  // ===========================================================================

  renderViewer() {
    this.cellInstances = [];
    const rows = this._getSortedRows();

    if (rows.length === 0) {
      return `<div class="p-6 border border-dashed border-slate-200 rounded-lg bg-slate-50 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
         <i class="fas fa-table text-xl opacity-20"></i> Tabla vacía
       </div>`;
    }

    const headers = this.columns
      .map((c) => {
        const isActive = this.sortState.colId === c.id;
        const icon = isActive
          ? this.sortState.dir === "asc"
            ? "⬆️"
            : "⬇️"
          : "↕️";
        const activeClass = isActive
          ? "text-slate-700 bg-slate-200"
          : "text-slate-400 hover:text-slate-600 hover:bg-slate-100";

        return `
            <th class="px-4 py-2 align-middle border-b border-slate-100 bg-slate-50/50">
                <div class="flex items-center justify-between gap-2">
                    <span class="text-xs font-bold text-slate-500 uppercase">${c.label}</span>
                    <button type="button" class="sort-btn w-6 h-6 flex items-center justify-center rounded transition-colors ${activeClass}" data-col="${c.id}">
                        <span class="text-[10px]">${icon}</span>
                    </button>
                </div>
            </th>`;
      })
      .join("");

    const body = this._renderViewerBody(rows);

    return `
    <div class="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm table-viewer" id="viewer-${this.def.id}">
        <div class="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center gap-2">
            <span class="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                ${this.def.label} <span class="bg-white border border-slate-200 px-2 rounded-full text-[10px] text-slate-400">${rows.length}</span>
            </span>
            <input type="text" class="search-input pl-3 pr-2 py-1 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:border-indigo-400 w-40 transition-all" placeholder="Buscar...">
        </div>
        <div class="overflow-x-auto max-h-[500px] custom-scrollbar">
            <table class="min-w-full text-sm text-left text-slate-600">
                <thead class="sticky top-0 z-10 shadow-sm"><tr>${headers}</tr></thead>
                <tbody class="divide-y divide-slate-100">${body}</tbody>
            </table>
            <div class="no-results hidden p-4 text-center text-xs text-slate-400">No se encontraron resultados.</div>
        </div>
    </div>`;
  }

  _renderViewerBody(rows) {
    return rows
      .map((row) => {
        const cells = this.columns
          .map((col) => {
            try {
              // 🟢 CLAVE: Usamos el Registry también en el Visor
              const ElementClass = ElementRegistry.get(col.type);
              const cellValue = row[col.id];
              const cellEl = new ElementClass(col, cellValue);

              // Si el elemento tiene interactividad (ej: SecretElement), lo guardamos
              if (typeof cellEl.postRenderViewer === "function") {
                this.cellInstances.push(cellEl);
              }

              return `<td class="px-4 py-2 text-sm text-slate-600 whitespace-nowrap">${cellEl.renderViewer()}</td>`;
            } catch (e) {
              return `<td class="px-4 py-2 text-sm text-slate-600 whitespace-nowrap">${
                row[col.id] || "-"
              }</td>`;
            }
          })
          .join("");
        return `<tr class="hover:bg-slate-50/50 transition-colors">${cells}</tr>`;
      })
      .join("");
  }

  postRenderViewer(container) {
    const root = container.querySelector(`#viewer-${this.def.id}`);
    if (!root) return;

    // 1. Activar interactividad de celdas
    this.cellInstances.forEach((el) => {
      if (el.postRenderViewer) el.postRenderViewer(root);
    });

    // 2. Ordenamiento
    root.querySelectorAll(".sort-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const col = btn.dataset.col;
        if (this.sortState.colId !== col)
          this.sortState = { colId: col, dir: "asc" };
        else if (this.sortState.dir === "asc")
          this.sortState = { colId: col, dir: "desc" };
        else this.sortState = { colId: null, dir: null };

        const newHtml = this.renderViewer();
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = newHtml;
        root.replaceWith(tempDiv.firstElementChild);

        // Re-hidratar eventos tras actualizar DOM
        const newRoot = container.querySelector(`#viewer-${this.def.id}`);
        if (newRoot) this.postRenderViewer(container);
      });
    });

    // 3. Búsqueda
    const searchInput = root.querySelector(".search-input");
    const tbody = root.querySelector("tbody");
    const noRes = root.querySelector(".no-results");

    searchInput?.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      let visible = 0;
      Array.from(tbody.rows).forEach((row) => {
        const text = row.textContent.toLowerCase();
        if (text.includes(term)) {
          row.style.display = "";
          visible++;
        } else {
          row.style.display = "none";
        }
      });
      if (noRes) noRes.style.display = visible === 0 ? "block" : "none";
    });
  }

  _getSortedRows() {
    if (!this.sortState.colId) return [...this.value];
    return [...this.value].sort((a, b) => {
      const valA = a[this.sortState.colId] || "";
      const valB = b[this.sortState.colId] || "";
      const comparison = String(valA).localeCompare(String(valB), undefined, {
        numeric: true,
      });
      return this.sortState.dir === "asc" ? comparison : -comparison;
    });
  }

  // --- 4. IMPRESIÓN ---
  renderPrint(mode) {
    const headers = this.columns
      .map(
        (c) =>
          `<th class="text-left text-[10px] uppercase font-bold text-slate-500 border-b border-slate-300 pb-1">${c.label}</th>`
      )
      .join("");
    const rows = this.value
      .map((row) => {
        const cells = this.columns
          .map((c) => {
            // Intento simplificado para impresión
            try {
              const val = row[c.id];
              if (c.type === "currency" && val)
                return `<td class="text-xs text-slate-700 py-1 border-b border-slate-100 text-right">$ ${val}</td>`;
              return `<td class="text-xs text-slate-700 py-1 border-b border-slate-100">${
                val || "-"
              }</td>`;
            } catch (e) {
              return `<td>-</td>`;
            }
          })
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");

    return `
        <div class="mb-4 mt-2 page-break avoid-break-inside">
           <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">${this.def.label}</h4>
           <table class="w-full"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>
        </div>`;
  }
}
