// src/components/DocumentViewer.js

import { documentService } from "../services/documents/index.js";
import { templateService } from "../services/templates/index.js";
import { encryptionService } from "../services/encryption/index.js";
import { getLocalCurrency } from "../utils/helpers.js";

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

  renderContent() {
    const container = document.getElementById("documentViewerPlaceholder");
    if (!container) return;

    const updatedAt = new Date(
      this.document.metadata.updatedAt
    ).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // --- GENERACIÓN DEL GRID DE CAMPOS ---
    const fieldsHtml = this.template.fields
      .map((field, index) => {
        // 1. Determinar si ocupa ancho completo (2 columnas) o normal (1 columna)
        // Tipos anchos: Separador, Tabla, Texto Largo (textarea), URL
        const isFullWidth = ["separator", "table", "text"].includes(field.type);
        const spanClass = isFullWidth ? "md:col-span-2" : "md:col-span-1";

        // 2. CASO ESPECIAL: SEPARADOR
        if (field.type === "separator") {
          return `
            <div class="${spanClass} mt-6 mb-2 border-b border-slate-200 pb-2 flex items-center gap-3">
                <div class="w-1.5 h-6 bg-gradient-to-b from-primary to-secondary rounded-full"></div>
                <h3 class="text-lg font-bold text-slate-800 tracking-tight">${field.label}</h3>
            </div>
          `;
        }

        // 3. Renderizar valor
        const value = this.decryptedData[field.id];

        // Caso Tabla
        if (field.type === "table") {
          return `<div class="${spanClass}">${this.renderTableField(
            field,
            value
          )}</div>`;
        }

        // Caso Campos Normales
        const displayValue = this.renderFieldValue(field.type, value);

        // Estilo de "Caja" (Label arriba, valor abajo) para el Grid
        return `
        <div class="${spanClass} bg-slate-50/50 rounded-xl p-4 border border-slate-100 hover:bg-slate-50 hover:shadow-sm transition-all group">
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
            <div class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center mr-2 shadow-sm group-hover:-translate-x-1 transition-transform">
                <i class="fas fa-arrow-left text-xs"></i>
            </div>
            <span>Volver</span>
         </button>
         
         <div class="flex items-center gap-2 self-end sm:self-auto bg-white p-1.5 rounded-xl shadow-sm border border-slate-200">
            <button id="whatsappDocBtn" class="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="WhatsApp">
               <i class="fab fa-whatsapp text-lg"></i>
            </button>
            <button id="pdfDocBtn" class="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors" title="Imprimir / PDF">
               <i class="fas fa-print text-lg"></i>
            </button>
            <div class="h-6 w-px bg-slate-100 mx-1"></div>
            <button id="deleteDocBtn" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
               <i class="far fa-trash-alt text-lg"></i>
            </button>
            <button id="editDocBtn" class="flex items-center px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-bold ml-1">
               <i class="fas fa-pen mr-2 text-xs"></i> <span>Editar</span>
            </button>
         </div>
      </div>

      <div id="documentCard" class="bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden relative print:shadow-none print:border-none">
        
        <div class="relative px-8 py-10 overflow-hidden">
             <div class="absolute inset-0 opacity-10" style="background-color: ${this.template.color}"></div>
             <div class="absolute top-0 left-0 w-full h-1.5" style="background-color: ${this.template.color}"></div>

             <div class="relative z-10 flex gap-6 items-start">
                <div class="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg bg-white text-gradient" 
                     style="color: ${this.template.color}">
                   ${this.template.icon}
                </div>
                <div>
                   <h1 class="text-2xl sm:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight mb-2">
                     ${this.document.metadata.title}
                   </h1>
                   <div class="flex flex-wrap items-center gap-3 text-sm">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-lg font-bold text-xs uppercase tracking-wide bg-white/60 border border-slate-200/50 text-slate-600 backdrop-blur-sm">
                        ${this.template.name}
                      </span>
                      <span class="text-slate-400 flex items-center text-xs">
                        <i class="far fa-clock mr-1.5"></i> Actualizado: ${updatedAt}
                      </span>
                   </div>
                </div>
             </div>
        </div>

        <div class="p-6 sm:p-8">
           <dl class="grid grid-cols-1 md:grid-cols-2 gap-6">
              ${fieldsHtml}
           </dl>
        </div>

        <div class="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center justify-between mt-4">
           <div class="flex items-center text-emerald-600 text-xs font-bold uppercase tracking-wider">
              <i class="fas fa-shield-alt mr-2 text-lg"></i> Cifrado E2EE Verificado
           </div>
           <div class="hidden sm:block text-slate-300 text-[10px] font-mono">
              UUID: ${this.document.id}
           </div>
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

  renderFieldValue(type, value, isTableContext = false) {
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return '<span class="text-slate-300 italic text-xs select-none">Vacío</span>';
    }

    switch (type) {
      case "boolean":
        return value
          ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700"><i class="fas fa-check mr-1"></i> Sí</span>'
          : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">No</span>';

      case "date":
        try {
          const [y, m, d] = String(value).split("-");
          const dateObj = new Date(y, m - 1, d);
          return `<span class="font-semibold text-slate-700"><i class="far fa-calendar text-slate-400 mr-2"></i>${dateObj.toLocaleDateString()}</span>`;
        } catch {
          return value;
        }

      case "currency":
        const formatted = new Intl.NumberFormat(this.currencyConfig.locale, {
          style: "currency",
          currency: this.currencyConfig.codigo,
        }).format(Number(value));
        return `<span class="font-mono font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">${formatted}</span>`;

      case "percentage":
        return `<span class="font-mono font-bold text-slate-700">${value}%</span>`;

      case "secret":
        if (isTableContext) {
          return `<div class="group cursor-pointer select-none"><span class="blur-sm group-hover:blur-none transition-all font-mono text-xs bg-slate-100 px-1 rounded">••••••</span></div>`;
        }
        return `
            <div class="flex items-center gap-2">
              <div class="relative group overflow-hidden rounded-lg border border-slate-200 bg-white px-3 py-2 transition-all hover:border-indigo-200 hover:shadow-sm w-full">
                 <span class="secret-mask filter blur-[5px] select-none transition-all duration-300 group-hover:blur-none font-mono text-sm text-slate-800 tracking-wider">••••••••••••••</span>
                 <span class="secret-revealed hidden font-mono text-sm text-slate-800 select-all font-bold tracking-wide">${value}</span>
              </div>
              <button class="toggle-secret-btn w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors bg-white border border-slate-200" title="Revelar">
                <i class="fas fa-eye"></i>
              </button>
              <button class="copy-btn w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors bg-white border border-slate-200" data-value="${value}" title="Copiar">
                <i class="far fa-copy"></i>
              </button>
            </div>`;

      case "url":
        let url = typeof value === "object" ? value.url : value;
        let text = typeof value === "object" ? value.text || url : value;
        if (!url) return '<span class="text-slate-300 italic">--</span>';

        const display =
          isTableContext && text.length > 20
            ? text.substring(0, 18) + "..."
            : text;
        return `
            <a href="${url}" target="_blank" class="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors">
                <i class="fas fa-link text-xs opacity-50"></i> ${display}
            </a>`;

      case "text":
        if (isTableContext)
          return value.length > 30 ? value.substring(0, 30) + "..." : value;
        return `<div class="prose prose-sm max-w-none text-slate-600 whitespace-pre-line">${value}</div>`;

      default:
        return String(value);
    }
  }

  renderTableField(field, value) {
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
        (c) => `
        <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-primary transition select-none table-header-sort" data-field-id="${
          field.id
        }" data-col-id="${c.id}">
            ${c.label} ${
          state.sortCol === c.id ? (state.sortDir === "asc" ? "↑" : "↓") : ""
        }
        </th>`
      )
      .join("");

    const body = processed
      .map(
        (row, i) => `
        <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors last:border-0">
            ${displayCols
              .map(
                (c) =>
                  `<td class="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">${this.renderFieldValue(
                    c.type,
                    row[c.id],
                    true
                  )}</td>`
              )
              .join("")}
            ${
              isComplex
                ? `<td class="px-4 py-3 text-right"><button class="view-row-btn text-primary bg-indigo-50 hover:bg-indigo-100 p-1.5 rounded-lg transition" data-field-id="${field.id}" data-row-index="${i}"><i class="fas fa-eye text-xs"></i></button></td>`
                : ""
            }
        </tr>`
      )
      .join("");

    return `
      <div class="col-span-full mt-2 mb-2">
         <div class="flex items-center justify-between mb-3">
             <label class="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                <i class="fas fa-table"></i> ${
                  field.label
                } <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">${
      rows.length
    }</span>
             </label>
             <input type="text" class="table-search-input text-xs border border-slate-200 rounded-lg px-2 py-1.5 w-40 focus:ring-2 focus:ring-primary/20 outline-none bg-slate-50" placeholder="Buscar..." data-field-id="${
               field.id
             }">
         </div>
         <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-100">
             <div class="overflow-x-auto">
                 <table class="min-w-full"><thead class="bg-slate-50/50 border-b border-slate-100"><tr>${headers}${
      isComplex ? "<th></th>" : ""
    }</tr></thead>
                 <tbody>${body}</tbody></table>
             </div>
         </div>
      </div>`;
  }

  // --- Helpers Lógica ---
  getProcessedRows(field, rows) {
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
      ?.addEventListener("click", () => window.print());
    document
      .getElementById("whatsappDocBtn")
      ?.addEventListener("click", () => this.handleCopyToWhatsApp());
    const container = document.getElementById("documentViewerPlaceholder");
    container.querySelectorAll(".table-search-input").forEach((input) => {
      input.addEventListener("input", (e) => {
        const fieldId = e.target.dataset.fieldId;
        this.tableStates[fieldId].search = e.target.value;
        this.updateTableUI(fieldId);
      });
    });
    container.addEventListener("click", (e) => {
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
      const copyBtn = e.target.closest(".copy-btn");
      if (copyBtn) {
        navigator.clipboard.writeText(copyBtn.dataset.value);
        const icon = copyBtn.querySelector("i");
        icon.className = "fas fa-check text-emerald-500";
        setTimeout(() => (icon.className = "far fa-copy"), 1500);
      }
      const viewRowBtn = e.target.closest(".view-row-btn");
      if (viewRowBtn)
        this.openRowModal(
          viewRowBtn.dataset.fieldId,
          parseInt(viewRowBtn.dataset.rowIndex)
        );
    });
    const modal = document.getElementById("rowDetailModal");
    const closeModal = () => modal.classList.add("hidden");
    modal
      ?.querySelectorAll(".close-modal")
      .forEach((b) => b.addEventListener("click", closeModal));
    document
      .getElementById("modalBackdrop")
      ?.addEventListener("click", closeModal);
  }

  updateTableUI(fieldId) {
    const field = this.template.fields.find((f) => f.id === fieldId);
    const rows = this.decryptedData[fieldId] || [];
    const processed = this.getProcessedRows(field, rows);
    const tbody = document.getElementById(`tbody-${fieldId}`);
    if (tbody) tbody.innerHTML = this.generateTableBodyHtml(field, processed);
  }
  generateTableBodyHtml(field, rows) {
    return this.renderTableField(field, rows).match(/<tbody>(.*?)<\/tbody>/)[1];
  }
  refreshTableFieldHTML(fieldId) {
    const field = this.template.fields.find((f) => f.id === fieldId);
    const rows = this.decryptedData[fieldId] || [];
    const table = document.getElementById(`table-${fieldId}`);
    if (table) {
      const containerDiv = table.closest(".col-span-full");
      if (containerDiv) {
        containerDiv.outerHTML = this.renderTableField(field, rows);
        const newContainer = document
          .getElementById(`table-${fieldId}`)
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
  }
  openRowModal(fieldId, rowIndex) {
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
    document.getElementById(
      "documentViewerPlaceholder"
    ).innerHTML = `<div class="flex flex-col items-center justify-center py-24"><div class="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-primary mb-4"></div><p class="text-slate-400 animate-pulse">Desencriptando documento...</p></div>`;
  }
  renderError(msg) {
    document.getElementById(
      "documentViewerPlaceholder"
    ).innerHTML = `<div class="max-w-2xl mx-auto mt-10 p-6 bg-red-50 border border-red-100 rounded-xl text-center"><i class="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i><h3 class="text-red-800 font-bold text-lg">Error de Carga</h3><p class="text-red-600 mt-2">${msg}</p><button id="backBtn" class="mt-6 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition">Volver</button></div>`;
    document
      .getElementById("backBtn")
      ?.addEventListener("click", () => this.onBack());
  }
  async handleDelete() {
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
    this.onBack({
      documentId: this.docId,
      template: this.template,
      formData: this.decryptedData,
      metadata: this.document.metadata,
    });
  }
  async handleCopyToWhatsApp() {
    try {
      let waText = `*${this.document.metadata.title}*\n_${this.template.name}_\n\n`;
      this.template.fields.forEach((field, index) => {
        if (index === 0) return;
        const value = this.decryptedData[field.id];
        if (field.type === "table") {
          const rows = Array.isArray(value) ? value : [];
          waText += `*${field.label}:* ${
            rows.length === 0 ? "_Sin datos_" : ""
          }\n`;
          rows.forEach((r, i) => {
            waText += `  ${i + 1}. `;
            field.columns?.forEach(
              (c) =>
                (waText += `${c.label}: ${this.getFormattedValueForText(
                  c.type,
                  r[c.id]
                )} | `)
            );
            waText += `\n`;
          });
        } else {
          waText += `*${field.label}:* ${this.getFormattedValueForText(
            field.type,
            value
          )}\n`;
        }
      });
      waText += `\n_Enviado desde Mi Gestión_`;
      await navigator.clipboard.writeText(waText);
      const btn = document.getElementById("whatsappDocBtn");
      btn.innerHTML = '<i class="fas fa-check text-green-500 text-lg"></i>';
      setTimeout(
        () => (btn.innerHTML = '<i class="fab fa-whatsapp text-lg"></i>'),
        2000
      );
    } catch (e) {
      console.error(e);
    }
  }
  getFormattedValueForText(type, value) {
    if (value === undefined || value === null || value === "") return "_N/A_";
    if (type === "boolean") return value ? "Sí" : "No";
    if (type === "currency")
      return new Intl.NumberFormat(this.currencyConfig.locale).format(
        Number(value)
      );
    return String(value);
  }
}
