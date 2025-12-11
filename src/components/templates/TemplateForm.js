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
    // 1. Renderiza el esqueleto principal (delegado al renderer)
    const html = renderMainLayout(!!template, template);

    // 2. Necesitamos inyectar los campos iniciales después de que el HTML esté en el DOM?
    // En este enfoque, renderMainLayout ya devuelve el string completo, pero los campos
    // dinámicos se insertan "on-the-fly" en el setupListeners o debemos hacerlo aquí.

    // MEJORA: Vamos a inyectar los campos en el HTML string antes de devolverlo.
    // Esto evita parpadeos.
    const fieldsHtml = (template?.fields || [])
      .map((f, i) => renderFieldItemConfig(f, i))
      .join("");

    // Usamos un placeholder simple en el Renderer o reemplazamos el innerHTML luego.
    // Como el renderer devuelve string, una forma fácil es reemplazar el comentario o div vacío.
    // Pero para ser más limpios, lo haremos en setupListeners (render inicial)
    // O mejor aún: modifiquemos renderMainLayout para no tener que inyectar manual.
    // --
    // Para no complicar el Renderer, haremos la inserción en el setupListeners,
    // pero para que se vea data inicial, podemos hacer un replace simple aquí:

    return html.replace("", fieldsHtml);
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
    this.updateNoFieldsMessage(container); // Validar estado inicial

    const fieldsContainer = container.querySelector("#fieldsContainer");
    if (fieldsContainer) {
      // Delegación de eventos para los campos
      fieldsContainer.addEventListener("click", (e) => {
        if (e.target.closest(".remove-field")) {
          e.target.closest(".field-item").remove();
          this.updateNoFieldsMessage(container);
        }
        if (e.target.closest(".configure-table-btn")) {
          this.openColumnsModal(e.target.closest(".field-item"));
        }
      });

      // Cambio de tipo de campo (re-renderiza el item)
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

    container
      .querySelector("#templateForm")
      ?.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveData();
      });
    container
      .querySelector("#cancelTemplate")
      ?.addEventListener("click", () => this.handlers.onCancel());

    this.setupModalListeners();
  }

  initSortable(element, type) {
    if (!element || !window.Sortable) return;
    if (type === "main" && this.mainSortable) this.mainSortable.destroy();
    if (type === "modal" && this.modalSortable) this.modalSortable.destroy();

    const config = {
      animation: 200,
      handle: ".drag-handle",
      ghostClass: "sortable-ghost",
      dragClass: "sortable-drag",
      forceFallback: true,
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

    // Botones de cierre
    modal.querySelector("#closeModalTop").onclick = close;
    modal.querySelector("#cancelModalBtn").onclick = close;
    modal.querySelector("#closeModalBackdrop").onclick = close;

    // Función agregar columna
    const addFn = () => {
      const c = modal.querySelector("#modalColumnsContainer");
      const count = c.querySelectorAll(".field-item").length;

      // Reutilizamos renderFieldItemConfig pero le quitamos opciones invalidas luego
      c.insertAdjacentHTML("beforeend", renderFieldItemConfig(null, count));
      const newItem = c.lastElementChild;

      // Limpieza específica para columnas de tabla
      const select = newItem.querySelector(".field-type");
      [...select.options].forEach((opt) => {
        if (opt.value === "table" || opt.value === "separator") opt.remove();
      });
      newItem.classList.remove("p-1");
      newItem.classList.add("p-0", "border-slate-200");
      modal.querySelector("#noColumnsMessage").classList.add("hidden");
    };

    modal.querySelector("#addColBtn").onclick = addFn;
    const emptyBtn = modal.querySelector("#addColBtnEmpty");
    if (emptyBtn) emptyBtn.onclick = addFn;

    // Eventos dentro del modal (Delegación)
    const mc = modal.querySelector("#modalColumnsContainer");
    mc.onclick = (e) => {
      if (e.target.closest(".remove-field")) {
        e.target.closest(".field-item").remove();
        if (mc.children.length === 0)
          modal.querySelector("#noColumnsMessage").classList.remove("hidden");
      }
    };

    mc.onchange = (e) => {
      if (e.target.classList.contains("field-type")) {
        const item = e.target.closest(".field-item");
        // Mostrar input de opciones solo si es select
        item
          .querySelector(".options-input-group")
          .classList.toggle("hidden", e.target.value !== "select");
      }
    };

    // Guardar configuración de columnas
    modal.querySelector("#saveModalBtn").onclick = () => {
      const columns = this.collectFields(mc);
      // Guardar JSON en el input oculto del campo padre
      const parent = this.activeFieldItem;
      parent.querySelector(".field-columns-data").value =
        JSON.stringify(columns);
      parent.querySelector(".columns-count-badge").textContent = columns.length;
      close();
    };
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

      if (col.type === "select")
        el.querySelector(".options-input-group").classList.remove("hidden");
    });

    this.initSortable(container, "modal");
    modal
      .querySelector("#noColumnsMessage")
      .classList.toggle("hidden", cols.length > 0);
    modal.classList.remove("hidden");
  }

  // Recolector de datos del formulario
  collectFields(container) {
    const fields = [];
    container.querySelectorAll(".field-item").forEach((item, index) => {
      const label = item.querySelector(".field-label").value.trim();
      if (!label) return;

      const type = item.querySelector(".field-type").value;
      const fieldId = item.dataset.fieldId || generateFieldId(label, index);

      let options = [];
      if (type === "select") {
        const txt = item.querySelector(".field-options").value;
        if (txt)
          options = txt
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s);
      }

      let columns = [];
      if (type === "table") {
        try {
          columns = JSON.parse(item.querySelector(".field-columns-data").value);
        } catch (e) {}
      }

      fields.push({
        id: fieldId,
        label,
        type,
        order: index + 1,
        required: item.querySelector(".field-required").checked,
        ...(options.length && { options }),
        ...(columns.length && { columns }),
      });
    });
    return fields;
  }

  saveData() {
    try {
      const name = document.getElementById("templateName").value.trim();
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
