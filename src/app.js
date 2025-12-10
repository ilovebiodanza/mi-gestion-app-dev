// src/app.js
import { authService } from "./services/auth.js";
import { AuthForms } from "./components/AuthForms.js";
import { PasswordPrompt } from "./components/PasswordPrompt.js";
import { encryptionService } from "./services/encryption/index.js";
import { TemplateManager } from "./components/TemplateManager.js";
import { templateService } from "./services/templates/index.js";
import { DocumentEditor } from "./components/DocumentEditor.js";
import { VaultList } from "./components/VaultList.js";
import { DocumentViewer } from "./components/DocumentViewer.js";
import { SettingsManager } from "./components/SettingsManager.js";

console.log("🚀 Mi Gestión - Sistema Iniciado");

// --- INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
  initializeApplication();
});

async function initializeApplication() {
  const appElement = document.getElementById("app");
  if (!appElement) return;

  // Suscribirse a cambios de estado de autenticación (Firebase)
  authService.subscribe(async (user) => {
    await handleAuthStateChange(user, appElement);
  });

  // Verificar estado inicial
  const user = authService.getCurrentUser();
  await handleAuthStateChange(user, appElement);
}

/**
 * Maneja el cambio entre Login y Dashboard
 */
async function handleAuthStateChange(user, appElement) {
  if (user) {
    try {
      // Inicializamos servicios base (no cifrados)
      await templateService.initialize(user.uid);
    } catch (error) {
      console.error("Error inicializando servicios:", error);
    }
    // Mostramos el Dashboard inmediatamente (Acceso Rápido)
    // NO pedimos contraseña todavía.
    showDashboard(user, appElement);
  } else {
    showAuthForms(appElement);
  }
}

// --- LÓGICA CORE DE SEGURIDAD (Cifrado bajo demanda) ---

/**
 * Verifica si la bóveda está abierta. Si no, pide la contraseña.
 * Si tiene éxito, ejecuta el callback (la acción que el usuario quería hacer).
 */
function requireEncryption(onSuccess) {
  const user = authService.getCurrentUser();
  if (!user) return;

  // 1. Si ya está desbloqueado (memoria), proceder rápido
  if (encryptionService.isReady()) {
    onSuccess();
    return;
  }

  // 2. Si está bloqueado, mostrar el reto de seguridad
  console.log("🔐 Bóveda cerrada. Solicitando llave maestra...");

  const prompt = new PasswordPrompt(async (password) => {
    try {
      await authService.initializeEncryption(password);

      // Doble verificación de éxito
      if (encryptionService.isReady()) {
        onSuccess();
        return true; // Cierra el modal
      }
      return false; // Mantiene el modal con error
    } catch (error) {
      console.error("Error de cifrado:", error);
      return false;
    }
  }, user.email);

  prompt.show();
}

// --- VISTAS PRINCIPALES ---

