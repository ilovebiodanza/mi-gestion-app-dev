import { documentService } from "../../services/documents/index.js";
import { templateService } from "../../services/templates/index.js";
import { encryptionService } from "../../services/encryption/index.js";
import { copyToWhatsApp } from "./WhatsAppExporter.js";
import { printDocument } from "./PrintExporter.js";
import { getLocalCurrency } from "../../utils/helpers.js";

// --- NUEVOS IMPORTS ---
import { globalPlayer } from "../common/MediaPlayer.js";
import * as FieldRenderers from "./FieldRenderers.js";

export class DocumentViewer {
  constructor(docId, onBack) {
    this.docId = docId;
    this.onBack = onBack;
    this.document = null;
    this.template = null;
    this.decryptedData = null;
    this.currencyConfig = getLocalCurrency();
    this.tableStates = {};
  }

  render() {
    return `<div id="documentViewerPlaceholder" class="animate-fade-in-up pb-16"></div>`;
  }

  async load() {
    this.renderLoading();
    if (!encryptionService.isReady()) {
      if (window.app && window.app.requireEncryption) {
        window.app.requireEncryption(() => this.load());
        return;
      }
      this.renderError("Sistema de cifrado no disponible.");
      return;
    }
    try {
      this.document = await documentService.getDocumentById(this.docId);
      this.template = await templateService.getTemplateById(
        this.document.templateId
      );
      if (!this.template)
        throw new Error("La plantilla original ya no existe.");
      this.decryptedData = await encryptionService.decryptDocument(
        this.document.encryptedContent
      );
      // Inicializar estados de tablas
      this.template.fields.forEach((f) => {
        if (f.type === "table")
          this.tableStates[f.id] = {
            search: "",
            sortCol: null,
            sortDir: "asc",
          };
      });
      this.renderContent();
    } catch (error) {
      console.error(error);
      this.renderError(error.message);
    }
  }

  // --- LÓGICA DE DELEGACIÓN A FIELDRENDERERS ---
  renderFieldValue(type, value, isTableContext = false) {
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return '<span class="text-slate-300 italic text-xs select-none">Vacío</span>';
    }

