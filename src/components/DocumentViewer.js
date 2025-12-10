// src/components/DocumentViewer.js

import { documentService } from "../services/documents/index.js";
import { templateService } from "../services/templates/index.js";
import { encryptionService } from "../services/encryption/index.js";
import { getFieldTypeLabel, getLocalCurrency } from "../utils/helpers.js";

export class DocumentViewer {
  constructor(docId, onBack) {
    this.docId = docId;
    this.onBack = onBack;
    this.document = null;
    this.template = null;
    this.decryptedData = null;
    this.currencyConfig = getLocalCurrency();
  }

  render() {
    return `<div id="documentViewerPlaceholder" class="animate-fade-in pb-12"></div>`;
  }

  async load() {
    this.renderLoading();
    try {
      this.document = await documentService.getDocumentById(this.docId);
      this.template = await templateService.getTemplateById(
        this.document.templateId
      );

      if (!this.template)
        throw new Error("La plantilla original ya no existe.");
      if (!encryptionService.isReady())
        throw new Error("Cifrado no inicializado.");

      this.decryptedData = await encryptionService.decryptDocument({
        content: this.document.encryptedContent,
        metadata: this.document.encryptionMetadata,
      });

      this.renderContent();
    } catch (error) {
      console.error("Error:", error);
      this.renderError(error.message);
    }
  }

  // --- RENDERIZADO DE VALORES (Formateo rico) ---
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
          ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200"><i class="fas fa-check mr-1"></i> Sí</span>'
          : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">No</span>';

      case "date":
        try {
          const [year, month, day] = String(value).split("-").map(Number);
          const dateObj = new Date(year, month - 1, day);
          return `<span class="font-medium text-slate-700"><i class="far fa-calendar-alt mr-1.5 text-slate-400"></i>${new Intl.DateTimeFormat(
            this.currencyConfig.locale,
            { dateStyle: "medium" }
          ).format(dateObj)}</span>`;
        } catch (e) {
          return value;
        }

      case "currency":
        const numVal = Number(value);
        if (isNaN(numVal)) return value;
        const formatted = new Intl.NumberFormat(this.currencyConfig.locale, {
          style: "currency",
          currency: this.currencyConfig.codigo,
        }).format(numVal);
        return `<span class="font-mono font-medium text-slate-700 tracking-tight">${formatted}</span>`;

      case "percentage":
        return `<span class="font-mono text-slate-700">${value}%</span>`;

      case "secret":
        if (isTableContext)
          return '<span class="text-xs text-slate-400 font-mono">••••••</span>';
        return `
            <div class="relative group inline-flex items-center max-w-full">
              <div class="secret-container relative overflow-hidden rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-sm">
                 <span class="secret-mask filter blur-[4px] select-none transition-all duration-300 group-hover:blur-none font-mono text-sm text-slate-800" data-value="${value}">••••••••••••</span>
                 <span class="secret-revealed hidden font-mono text-sm text-slate-800 select-all">${value}</span>
              </div>
              <button class="toggle-secret-btn ml-2 text-slate-400 hover:text-primary transition-colors p-1" title="Revelar permanentemente">
                <i class="fas fa-eye"></i>
              </button>
              <button class="copy-btn ml-1 text-slate-400 hover:text-emerald-600 transition-colors p-1" data-value="${value}" title="Copiar">
                <i class="far fa-copy"></i>
              </button>
            </div>`;

      case "url":
        let url = value;
        let text = value;
        if (typeof value === "object" && value !== null) {
          url = value.url;
          text = value.text || value.url;
        }
        if (!url)
          return '<span class="text-slate-300 italic">Sin enlace</span>';
        const display =
          isTableContext && text.length > 20
            ? text.substring(0, 17) + "..."
            : text;
        return `<a href="${url}" target="_blank" class="inline-flex items-center text-primary hover:text-primary-hover hover:underline transition-colors group">
                <i class="fas fa-link mr-1.5 text-xs opacity-50 group-hover:opacity-100"></i> ${display}
            </a>`;

