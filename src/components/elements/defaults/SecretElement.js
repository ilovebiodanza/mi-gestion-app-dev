import { BaseElement } from "../BaseElement.js";

export class SecretElement extends BaseElement {
  static getType() {
    return "secret";
  }
  static getLabel() {
    return "Dato Sensible (Oculto)";
  }
  static getIcon() {
    return "fas fa-key";
  }
  static getDescription() {
    return "Se visualiza con desenfoque/asteriscos.";
  }

  // Por defecto ocupa 1 columna
  static getColumns() {
    return 1;
  }

  // --- 1. CONFIGURACIÓN (Template) ---
  renderSettings() {
    return `
      <div class="md:col-span-12">
        <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">
          Placeholder (Texto de ayuda)
        </label>
        <input type="text" id="setting-placeholder-${this.def.id}" value="${
      this.def.placeholder || ""
    }" 
               class="w-full px-3 py-2 bg-white/60 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition font-medium text-slate-700 text-sm">
      </div>`;
  }

  postRenderSettings(container, updateConfig) {
    container
      .querySelector(`#setting-placeholder-${this.def.id}`)
      ?.addEventListener("input", (e) =>
        updateConfig("placeholder", e.target.value)
      );
  }

  // --- 2. EDITOR (InputRenderers) ---
  renderEditor() {
    const requiredBadge = this.def.required
      ? '<span class="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded border border-red-100 font-bold">REQ</span>'
      : "";

    // Clases base + padding extra para iconos (pl-11, pr-12)
    const inputClasses =
      "block w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm placeholder-slate-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-mono tracking-wider";

    return `
      <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 ml-1 flex items-center justify-between">
         <span>${this.def.label}</span>${requiredBadge}
      </label>
      <div class="relative group/pass">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within/pass:text-secondary transition-colors">
              <i class="fas fa-key"></i>
          </div>
          
          <input type="password" id="${this.def.id}" value="${
      this.value || ""
    }" class="${inputClasses}" placeholder="${
      this.def.placeholder || "••••••••"
    }">
          
          <button type="button" id="toggle-${
            this.def.id
          }" class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-secondary cursor-pointer focus:outline-none transition-colors" tabindex="-1">
              <i class="fas fa-eye"></i>
          </button>
      </div>`;
  }

  postRenderEditor(container, onChange) {
    const input = container.querySelector(`#${this.def.id}`);
    const btn = container.querySelector(`#toggle-${this.def.id}`);

    // Listener de cambios
    input?.addEventListener("input", (e) =>
      onChange(this.def.id, e.target.value)
    );

    // Listener del Toggle (Ojo)
    btn?.addEventListener("click", () => {
      const icon = btn.querySelector("i");
      if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
        btn.classList.add("text-secondary");
      } else {
        input.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
        btn.classList.remove("text-secondary");
      }
    });
  }

  // --- 3. VISUALIZACIÓN (SecretViewer Homologado) ---
  renderViewer() {
    if (!this.value)
      return '<span class="text-slate-300 text-xs italic">--</span>';

    // Generamos ID único para controlar este elemento específico
    this.uniqueId = `secret-${this.def.id}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    return `
        <div class="flex items-center gap-2" id="${this.uniqueId}">
            <div class="relative group overflow-hidden rounded-lg border border-slate-200 bg-white px-3 py-2 transition-all hover:border-indigo-200 hover:shadow-sm w-full">
                <span class="secret-mask filter blur-[5px] select-none transition-all duration-300 group-hover:blur-none font-mono text-sm text-slate-800 tracking-wider">••••••••••••••</span>
                <span class="secret-revealed hidden font-mono text-sm text-slate-800 select-all font-bold tracking-wide">${this.value}</span>
            </div>
            <button type="button" class="toggle-btn w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors bg-white border border-slate-200" title="Revelar">
                <i class="fas fa-eye"></i>
            </button>
            <button type="button" class="copy-btn w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors bg-white border border-slate-200" title="Copiar">
                <i class="far fa-copy"></i>
            </button>
        </div>`;
  }

  // Método especial para activar los listeners en el Viewer
  postRenderViewer(container) {
    const wrapper = container.querySelector(`#${this.uniqueId}`);
    if (!wrapper) return;

    const toggleBtn = wrapper.querySelector(".toggle-btn");
    const copyBtn = wrapper.querySelector(".copy-btn");
    const mask = wrapper.querySelector(".secret-mask");
    const revealed = wrapper.querySelector(".secret-revealed");
    const icon = toggleBtn?.querySelector("i");

    // Lógica Toggle
    toggleBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = revealed.classList.contains("hidden");
      if (isHidden) {
        revealed.classList.remove("hidden");
        mask.classList.add("hidden");
        icon?.classList.replace("fa-eye", "fa-eye-slash");
      } else {
        revealed.classList.add("hidden");
        mask.classList.remove("hidden");
        icon?.classList.replace("fa-eye-slash", "fa-eye");
      }
    });

    // Lógica Copiar
    copyBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(this.value);
      const originalHtml = copyBtn.innerHTML;
      copyBtn.innerHTML = '<i class="fas fa-check text-emerald-600"></i>';
      setTimeout(() => (copyBtn.innerHTML = originalHtml), 1500);
    });
  }

  // --- 4. IMPRESIÓN ---
  renderPrint(mode) {
    return `
      <div class="mb-2 page-break avoid-break-inside">
         <dt class="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1 flex items-center gap-1">
            <i class="fas fa-lock text-[9px]"></i> ${this.def.label}
         </dt>
         <dd class="text-sm font-mono text-slate-900 border-b border-amber-100 pb-1 bg-amber-50/30 px-2 py-1 rounded">
           ${this.value || "—"}
         </dd>
      </div>`;
  }
}