    switch (type) {
      case "url":
        return FieldRenderers.renderUrlField(value, isTableContext);
      case "boolean":
        return FieldRenderers.renderBoolean(value);
      case "date":
        return FieldRenderers.renderDate(value);
      case "currency":
        return FieldRenderers.renderCurrency(value, this.currencyConfig);
      case "percentage":
        return FieldRenderers.renderPercentage(value);
      case "secret":
        return FieldRenderers.renderSecret(value, isTableContext);
      case "text":
        return FieldRenderers.renderText(value, isTableContext);
      default:
        return String(value);
    }
  }

  renderContent() {
    const container = document.getElementById("documentViewerPlaceholder");
    if (!container) return;

    // Inicializar el Player Base (si no existe)
    globalPlayer.renderBase();

    const updatedAt = new Date(
      this.document.metadata.updatedAt
    ).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const fieldsHtml = this.template.fields
      .map((field) => {
        const isFullWidth = ["separator", "table", "text"].includes(field.type);
        const spanClass = isFullWidth
          ? "col-span-1 md:col-span-2 print:col-span-2"
          : "col-span-1";

        if (field.type === "separator") {
          return `
            <div class="${spanClass} mt-6 mb-2 border-b border-slate-200 pb-2 flex items-center gap-3">
                <div class="w-1.5 h-6 bg-gradient-to-b from-primary to-secondary rounded-full"></div>
                <h3 class="text-lg font-bold text-slate-800 tracking-tight">${field.label}</h3>
            </div>
          `;
        }

        const value = this.decryptedData[field.id];
        if (field.type === "table")
          return `<div class="${spanClass}">${this.renderTableField(
            field,
            value
          )}</div>`;

        // Aquí llamamos al nuevo método refactorizado que llama a FieldRenderers
        const displayValue = this.renderFieldValue(field.type, value);

        return `
        <div class="${spanClass} bg-slate-50/50 rounded-xl p-4 border border-slate-100 hover:bg-slate-50 hover:shadow-sm transition-all group print:break-inside-avoid print:bg-white print:border-slate-300">
          <dt class="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-2">
             ${field.label}
          </dt>
          <dd class="text-sm text-slate-800 break-words leading-relaxed font-medium">
             ${displayValue}
          </dd>
        </div>
      `;
      })
      .join("");

    container.innerHTML = `
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 no-print">
         <button id="backBtn" class="group flex items-center text-slate-500 hover:text-primary transition-colors font-medium">
            <div class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center mr-2 shadow-sm group-hover:-translate-x-1 transition-transform"><i class="fas fa-arrow-left text-xs"></i></div>
            <span>Volver</span>
         </button>
         <div class="flex items-center gap-2 self-end sm:self-auto bg-white p-1.5 rounded-xl shadow-sm border border-slate-200">
            <button id="whatsappDocBtn" class="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="WhatsApp"><i class="fab fa-whatsapp text-lg"></i></button>
            <button id="pdfDocBtn" class="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors" title="Imprimir"><i class="fas fa-print text-lg"></i></button>
            <div class="h-6 w-px bg-slate-100 mx-1"></div>
            <button id="deleteDocBtn" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar"><i class="far fa-trash-alt text-lg"></i></button>
            <button id="editDocBtn" class="flex items-center px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-bold ml-1"><i class="fas fa-pen mr-2 text-xs"></i> <span>Editar</span></button>
         </div>
      </div>

      <div id="documentCard" class="bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden relative print:shadow-none print:border-none">
        <div class="relative px-8 py-10 overflow-hidden">
             <div class="absolute inset-0 opacity-10" style="background-color: ${this.template.color}"></div>
             <div class="absolute top-0 left-0 w-full h-1.5" style="background-color: ${this.template.color}"></div>
             <div class="relative z-10 flex gap-6 items-start">
                <div class="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg bg-white text-gradient" style="color: ${this.template.color}">${this.template.icon}</div>
                <div>
                   <h1 class="text-2xl sm:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight mb-2">${this.document.metadata.title}</h1>
                   <div class="flex flex-wrap items-center gap-3 text-sm">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-lg font-bold text-xs uppercase tracking-wide bg-white/60 border border-slate-200/50 text-slate-600 backdrop-blur-sm">${this.template.name}</span>
                      <span class="text-slate-400 flex items-center text-xs"><i class="far fa-clock mr-1.5"></i> Actualizado: ${updatedAt}</span>
                   </div>
                </div>
             </div>
        </div>
        <div class="p-6 sm:p-8">
           <dl class="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6">
              ${fieldsHtml}
           </dl>
        </div>
        <div class="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center justify-between mt-4">
           <div class="flex items-center text-emerald-600 text-xs font-bold uppercase tracking-wider"><i class="fas fa-shield-alt mr-2 text-lg"></i> Cifrado E2EE Verificado</div>
           <div class="hidden sm:block text-slate-300 text-[10px] font-mono">UUID: ${this.document.id}</div>
        </div>
      </div>

      <div id="rowDetailModal" class="fixed inset-0 z-50 hidden">
         <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" id="modalBackdrop"></div>
         <div class="flex items-center justify-center min-h-screen p-4">
            <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg transform transition-all scale-100 relative overflow-hidden flex flex-col max-h-[85vh] animate-fade-in-up">
                <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 class="font-bold text-lg text-slate-800">Detalles del Registro</h3>
                    <button class="close-modal w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"><i class="fas fa-times"></i></button>
                </div>
                <div class="p-6 overflow-y-auto" id="rowDetailContent"></div>
            </div>
         </div>
      </div>
    `;
    this.setupContentListeners();
  }

  // 2. Agrega este nuevo método a la clase DocumentViewer
  // En src/components/viewer/DocumentViewer.js

  showPrintOptions() {
    // 1. Si NO existe el modal, lo creamos (HTML)
    if (!document.getElementById("printOptionsModal")) {
      const modalHtml = `
        <div id="printOptionsModal" class="fixed inset-0 z-[70] flex items-center justify-center p-4 hidden"> <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" id="printModalBackdrop"></div>
            <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
                <div class="p-6 text-center">
                    <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                        <i class="fas fa-print"></i>
                    </div>
                    <h3 class="text-lg font-bold text-slate-800 mb-2">Selecciona Formato</h3>
                    <p class="text-sm text-slate-500 mb-6">¿Cómo deseas imprimir este documento?</p>
                    
                    <div class="space-y-3">
                        <button id="printStandardBtn" class="w-full flex items-center p-3 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group text-left">
                            <div class="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm mr-3">
                                <i class="fas fa-id-card"></i>
                            </div>
                            <div>
                                <span class="block font-bold text-slate-700 text-sm">Estilo Tarjeta (Visual)</span>
                                <span class="block text-xs text-slate-400">Mejor para presentación</span>
                            </div>
                        </button>

                        <button id="printCompactBtn" class="w-full flex items-center p-3 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left">
                            <div class="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 shadow-sm mr-3">
                                <i class="fas fa-compress-alt"></i>
                            </div>
                            <div>
                                <span class="block font-bold text-slate-700 text-sm">Compacto (Ahorro)</span>
                                <span class="block text-xs text-slate-400">Menos espacio, más datos</span>
                            </div>
                        </button>
                    </div>
                </div>
                <div class="bg-slate-50 p-3 text-center border-t border-slate-100">
                    <button id="cancelPrintBtn" class="text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wide">Cancelar</button>
                </div>
            </div>
        </div>`;
      document.body.insertAdjacentHTML("beforeend", modalHtml);
    }

    // 2. Referencias a elementos
    const modal = document.getElementById("printOptionsModal");
    const closeFn = () => modal.classList.add("hidden");

    // 3. LISTENERS DE CIERRE (Reasignarlos siempre es seguro)
    document.getElementById("printModalBackdrop").onclick = closeFn;
    document.getElementById("cancelPrintBtn").onclick = closeFn;

    // --- CORRECCIÓN CLAVE AQUÍ ---
    // 4. SOBRESCRIBIMOS los eventos onclick CADA VEZ que se llama a la función.
    // Esto asegura que 'this' se refiera a la instancia del documento ACTUAL (Estado Financiero),
    // y no a la instancia vieja (Historia de Salud) que creó el modal originalmente.

    document.getElementById("printStandardBtn").onclick = () => {
      this.triggerPrint(false);
      closeFn();
    };

    document.getElementById("printCompactBtn").onclick = () => {
      this.triggerPrint(true);
      closeFn();
    };

    // 5. Mostrar modal
    modal.classList.remove("hidden");
  }

  // 3. Método auxiliar para llamar al exporter
  triggerPrint(isCompact) {
    const dataToPrint = {
      ...this.document.metadata,
      id: this.document.id,
    };
    // Importante: Ahora pasamos el 4to argumento 'isCompact'
    // Asegúrate de importar printDocument arriba
    import("./PrintExporter.js").then((module) => {
      module.printDocument(
        dataToPrint,
        this.template,
        this.decryptedData,
        isCompact
      );
    });
  }

  setupContentListeners() {
    ["backBtn"].forEach((id) =>
      document
        .getElementById(id)
        ?.addEventListener("click", () => this.onBack())
    );
    document
      .getElementById("deleteDocBtn")
      ?.addEventListener("click", () => this.handleDelete());
    document
      .getElementById("editDocBtn")
      ?.addEventListener("click", () => this.handleEdit());

    document
      .getElementById("pdfDocBtn")
      ?.addEventListener("click", () => this.showPrintOptions());

    document
      .getElementById("whatsappDocBtn")
      ?.addEventListener("click", () => this.handleCopyToWhatsApp());

    const container = document.getElementById("documentViewerPlaceholder");

    // Listeners Tabla (Search)
    container.querySelectorAll(".table-search-input").forEach((input) => {
      input.addEventListener("input", (e) => {
        const fieldId = e.target.dataset.fieldId;
        this.tableStates[fieldId].search = e.target.value;
        this.updateTableUI(fieldId);
      });
    });

    // --- DELEGACIÓN DE EVENTOS CENTRALIZADA ---
    container.addEventListener("click", (e) => {
      // 1. NUEVO: Trigger del MediaPlayer (El botón que agregamos en FieldRenderers)
      const mediaBtn = e.target.closest(".trigger-media-btn");
      if (mediaBtn) {
        e.preventDefault(); // Evitar que el click propague si hay algo más
        const src = mediaBtn.dataset.src;
        const type = mediaBtn.dataset.type;
        const title = mediaBtn.dataset.title;

        // LLAMADA AL SINGLETON DEL REPRODUCTOR
        globalPlayer.open(type, src, title);
        return;
      }

      // 2. Sort Tabla
      const header = e.target.closest(".table-header-sort");
      if (header) {
        const fieldId = header.dataset.fieldId;
        const colId = header.dataset.colId;
        const state = this.tableStates[fieldId];
        if (state.sortCol === colId) {
          state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.sortCol = colId;
          state.sortDir = "asc";
        }
        this.refreshTableFieldHTML(fieldId);
      }

      // 3. Secretos (Reveal/Hide)
      const toggleBtn = e.target.closest(".toggle-secret-btn");
      if (toggleBtn) {
        const wrapper = toggleBtn.parentElement;
        const mask = wrapper.querySelector(".secret-mask");
        const revealed = wrapper.querySelector(".secret-revealed");
        const icon = toggleBtn.querySelector("i");
        if (revealed.classList.contains("hidden")) {
          mask.classList.add("hidden");
          revealed.classList.remove("hidden");
          icon.className = "fas fa-eye-slash";
          toggleBtn.classList.add("text-primary");
        } else {
          mask.classList.remove("hidden");
          revealed.classList.add("hidden");
          icon.className = "fas fa-eye";
          toggleBtn.classList.remove("text-primary");
        }
      }

      // 4. Copiar Texto
      const copyBtn = e.target.closest(".copy-btn");
      if (copyBtn) {
        navigator.clipboard.writeText(copyBtn.dataset.value);
        const icon = copyBtn.querySelector("i");
        icon.className = "fas fa-check text-emerald-500";
        setTimeout(() => (icon.className = "far fa-copy"), 1500);
      }

      // 5. Detalles Fila (Modales de tablas complejas)
      const viewRowBtn = e.target.closest(".view-row-btn");
      if (viewRowBtn)
        this.openRowModal(
          viewRowBtn.dataset.fieldId,
          parseInt(viewRowBtn.dataset.rowIndex)
        );
    });

    // Modales (Row Detail) - Nota: Se eliminó el "mediaModal" viejo
    const rowModal = document.getElementById("rowDetailModal");
    const closeRowModal = () => rowModal.classList.add("hidden");
    rowModal
      ?.querySelectorAll(".close-modal")
      .forEach((b) => b.addEventListener("click", closeRowModal));
    document
      .getElementById("modalBackdrop")
      ?.addEventListener("click", closeRowModal);
  }

  // ... [MANTENER EL RESTO DE MÉTODOS DE TABLA IGUALES] ...
  // (renderTableField, getProcessedRows, updateTableUI, generateTableBodyHtml, refreshTableFieldHTML, openRowModal, etc.)
  // COPIA Y PEGA LOS MÉTODOS DE TABLA DE TU CÓDIGO ORIGINAL AQUÍ ABAJO
  // Para ahorrar espacio en esta respuesta, asumo que mantienes esos métodos sin cambios.

  renderTableField(field, value) {
    // ... (Código original de renderTableField)
    const rows = Array.isArray(value) ? value : [];
    if (rows.length === 0)
      return `<div class="p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-center text-xs text-slate-400 flex flex-col items-center gap-2"><i class="fas fa-table text-xl opacity-20"></i>Tabla vacía</div>`;
    const state = this.tableStates[field.id] || {
      search: "",
      sortCol: null,
      sortDir: "asc",
    };
    const processed = this.getProcessedRows(field, rows);
    const isComplex = field.columns.length > 3;
    const displayCols = isComplex ? field.columns.slice(0, 3) : field.columns;
    const headers = displayCols
      .map(
        (c) =>
          `<th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-primary transition select-none table-header-sort" data-field-id="${
            field.id
          }" data-col-id="${c.id}">${c.label} ${
            state.sortCol === c.id ? (state.sortDir === "asc" ? "↑" : "↓") : ""
          }</th>`
      )
      .join("");
    const body = processed
      .map(
        (row, i) =>
          `<tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors last:border-0">${displayCols
            .map(
              (c) =>
                `<td class="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">${this.renderFieldValue(
                  c.type,
                  row[c.id],
                  true
                )}</td>`
            )
            .join("")}${
            isComplex
              ? `<td class="px-4 py-3 text-right"><button class="view-row-btn text-primary bg-indigo-50 hover:bg-indigo-100 p-1.5 rounded-lg transition" data-field-id="${field.id}" data-row-index="${i}"><i class="fas fa-eye text-xs"></i></button></td>`
              : ""
          }</tr>`
      )
      .join("");
    return `<div class="col-span-full mt-2 mb-2"><div class="flex items-center justify-between mb-3"><label class="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2"><i class="fas fa-table"></i> ${
      field.label
    } <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">${
      rows.length
    }</span></label><input type="text" class="table-search-input text-xs border border-slate-200 rounded-lg px-2 py-1.5 w-40 focus:ring-2 focus:ring-primary/20 outline-none bg-slate-50" placeholder="Buscar..." data-field-id="${
      field.id
    }"></div><div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-100"><div class="overflow-x-auto"><table class="min-w-full"><thead class="bg-slate-50/50 border-b border-slate-100"><tr>${headers}${
      isComplex ? "<th></th>" : ""
    }</tr></thead><tbody id="tbody-${
      field.id
    }">${body}</tbody></table></div></div></div>`;
  }

  getProcessedRows(field, rows) {
    // ... (Código original de getProcessedRows)
    const state = this.tableStates[field.id] || {
      search: "",
      sortCol: null,
      sortDir: "asc",
    };
    let processed = [...rows];
    if (state.search) {
      const term = state.search.toLowerCase();
      const columnsToCheck = field.columns.slice(0, 3);
      processed = processed.filter((row) =>
        columnsToCheck.some((col) => {
          let val = row[col.id];
          if (typeof val === "object" && val !== null)
            val = val.text || val.url || "";
          return String(val || "")
            .toLowerCase()
            .includes(term);
        })
      );
    }
    if (state.sortCol) {
      const colId = state.sortCol;
      const colDef = field.columns.find((c) => c.id === colId);
      processed.sort((a, b) => {
        let valA = a[colId];
        let valB = b[colId];
        if (valA === undefined || valA === null) valA = "";
        if (valB === undefined || valB === null) valB = "";
        if (typeof valA === "object") valA = valA.text || valA.url || "";
        if (typeof valB === "object") valB = valB.text || valB.url || "";
        if (
          colDef &&
          ["number", "currency", "percentage"].includes(colDef.type)
        ) {
          return state.sortDir === "asc" ? valA - valB : valB - valA;
        }
        return state.sortDir === "asc"
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }
    return processed;
  }

  updateTableUI(fieldId) {
    // ... (Código original)
    const field = this.template.fields.find((f) => f.id === fieldId);
    const rows = this.decryptedData[fieldId] || [];
    const processed = this.getProcessedRows(field, rows);
    const tbody = document.getElementById(`tbody-${fieldId}`);
    if (tbody) tbody.innerHTML = this.generateTableBodyHtml(field, processed);
  }

  generateTableBodyHtml(field, rows) {
    // ... (Código original)
    return this.renderTableField(field, rows).match(/<tbody>(.*?)<\/tbody>/)[1];
  }

  refreshTableFieldHTML(fieldId) {
    // ... (Código original)
    const field = this.template.fields.find((f) => f.id === fieldId);
    const rows = this.decryptedData[fieldId] || [];
    const table = document.getElementById(`table-${fieldId}`); // Nota: Asegúrate que tus tablas tengan ID o usa el selector anterior
    // Como tu renderTableField no pone ID a la tabla, usaré el selector por contexto que tenías:
    // Pero tu renderTableField devulve un string...
    // Mantenemos la lógica original tuya:
    const containerDiv = document
      .querySelector(`.table-search-input[data-field-id="${fieldId}"]`)
      .closest(".col-span-full");
    if (containerDiv) {
      containerDiv.outerHTML = this.renderTableField(field, rows);
      // Re-attach listener
      const newContainer = document
        .querySelector(`.table-search-input[data-field-id="${fieldId}"]`)
        .closest(".col-span-full");
      const input = newContainer.querySelector(".table-search-input");
      if (input) {
        input.addEventListener("input", (e) => {
          this.tableStates[fieldId].search = e.target.value;
          this.updateTableUI(fieldId);
        });
      }
    }
  }

  openRowModal(fieldId, rowIndex) {
    // ... (Código original)
    const field = this.template.fields.find((f) => f.id === fieldId);
    if (!field) return;
    const rowsOriginal = this.decryptedData[fieldId] || [];
    const rowsProcessed = this.getProcessedRows(field, rowsOriginal);
    const rowData = rowsProcessed[rowIndex];
    const content = field.columns
      .map(
        (col) =>
          `<div class="py-3 border-b border-slate-100 last:border-0"><p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">${
            col.label || col.name
          }</p><div class="text-slate-800 text-sm break-words">${this.renderFieldValue(
            col.type,
            rowData[col.id]
          )}</div></div>`
      )
      .join("");
    document.getElementById("rowDetailContent").innerHTML = content;
    document.getElementById("rowDetailModal").classList.remove("hidden");
  }

  renderLoading() {
    // ... (Igual al original)
    document.getElementById(
      "documentViewerPlaceholder"
    ).innerHTML = `<div class="flex flex-col items-center justify-center py-24"><div class="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-primary mb-4"></div><p class="text-slate-400 animate-pulse">Desencriptando documento...</p></div>`;
  }

  renderError(msg) {
    // ... (Igual al original)
    document.getElementById(
      "documentViewerPlaceholder"
    ).innerHTML = `<div class="max-w-2xl mx-auto mt-10 p-6 bg-red-50 border border-red-100 rounded-xl text-center"><i class="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i><h3 class="text-red-800 font-bold text-lg">Error de Carga</h3><p class="text-red-600 mt-2">${msg}</p><button id="backBtn" class="mt-6 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition">Volver</button></div>`;
    document
      .getElementById("backBtn")
      ?.addEventListener("click", () => this.onBack());
  }

  async handleDelete() {
    // ... (Igual al original)
    if (!confirm("¿Estás seguro de eliminar este documento permanentemente?"))
      return;
    try {
      await documentService.deleteDocument(this.docId);
      this.onBack();
    } catch (error) {
      alert(error.message);
    }
  }

  handleEdit() {
    // ... (Igual al original)
    this.onBack({
      documentId: this.docId,
      template: this.template,
      formData: this.decryptedData,
      metadata: this.document.metadata,
    });
  }

  async handleCopyToWhatsApp() {
    const btn = document.getElementById("whatsappDocBtn");
    // Feedback visual de "Cargando..."
    const originalIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin text-lg"></i>';

    try {
      await copyToWhatsApp(
        this.document.metadata,
        this.template,
        this.decryptedData,
        this.currencyConfig
      );

      // Feedback de Éxito
      btn.innerHTML = '<i class="fas fa-check text-green-500 text-lg"></i>';
      setTimeout(() => (btn.innerHTML = originalIcon), 2000);
    } catch (e) {
      alert("Error al copiar para WhatsApp");
      btn.innerHTML = originalIcon;
    }
  }
}