      case "text":
        if (isTableContext)
          return value.length > 30
            ? `<span title="${value}">${value.substring(0, 30)}...</span>`
            : value;
        return `<div class="prose prose-sm max-w-none text-slate-700 bg-slate-50/50 p-4 rounded-xl border border-slate-100 leading-relaxed">${value}</div>`;

      default:
        return String(value);
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

    const fieldsHtml = this.template.fields
      .map((field, index) => {
        if (index === 0) return "";
        const value = this.decryptedData[field.id];

        if (field.type === "table") return this.renderTableField(field, value);

        const displayValue = this.renderFieldValue(field.type, value);
        return `
        <div class="group py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 hover:bg-slate-50/80 transition-colors rounded-lg">
          <dt class="text-sm font-medium text-slate-500 flex items-center mb-1 sm:mb-0">
             ${field.label}
          </dt>
          <dd class="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2 break-words leading-6">
             ${displayValue}
          </dd>
        </div>
      `;
      })
      .join("");

    container.innerHTML = `
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 px-2 no-print">
         
         <button id="backBtn" class="flex items-center text-slate-500 hover:text-primary transition-colors font-medium">
            <div class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center mr-2 shadow-sm">
                <i class="fas fa-arrow-left text-sm"></i>
            </div>
            <span>Volver</span>
         </button>
         
         <div class="flex items-center gap-2 self-end sm:self-auto bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            <button id="whatsappDocBtn" class="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Copiar para WhatsApp">
               <i class="fab fa-whatsapp text-lg"></i>
            </button>
            <button id="pdfDocBtn" class="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors" title="Imprimir / PDF">
               <i class="fas fa-print text-lg"></i>
            </button>

            <div class="h-6 w-px bg-slate-200 mx-1"></div>

            <button id="deleteDocBtn" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
               <i class="far fa-trash-alt text-lg"></i>
            </button>
            <button id="editDocBtn" class="flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg shadow-sm transition-all text-sm font-medium ml-1">
               <i class="fas fa-pen mr-2 text-xs"></i> <span>Editar</span>
            </button>
         </div>
      </div>

      <div id="documentCard" class="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative print:shadow-none print:border-none">
        <div class="h-1.5 w-full bg-gradient-to-r from-primary to-secondary"></div>
        
        <div class="px-6 py-8 sm:px-8 border-b border-slate-100 bg-white">
          <div class="flex items-start justify-between">
            <div class="flex gap-5">
               <div class="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-slate-50" 
                    style="background-color: ${this.template.color}10; color: ${
      this.template.color
    }">
                  ${this.template.icon}
               </div>
               <div>
                  <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">${
                    this.document.metadata.title
                  }</h1>
                  <div class="flex items-center mt-2 text-sm text-slate-500 space-x-3">
                     <span class="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium text-slate-600 uppercase tracking-wide">${
                       this.template.name
                     }</span>
                     <span>&bull;</span>
                     <span><i class="far fa-clock mr-1"></i> ${updatedAt}</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div class="px-4 py-6 sm:px-8">
           <dl class="space-y-1">
              ${fieldsHtml}
           </dl>
        </div>

        <div class="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-center sm:justify-between">
           <div class="flex items-center text-emerald-600 text-xs font-medium">
              <i class="fas fa-lock mr-2"></i> Protegido con cifrado de extremo a extremo
           </div>
           <div class="hidden sm:block text-slate-400 text-xs font-mono">
              ID: ${this.document.id.substring(0, 8)}...
           </div>
        </div>
      </div>

      <div id="rowDetailModal" class="fixed inset-0 z-50 hidden">
         <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" id="modalBackdrop"></div>
         <div class="flex items-center justify-center min-h-screen p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all scale-100 relative overflow-hidden flex flex-col max-h-[85vh]">
                <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 class="font-bold text-slate-800">Detalles del Registro</h3>
                    <button class="close-modal text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full p-1"><i class="fas fa-times"></i></button>
                </div>
                <div class="p-6 overflow-y-auto" id="rowDetailContent"></div>
            </div>
         </div>
      </div>
    `;

