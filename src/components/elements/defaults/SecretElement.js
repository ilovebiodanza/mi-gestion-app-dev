import { BaseElement } from "../BaseElement.js";

export class SecretElement extends BaseElement {
  static getType() {
    return "secret";
  }
  static getLabel() {
    return "Dato Sensible";
  }
  static getIcon() {
    return "fas fa-key";
  }
  static getDescription() {
    return "Se visualiza con desenfoque/asteriscos.";
  }

  renderEditor() {
    return `
      <label class="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">${
        this.def.label
      }</label>
      <div class="relative group">
        <input type="password" id="${this.def.id}" value="${this.value || ""}" 
           class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm font-mono tracking-wide focus:bg-white focus:border-amber-500 outline-none transition-all">
        <button type="button" class="toggle-secret absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-amber-600" data-target="${
          this.def.id
        }">
           <i class="fas fa-eye"></i>
        </button>
      </div>
    `;
  }

  postRenderEditor(container, onChange) {
    const input = container.querySelector(`#${this.def.id}`);
    const btn = container.querySelector(
      `.toggle-secret[data-target="${this.def.id}"]`
    );

    input?.addEventListener("input", (e) =>
      onChange(this.def.id, e.target.value)
    );

    btn?.addEventListener("click", () => {
      const type = input.type === "password" ? "text" : "password";
      input.type = type;
      btn.querySelector("i").classList.toggle("fa-eye");
      btn.querySelector("i").classList.toggle("fa-eye-slash");
    });
  }

  renderViewer() {
    if (!this.value) return "—";
    // ID único para el toggle del viewer
    const toggleId = `view-secret-${this.def.id}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    return `
      <div class="flex items-center justify-between bg-amber-50/50 border border-amber-100 rounded px-3 py-1.5 group">
          <span id="${toggleId}" class="font-mono text-slate-800 tracking-widest blur-sm transition-all select-none">••••••••</span>
          <button class="text-amber-500 hover:text-amber-700 focus:outline-none ml-2" 
                  onclick="const el = document.getElementById('${toggleId}'); el.classList.toggle('blur-sm'); el.textContent = el.classList.contains('blur-sm') ? '••••••••' : '${this.value.replace(
      /'/g,
      "\\'"
    )}';">
             <i class="fas fa-eye text-xs"></i>
          </button>
      </div>`;
  }

  renderPrint(mode) {
    // Al imprimir, mostramos el dato real pero con advertencia visual
    return `
      <div class="mb-2 page-break">
         <dt class="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1"><i class="fas fa-lock mr-1"></i> ${
           this.def.label
         }</dt>
         <dd class="text-sm font-mono text-slate-900 border-b border-amber-100 pb-1 bg-amber-50/30 px-1 rounded">${
           this.value || "—"
         }</dd>
      </div>`;
  }

  getWhatsAppText() {
    // Para WhatsApp no ocultamos, se supone que si compartes es porque quieres
    return `*${this.def.label}* (Secreto): || ${this.value} ||`; // Formato spoiler de WhatsApp si lo soporta, o simple texto
  }
}