function showAuthForms(appElement) {
  const authForms = new AuthForms((userData) => {
    console.log("✅ Autenticación exitosa:", userData.email);
    // El observer de authService manejará la transición
  });

  appElement.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-200">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transform transition-all animate-fade-in-up">
        <div class="bg-gradient-to-r from-primary to-secondary p-8 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4 shadow-inner border border-white/30">
            <i class="fas fa-shield-alt text-3xl text-white"></i>
          </div>
          <h1 class="text-3xl font-bold text-white tracking-tight">Mi Gestión</h1>
          <p class="text-blue-100 text-sm mt-2 font-medium">Bóveda Digital Segura</p>
        </div>
        
        <div id="authContainer" class="p-8"></div>
        
        <div class="px-8 pb-6 text-center">
          <p class="text-[10px] text-slate-400 flex items-center justify-center gap-2">
            <i class="fas fa-lock text-emerald-500"></i>
            Encriptado de Extremo a Extremo (E2EE)
          </p>
        </div>
      </div>
    </div>
  `;

  authForms.updateView(document.getElementById("authContainer"));
}

/**
 * Dashboard Principal (Layout)
 */
async function showDashboard(user, appElement) {
  appElement.innerHTML = `
    <div class="min-h-screen bg-slate-50 flex flex-col">
      <nav class="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            
            <div class="flex items-center gap-2 cursor-pointer" id="navHome">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-md">
                 <i class="fas fa-shield-alt text-sm"></i>
              </div>
              <span class="font-bold text-slate-800 text-lg tracking-tight">Mi Gestión</span>
            </div>
            
            <div class="flex items-center gap-3">
                <div class="hidden sm:block text-right mr-2">
                    <p class="text-xs font-bold text-slate-700">${user.email}</p>
                    <p class="text-[10px] text-emerald-600 font-medium"><i class="fas fa-circle text-[6px] mr-1 align-middle"></i>Conectado</p>
                </div>
                <button id="logoutButton" class="group flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors border border-red-100">
                    <i class="fas fa-sign-out-alt text-sm"></i>
                    <span class="hidden sm:inline text-sm font-medium">Salir</span>
                </button>
            </div>
          </div>
        </div>
      </nav>

      <main class="flex-grow max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8 relative">
        <div id="dynamicContent" class="animate-fade-in"></div>
      </main>
    </div>
  `;

  // Listeners del Dashboard
  document
    .getElementById("logoutButton")
    ?.addEventListener("click", () => authService.logout());
  document
    .getElementById("navHome")
    ?.addEventListener("click", () => showVaultListView(user));

  // Cargar vista por defecto
  showVaultListView(user);
}

/**
 * Vista: Lista de Bóveda (Acceso Público de la Sesión)
 */
function showVaultListView(user) {
  const mainContainer = document.getElementById("dynamicContent");
  if (!mainContainer) return;

  mainContainer.innerHTML = `
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Mi Bóveda</h2>
        <p class="text-slate-500 mt-1">Gestiona tus documentos cifrados.</p>
      </div>
      <div class="flex items-center gap-3 w-full sm:w-auto">
          <button id="btnSettings" class="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-primary hover:border-primary/30 rounded-xl shadow-sm hover:shadow transition-all group" title="Configuración">
             <i class="fas fa-cog group-hover:rotate-90 transition-transform duration-500"></i>
          </button>
          <button id="btnNewDocVault" class="flex-1 sm:flex-none px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2">
            <i class="fas fa-plus"></i>
            <span>Nuevo Documento</span>
          </button>
      </div>
    </div>
    <div id="vaultListContainer" class="min-h-[300px]"></div>
  `;

  // Inicializar Lista
  const vaultList = new VaultList(
    // 1. Al seleccionar un documento: REQUERIMOS CIFRADO
    (docId) => {
      requireEncryption(() => {
        showDocumentDetails(docId, user);
      });
    },
    // 2. Al crear nuevo (callback interno del empty state): REQUERIMOS CIFRADO
    () => {
      requireEncryption(() => {
        showTemplateManager(user);
      });
    }
  );

  // Listeners de botones superiores
  document.getElementById("btnNewDocVault")?.addEventListener("click", () => {
    requireEncryption(() => showTemplateManager(user));
  });

  document.getElementById("btnSettings")?.addEventListener("click", () => {
    showSettings(user);
  });

  vaultList.loadDocuments();
}

/**
 * Vista: Detalles del Documento (Protegido)
 */
function showDocumentDetails(docId, user) {
  const mainContainer = document.getElementById("dynamicContent");

  // Skeleton loader mientras carga el visor
  mainContainer.innerHTML = `<div id="documentViewerPlaceholder" class="max-w-5xl mx-auto"><div class="animate-pulse flex space-x-4"><div class="flex-1 space-y-4 py-1"><div class="h-4 bg-slate-200 rounded w-3/4"></div><div class="space-y-2"><div class="h-4 bg-slate-200 rounded"></div><div class="h-4 bg-slate-200 rounded w-5/6"></div></div></div></div></div>`;

  const viewer = new DocumentViewer(docId, (actionData) => {
    if (actionData) {
      // Si el viewer devuelve datos, es que quiere EDITAR
      // (Ya estamos dentro de un contexto cifrado, pero verificamos por seguridad en openEditor)
      openEditorForUpdate(actionData, user);
    } else {
      // Si no, es "Volver"
      showVaultListView(user);
    }
  });

  // Render final
  document.getElementById("documentViewerPlaceholder").outerHTML =
    viewer.render();
  viewer.load();
}

/**
 * Vista: Gestor de Plantillas (Protegido)
 */
function showTemplateManager(user) {
  const mainContainer = document.getElementById("dynamicContent");

  const templateManager = new TemplateManager((templateId) => {
    // Al seleccionar una plantilla -> Abrir Editor Nuevo
    showDocumentEditor(templateId, user);
  });

  mainContainer.innerHTML = `
    <div class="max-w-6xl mx-auto">
        <button id="backToDash" class="mb-6 flex items-center text-slate-500 hover:text-primary transition font-medium">
            <i class="fas fa-arrow-left mr-2"></i> Volver a la Bóveda
        </button>
        <div id="tmContainer"></div>
    </div>`;

  const container = document.getElementById("tmContainer");
  container.innerHTML = templateManager.render();

  document.getElementById("backToDash").onclick = () => showVaultListView(user);

  templateService.initialize(user.uid);
  templateManager.loadTemplates();
}

/**
 * Vista: Editor de Documento (Nuevo) (Protegido)
 */
async function showDocumentEditor(templateId, user) {
  const mainContainer = document.getElementById("dynamicContent");

  mainContainer.innerHTML = `
    <div class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
    </div>`;

  try {
    const template = await templateService.getTemplateById(templateId);

    // Configurar editor para NUEVO documento
    const editor = new DocumentEditor(
      { template: template },
      () => {
        showVaultListView(user);
      }, // OnSave -> Volver a lista
      () => {
        showTemplateManager(user);
      } // OnCancel -> Volver a plantillas
    );

    mainContainer.innerHTML = `<div id="editorContainer" class="max-w-5xl mx-auto"></div>`;
    document.getElementById("editorContainer").innerHTML = editor.render();
    editor.setupEventListeners();
  } catch (error) {
    console.error(error);
    alert("Error cargando plantilla");
    showTemplateManager(user);
  }
}

/**
 * Vista: Editor de Documento (Edición) (Protegido)
 */
function openEditorForUpdate(initialData, user) {
  const mainContainer = document.getElementById("dynamicContent");

  const editor = new DocumentEditor(
    initialData,
    () => {
      showDocumentDetails(initialData.documentId, user);
    }, // OnSave -> Volver a detalles
    () => {
      showDocumentDetails(initialData.documentId, user);
    } // OnCancel -> Volver a detalles
  );

  mainContainer.innerHTML = `<div id="editorContainer" class="max-w-5xl mx-auto"></div>`;
  document.getElementById("editorContainer").innerHTML = editor.render();
  editor.setupEventListeners();
}

/**
 * Vista: Configuración (Acceso Parcial)
 */
function showSettings(user) {
  const mainContainer = document.getElementById("dynamicContent");

  mainContainer.innerHTML = `
    <div class="max-w-4xl mx-auto">
        <button id="backToDash" class="mb-6 flex items-center text-slate-500 hover:text-primary transition font-medium">
            <i class="fas fa-arrow-left mr-2"></i> Volver
        </button>
        <div id="settingsContainer"></div>
    </div>`;

  const settingsManager = new SettingsManager();
  document.getElementById("settingsContainer").innerHTML =
    settingsManager.render();
  settingsManager.setupEventListeners();

  document.getElementById("backToDash").onclick = () => showVaultListView(user);
}

// --- EXPOSICIÓN GLOBAL ---
// Permite que componentes internos invoquen cifrado o inicialización
window.app = {
  requireEncryption,
  initializePostLogin: async (user, password) => {
    // Si entramos por Login manual, aprovechamos para inicializar cifrado de una vez
    // así el usuario no tiene que poner la clave 2 veces seguidas.
    await authService.initializeEncryption(password);
  },
};

// Export para testing si fuera necesario
export function initApp() {
  initializeApplication();
}
