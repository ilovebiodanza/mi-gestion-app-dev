/**
 * Renderiza la estructura principal del formulario de plantilla.
 */
export function renderMainLayout(isEditing, initialData, fieldsHtml = "") {
  const categoryOptions = [
    { value: "custom", label: "Personalizado" },
    { value: "personal", label: "Personal" },
    { value: "access", label: "Accesos" },
    { value: "financial", label: "Financiero" },
    { value: "health", label: "Salud" },
    { value: "home", label: "Hogar" },
    { value: "car", label: "Vehículo" },
    { value: "job", label: "Trabajo" },
    { value: "education", label: "Formación" },
  ];

  const currentCategory = initialData?.settings?.category || "custom";
  const initialIcon = initialData?.icon || "📋";
  const initialColor = initialData?.color || "#4F46E5";

  return `
      <div class="max-w-4xl mx-auto animate-fade-in-up pb-24 flex flex-col gap-6">
          
          <div class="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-sm sticky top-4 z-40 transition-all">
            <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div class="flex items-center">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center mr-4 shadow-lg shadow-indigo-500/20 flex-shrink-0">
                        <i class="fas fa-${
                          isEditing ? "pen-nib" : "magic"
                        } text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-slate-800 leading-tight">
                            ${
                              isEditing
                                ? "Editar Plantilla"
                                : "Nueva Estructura"
                            }
                        </h3>
                        <p class="text-xs text-slate-500 font-medium">Diseña los campos de tu documento</p>
                    </div>
                </div>
                <div class="flex gap-3 w-full sm:w-auto">
                     <button type="button" id="cancelTemplate" class="flex-1 sm:flex-none px-5 py-2.5 bg-white border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition font-bold text-sm shadow-sm">
                        Cancelar
                     </button>
                     <button type="button" id="saveTemplateBtnHeader" class="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white rounded-xl shadow-lg shadow-indigo-500/30 transition transform active:scale-95 font-bold text-sm flex items-center justify-center gap-2">
                          <i class="fas fa-save"></i> <span>Guardar</span>
                     </button>
                </div>
            </div>
          </div>
          
          <form id="templateForm" class="space-y-6">
              
              <div class="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                  <div class="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                     <i class="fas fa-info-circle text-indigo-400"></i>
                     <h4 class="text-sm font-bold text-slate-500 uppercase tracking-wider">Información Básica</h4>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div class="md:col-span-8">
                          <label class="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Nombre</label>
                          <input type="text" id="templateName" value="${
                            initialData?.name || ""
                          }" 
                                 class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition text-slate-800 font-bold placeholder-slate-400 text-lg" 
                                 required placeholder="Ej: Tarjeta de Crédito">
                      </div>

                      <div class="md:col-span-4">
                          <label class="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Categoría</label>
                          <div class="relative">
                              <select id="templateCategory" class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition appearance-none cursor-pointer font-medium text-slate-700">
                                  ${categoryOptions
                                    .map(
                                      (o) =>
                                        `<option value="${o.value}" ${
                                          o.value === currentCategory
                                            ? "selected"
                                            : ""
                                        }>${o.label}</option>`
                                    )
                                    .join("")}
                              </select>
                              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400"><i class="fas fa-chevron-down text-xs"></i></div>
                          </div>
                      </div>

                      <div class="md:col-span-3">
                          <label class="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Icono</label>
                          <input type="text" id="templateIcon" value="${initialIcon}" 
                                 class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition" 
                                 placeholder="📋">
                      </div>
                      
                      <div class="md:col-span-9">
                          <label class="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Color de Identidad</label>
                          <div class="flex items-center gap-3 h-[52px] border border-slate-200 rounded-xl p-2 bg-slate-50">
                              <input type="color" id="templateColor" value="${initialColor}" class="h-full w-16 rounded-lg cursor-pointer border-none p-0 bg-transparent shadow-sm">
                              <span class="text-xs text-slate-400 font-medium">Selecciona un color para identificar rápidamente esta plantilla.</span>
                          </div>
                      </div>

                      <div class="md:col-span-12">
                          <label class="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Descripción (Opcional)</label>
                          <input type="text" id="templateDescription" value="${
                            initialData?.description || ""
                          }" 
                                 class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition text-slate-600" 
                                 placeholder="Describe brevemente el propósito de este documento...">
                      </div>
                  </div>
              </div>
              
              <div class="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 relative min-h-[400px]">
                  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                             <i class="fas fa-layer-group text-secondary"></i>
                             <h4 class="text-sm font-bold text-slate-500 uppercase tracking-wider">Campos del Documento</h4>
                        </div>
                        <p class="text-xs text-slate-400 ml-6">Arrastra desde <i class="fas fa-grip-vertical text-[10px] mx-1"></i> para ordenar.</p>
                    </div>
                    
                    </div>

                  <div id="fieldsContainer" class="space-y-4">
                      ${fieldsHtml}
                  </div>
                  
                  <div id="noFieldsMessage" class="hidden flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30 mt-4 transition-all hover:bg-slate-50 hover:border-indigo-200 group cursor-pointer" onclick="document.getElementById('addFieldBtn').click()">
                      <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                          <i class="fas fa-plus text-3xl text-slate-300 group-hover:text-indigo-400"></i>
                      </div>
                      <p class="text-slate-600 font-bold text-lg">Lienzo Vacío</p>
                      <p class="text-sm text-slate-400 group-hover:text-indigo-500 transition-colors">Haz clic para agregar tu primer campo</p>
                  </div>

                  <button type="button" id="addFieldBtn" class="mt-6 w-full py-3 border-2 border-dashed border-indigo-200 bg-indigo-50/30 text-indigo-600 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition flex items-center justify-center font-bold text-sm gap-2">
                      <i class="fas fa-plus-circle"></i> Agregar Campo Principal
                  </button>

              </div>
          </form>
      </div>
    `;
}