    this.setupContentListeners();
  }

  renderTableField(field, value) {
    const rows = Array.isArray(value) ? value : [];
    const columns = field.columns || [];

    if (rows.length === 0) {
      return `
        <div class="py-5 px-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/30 text-center my-4">
            <p class="text-sm font-medium text-slate-500 mb-1">${field.label}</p>
            <p class="text-xs text-slate-400">Sin registros almacenados</p>
        </div>`;
    }

    const isComplex = columns.length > 3;
    const displayColumns = isComplex ? columns.slice(0, 3) : columns;

    const headers = displayColumns
      .map(
        (c) =>
          `<th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">${
            c.label || c.name
          }</th>`
      )
      .join("");

    const body = rows
      .map((row, idx) => {
        const cells = displayColumns
          .map(
            (c) =>
              `<td class="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">${this.renderFieldValue(
                c.type,
                row[c.id],
                true
              )}</td>`
          )
          .join("");

        const actionBtn = isComplex
          ? `<td class="px-4 py-3 text-right"><button class="view-row-btn text-primary hover:bg-blue-50 p-1.5 rounded transition" data-field-id="${field.id}" data-row-index="${idx}"><i class="fas fa-eye"></i></button></td>`
          : "";

        return `<tr class="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 even:bg-slate-50/50">${cells}${actionBtn}</tr>`;
      })
      .join("");

    return `
      <div class="py-6 sm:col-span-3">
         <div class="flex items-center justify-between mb-3">
             <dt class="text-sm font-medium text-slate-500">${field.label}</dt>
             <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">${
               rows.length
             } registros</span>
         </div>
         <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
             <div class="overflow-x-auto">
                 <table class="min-w-full divide-y divide-slate-100">
                    <thead class="bg-slate-50"><tr>${headers}${
      isComplex ? '<th class="w-10"></th>' : ""
    }</tr></thead>
                    <tbody class="divide-y divide-slate-100 bg-white">${body}</tbody>
                 </table>
             </div>
             ${
               isComplex
                 ? '<div class="bg-slate-50/50 px-4 py-2 text-[10px] text-slate-400 text-center border-t border-slate-100 uppercase tracking-wide">Mostrando vista previa • Click en ojo para detalles</div>'
                 : ""
             }
         </div>
      </div>
    `;
  }

  setupContentListeners() {
    // Botones globales
    ["closeViewerBtn", "backBtn"].forEach((id) =>
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

    // Delegación de eventos
    const container = document.getElementById("documentViewerPlaceholder");
    container.addEventListener("click", (e) => {
      // Toggle Secret
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

      // Copiar
      const copyBtn = e.target.closest(".copy-btn");
      if (copyBtn) {
        navigator.clipboard.writeText(copyBtn.dataset.value);
        const icon = copyBtn.querySelector("i");
        icon.className = "fas fa-check text-emerald-500";
        setTimeout(() => (icon.className = "far fa-copy"), 1500);
      }

      // Ver fila modal
      const viewRowBtn = e.target.closest(".view-row-btn");
      if (viewRowBtn)
        this.openRowModal(
          viewRowBtn.dataset.fieldId,
          parseInt(viewRowBtn.dataset.rowIndex)
        );
    });

    // Modal
    const modal = document.getElementById("rowDetailModal");
    const closeModal = () => modal.classList.add("hidden");
    modal
      ?.querySelectorAll(".close-modal")
      .forEach((b) => b.addEventListener("click", closeModal));
    document
      .getElementById("modalBackdrop")
      ?.addEventListener("click", closeModal);
  }

  openRowModal(fieldId, rowIndex) {
    const field = this.template.fields.find((f) => f.id === fieldId);
    if (!field) return;
    const rowData = this.decryptedData[fieldId][rowIndex];

    const content = field.columns
      .map(
        (col) => `
        <div class="py-3 border-b border-slate-100 last:border-0">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">${
              col.label || col.name
            }</p>
            <div class="text-slate-800 text-sm break-words">${this.renderFieldValue(
              col.type,
              rowData[col.id]
            )}</div>
        </div>
    `
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
