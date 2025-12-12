// src/components/templates/TemplateForm.js
import { generateFieldId, getCategoryIcon } from "../../utils/helpers.js";
import {
  renderMainLayout,
  renderFieldItemConfig,
} from "./TemplateFormRenderers.js";

export class TemplateForm {
  constructor(handlers) {
    this.handlers = handlers; // { onSave, onCancel }
    this.activeFieldItem = null;
    this.mainSortable = null;
    this.modalSortable = null;
  }

  render(template = null) {
    // 1. PRIMERO generamos el HTML de los campos (si existen)
    const fieldsHtml = (template?.fields || [])
      .map((f, i) => renderFieldItemConfig(f, i))
      .join("");

    // 2. LUEGO llamamos al layout pasando los campos ya generados
    // Esto asegura que se coloquen dentro del <div id="fieldsContainer">
    return renderMainLayout(!!template, template, fieldsHtml);
  }

  setupListeners(container) {
    // Listeners Generales
    const catSelect = container.querySelector("#templateCategory");
    const iconInput = container.querySelector("#templateIcon");
    if (catSelect && iconInput) {
      catSelect.addEventListener(
        "change",
        (e) => (iconInput.value = getCategoryIcon(e.target.value))
      );
    }

    container
      .querySelector("#addFieldBtn")
      ?.addEventListener("click", () => this.addField(container));

    // Inicializar Drag & Drop principal
    this.initSortable(container.querySelector("#fieldsContainer"), "main");
    this.updateNoFieldsMessage(container);

    const fieldsContainer = container.querySelector("#fieldsContainer");
    if (fieldsContainer) {
      // Delegación de eventos para eliminar/configurar campos
      fieldsContainer.addEventListener("click", (e) => {
        if (e.target.closest(".remove-field")) {
          e.target.closest(".field-item").remove();
          this.updateNoFieldsMessage(container);
        }
        if (e.target.closest(".configure-table-btn")) {
          this.openColumnsModal(e.target.closest(".field-item"));
        }
      });

      // Cambio de tipo de campo
      fieldsContainer.addEventListener("change", (e) => {
        if (e.target.classList.contains("field-type")) {
          const item = e.target.closest(".field-item");
          const currentLabel = item.querySelector(".field-label").value;
          const currentId = item.dataset.fieldId;
          const newType = e.target.value;

          const tempField = {
            id: currentId,
            label: currentLabel,
            type: newType,
            options: [],
            columns: [],
            required: false,
          };

          item.outerHTML = renderFieldItemConfig(tempField);
        }
      });
    }

    // Botón Guardar (Formulario Principal)
    const form = container.querySelector("#templateForm");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveData();
      });
    }

    // Botón Guardar (Header)
    container
      .querySelector("#saveTemplateBtnHeader")
      ?.addEventListener("click", () => {
        if (form) form.dispatchEvent(new Event("submit"));
      });

    container
      .querySelector("#cancelTemplate")
      ?.addEventListener("click", () => this.handlers.onCancel());

    this.setupModalListeners();
  }

  initSortable(element, type) {
    if (!element || !window.Sortable) return;
    // Limpieza de instancias previas para evitar conflictos
    if (type === "main" && this.mainSortable) {
      this.mainSortable.destroy();
      this.mainSortable = null;
    }
    if (type === "modal" && this.modalSortable) {
      this.modalSortable.destroy();
      this.modalSortable = null;
    }

    const config = {
      animation: 200,
      handle: ".drag-handle",
      ghostClass: "sortable-ghost",
      dragClass: "sortable-drag",
      forceFallback: true, // Importante para evitar bugs visuales en algunos navegadores
    };

    const sortable = new window.Sortable(element, config);

    if (type === "main") this.mainSortable = sortable;
    else this.modalSortable = sortable;
  }

  addField(container) {
    const fc = container.querySelector("#fieldsContainer");
    const count = fc.querySelectorAll(".field-item").length;
    fc.insertAdjacentHTML("beforeend", renderFieldItemConfig(null, count));
    this.updateNoFieldsMessage(container);
  }

  updateNoFieldsMessage(container) {
    const fc = container.querySelector("#fieldsContainer");
    const msg = container.querySelector("#noFieldsMessage");
    if (fc && msg) msg.classList.toggle("hidden", fc.children.length > 0);
  }

  // --- LÓGICA DEL MODAL DE COLUMNAS ---
  setupModalListeners() {
    const modal = document.getElementById("columnsModal");
    if (!modal) return;

    const close = () => modal.classList.add("hidden");

    // Listeners de cierre
    const closeBtnTop = modal.querySelector("#closeModalTop");
    const cancelBtn = modal.querySelector("#cancelModalBtn");
    const backdrop = modal.querySelector("#closeModalBackdrop");

    if (closeBtnTop) closeBtnTop.onclick = close;
    if (cancelBtn) cancelBtn.onclick = close;
    if (backdrop) backdrop.onclick = close;

    const addFn = () => {
      const c = modal.querySelector("#modalColumnsContainer");
      const count = c.querySelectorAll(".field-item").length;
      c.insertAdjacentHTML("beforeend", renderFieldItemConfig(null, count));
      const newItem = c.lastElementChild;

      // Limpiar opciones que no aplican a columnas de tabla
      const select = newItem.querySelector(".field-type");
      [...select.options].forEach((opt) => {
        if (opt.value === "table" || opt.value === "separator") opt.remove();
      });
      // Ajuste visual para items dentro del modal
      newItem.classList.remove("p-1");
      newItem.classList.add("p-0", "border-slate-200");

      const noColsMsg = modal.querySelector("#noColumnsMessage");
      if (noColsMsg) noColsMsg.classList.add("hidden");
    };

    const addColBtn = modal.querySelector("#addColBtn");
    const addColBtnEmpty = modal.querySelector("#addColBtnEmpty");
    if (addColBtn) addColBtn.onclick = addFn;
    if (addColBtnEmpty) addColBtnEmpty.onclick = addFn;

    const mc = modal.querySelector("#modalColumnsContainer");
    if (mc) {
      mc.onclick = (e) => {
        if (e.target.closest(".remove-field")) {
          e.target.closest(".field-item").remove();
          if (mc.children.length === 0) {
            const noColsMsg = modal.querySelector("#noColumnsMessage");
            if (noColsMsg) noColsMsg.classList.remove("hidden");
          }
        }
      };

      mc.onchange = (e) => {
        if (e.target.classList.contains("field-type")) {
          const item = e.target.closest(".field-item");
          const optsGroup = item.querySelector(".options-input-group");
          if (optsGroup) {
            optsGroup.classList.toggle("hidden", e.target.value !== "select");
          }
        }
      };
    }

    const saveBtn = modal.querySelector("#saveModalBtn");
    if (saveBtn) {
      saveBtn.onclick = () => {
        const columns = this.collectFields(mc);
        const parent = this.activeFieldItem;
        if (parent) {
          parent.querySelector(".field-columns-data").value =
            JSON.stringify(columns);
          const badge = parent.querySelector(".columns-count-badge");
          if (badge) badge.textContent = columns.length;
        }
        close();
      };
    }
  }

  openColumnsModal(fieldItem) {
    this.activeFieldItem = fieldItem;
    const modal = document.getElementById("columnsModal");
    const container = document.getElementById("modalColumnsContainer");
    const hiddenInput = fieldItem.querySelector(".field-columns-data");

    let cols = [];
    try {
      cols = JSON.parse(hiddenInput.value || "[]");
    } catch (e) {}

    container.innerHTML = "";
    cols.forEach((col, i) => {
      container.insertAdjacentHTML("beforeend", renderFieldItemConfig(col, i));
      const el = container.lastElementChild;
      el.classList.remove("p-1");
      el.classList.add("p-0");

      const select = el.querySelector(".field-type");
      [...select.options].forEach((opt) => {
        if (opt.value === "table" || opt.value === "separator") opt.remove();
      });

      if (col.type === "select") {
        const optsGroup = el.querySelector(".options-input-group");
        if (optsGroup) optsGroup.classList.remove("hidden");
      }
    });

    this.initSortable(container, "modal");

    const noColsMsg = modal.querySelector("#noColumnsMessage");
    if (noColsMsg) noColsMsg.classList.toggle("hidden", cols.length > 0);

    modal.classList.remove("hidden");
  }

  collectFields(container) {
    const fields = [];
    container.querySelectorAll(".field-item").forEach((item, index) => {
      const labelInput = item.querySelector(".field-label");
      const label = labelInput ? labelInput.value.trim() : "";
      if (!label) return;

      const typeSelect = item.querySelector(".field-type");
      const type = typeSelect ? typeSelect.value : "text";
      const fieldId = item.dataset.fieldId || generateFieldId(label, index);

      let options = [];
      if (type === "select") {
        const optsInput = item.querySelector(".field-options");
        const txt = optsInput ? optsInput.value : "";
        if (txt)
          options = txt
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s);
      }

      let columns = [];
      if (type === "table") {
        try {
          const colsInput = item.querySelector(".field-columns-data");
          columns = JSON.parse(colsInput ? colsInput.value : "[]");
        } catch (e) {}
      }

      const reqCheckbox = item.querySelector(".field-required");

      fields.push({
        id: fieldId,
        label,
        type,
        order: index + 1,
        required: reqCheckbox ? reqCheckbox.checked : false,
        ...(options.length && { options }),
        ...(columns.length && { columns }),
      });
    });
    return fields;
  }

  saveData() {
    try {
      const nameInput = document.getElementById("templateName");
      const name = nameInput ? nameInput.value.trim() : "";
      if (!name) throw new Error("Por favor, asigna un nombre a la plantilla.");

      const fields = this.collectFields(
        document.getElementById("fieldsContainer")
      );

      if (fields.length === 0)
        throw new Error("Agrega al menos un campo para guardar la plantilla.");

      const data = {
        name,
        category: document.getElementById("templateCategory").value,
        icon: document.getElementById("templateIcon").value,
        color: document.getElementById("templateColor").value,
        description: document.getElementById("templateDescription").value,
        fields,
      };
      this.handlers.onSave(data);
    } catch (e) {
      alert(e.message);
    }
  }
}
