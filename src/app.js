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

console.log("🚀 Mi Gestión - Sistema Iniciado (Tema Colorido)");

document.addEventListener("DOMContentLoaded", () => {
  initializeApplication();
});

async function initializeApplication() {
  const appElement = document.getElementById("app");
  if (!appElement) return;

  authService.subscribe(async (user) => {
    await handleAuthStateChange(user, appElement);
  });

  const user = authService.getCurrentUser();
  await handleAuthStateChange(user, appElement);
}

async function handleAuthStateChange(user, appElement) {
  if (user) {
    try {
      await templateService.initialize(user.uid);
    } catch (error) {
      console.error("Error init:", error);
    }
    showDashboard(user, appElement);
  } else {
    showAuthForms(appElement);
  }
}

// --- SEGURIDAD ---

function requireEncryption(onSuccess) {
  const user = authService.getCurrentUser();
  if (!user) return;

  if (encryptionService.isReady()) {
    onSuccess();
    return;
  }

  const prompt = new PasswordPrompt(async (password) => {
    try {
      await authService.initializeEncryption(password);
      if (encryptionService.isReady()) {
        onSuccess();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error cifrado:", error);
      return false;
    }
  }, user.email);

  prompt.show();
}

// --- VISTAS REDISEÑADAS ---

function showAuthForms(appElement) {
  const authForms = new AuthForms(() => {
    console.log("Login OK");
  });

  // Diseño: Centrado, Glassmorphism, Colores Vibrantes
  appElement.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/50 -z-20"></div>

      <div class="w-full max-w-md glass rounded-3xl overflow-hidden transform transition-all duration-500 hover:scale-[1.01] animate-fade-in-up">
        
        <div class="relative h-32 bg-gradient-to-r from-primary via-secondary to-accent overflow-hidden">
          <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiZmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4yIi8+PC9zdmc+')] opacity-30"></div>
          <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
          
          <div class="relative z-10 flex flex-col items-center justify-center h-full pt-4">
            <div class="w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-2 transform rotate-3 hover:rotate-6 transition-transform">
               <i class="fas fa-shield-halved text-2xl text-transparent bg-clip-text bg-gradient-to-br from-primary to-accent"></i>
            </div>
            <h1 class="text-2xl font-bold text-white tracking-tight text-shadow-sm">Mi Gestión</h1>
          </div>
        </div>

        <div id="authContainer" class="p-8"></div>

        <div class="px-8 pb-6 text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 shadow-sm">
            <i class="fas fa-lock text-emerald-500 text-xs"></i> 
            <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Seguridad E2EE Activa</span>
          </div>
        </div>
      </div>
    </div>`;

  authForms.updateView(document.getElementById("authContainer"));
}

async function showDashboard(user, appElement) {
  // Navbar Flotante (Glass) y Layout limpio
  appElement.innerHTML = `
    <div class="min-h-screen flex flex-col">
      <nav class="sticky top-0 z-50 w-full glass-nav border-b border-white/40 bg-white/80 backdrop-blur-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 sm:h-20 items-center">
            
            <div class="flex items-center gap-3 cursor-pointer group" id="navHome">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                 <i class="fas fa-fingerprint text-lg"></i>
              </div>
              <div>
                <span class="block font-bold text-slate-800 text-lg leading-none tracking-tight">Mi Gestión</span>
                <span class="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary uppercase tracking-widest">Bóveda Privada</span>
              </div>
            </div>

            <div class="flex items-center gap-4">
                <div class="hidden md:flex flex-col items-end mr-2">
                    <p class="text-xs font-bold text-slate-700">${user.email}</p>
                    <div class="flex items-center gap-1.5">
                      <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <p class="text-[10px] text-slate-500 font-medium">Conectado</p>
                    </div>
                </div>
                
                <button id="logoutButton" class="group relative px-4 py-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 overflow-hidden shadow-sm hover:shadow-red-500/30">
                    <span class="relative z-10 flex items-center gap-2">
                      <i class="fas fa-power-off text-sm"></i>
                      <span class="hidden sm:inline text-sm font-semibold">Salir</span>
                    </span>
                </button>
            </div>
          </div>
        </div>
      </nav>

      <main class="flex-grow max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div id="dynamicContent" class="animate-fade-in-up"></div>
      </main>
    </div>`;

  document
    .getElementById("logoutButton")
    ?.addEventListener("click", () => authService.logout());
  document
    .getElementById("navHome")
    ?.addEventListener("click", () => showVaultListView(user));
  showVaultListView(user);
}

function showVaultListView(user) {
  const mainContainer = document.getElementById("dynamicContent");
  if (!mainContainer) return;

  mainContainer.innerHTML = `
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-6 border-b border-slate-200/60 pb-6">
      <div>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 tracking-tight mb-2">
          Documentos
        </h2>
        <p class="text-slate-500 text-sm sm:text-base max-w-lg">
          Tus archivos están <span class="text-emerald-600 font-bold bg-emerald-50 px-1 rounded">encriptados</span> y listos.
        </p>
      </div>

      <div class="flex items-center gap-3 w-full sm:w-auto">
          <button id="btnSettings" class="p-3 bg-white text-slate-400 hover:text-secondary border border-slate-200 rounded-xl hover:shadow-md hover:border-secondary/30 transition-all duration-300 group" title="Configuración">
             <i class="fas fa-sliders group-hover:rotate-180 transition-transform duration-700 text-lg"></i>
          </button>
          
          <button id="btnNewDocVault" class="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-1 hover:shadow-indigo-500/40 flex items-center justify-center gap-2 group">
            <div class="bg-white/20 rounded-lg p-1 group-hover:rotate-90 transition-transform">
              <i class="fas fa-plus text-xs"></i>
            </div>
            <span>Crear Nuevo</span>
          </button>
      </div>
    </div>
    
    <div id="vaultListContainer" class="min-h-[300px]"></div>
  `;

  const vaultList = new VaultList(
    (docId) => requireEncryption(() => showDocumentDetails(docId, user)),
    () => requireEncryption(() => showTemplateManager(user))
  );

  document
    .getElementById("btnNewDocVault")
    ?.addEventListener("click", () =>
      requireEncryption(() => showTemplateManager(user))
    );
  document
    .getElementById("btnSettings")
    ?.addEventListener("click", () => showSettings(user));

  vaultList.loadDocuments();
}

function showDocumentDetails(docId, user) {
  const mainContainer = document.getElementById("dynamicContent");
  // Skeleton Loader Mejorado
  mainContainer.innerHTML = `
    <div id="documentViewerPlaceholder" class="max-w-5xl mx-auto glass rounded-2xl p-8">
        <div class="animate-pulse flex space-x-6">
            <div class="w-16 h-16 bg-slate-200 rounded-xl"></div>
            <div class="flex-1 space-y-4 py-1">
                <div class="h-6 bg-slate-200 rounded w-1/3"></div>
                <div class="space-y-2">
                    <div class="h-4 bg-slate-200 rounded"></div>
                    <div class="h-4 bg-slate-200 rounded w-5/6"></div>
                </div>
            </div>
        </div>
    </div>`;

  const viewer = new DocumentViewer(docId, (actionData) => {
    if (actionData) openEditorForUpdate(actionData, user);
    else showVaultListView(user);
  });

  // Reemplazo del placeholder
  const placeholder = document.getElementById("documentViewerPlaceholder");
  if (placeholder) placeholder.outerHTML = viewer.render();

  viewer.load();
}

function showTemplateManager(user) {
  const mainContainer = document.getElementById("dynamicContent");
  const templateManager = new TemplateManager((templateId) =>
    showDocumentEditor(templateId, user)
  );

  mainContainer.innerHTML = `
    <div class="max-w-6xl mx-auto animate-fade-in-up">
        <button id="backToDash" class="group mb-8 flex items-center text-slate-500 hover:text-primary transition-colors font-medium text-sm bg-white/50 w-fit px-4 py-2 rounded-full backdrop-blur-sm hover:bg-white">
            <i class="fas fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i> Volver a la Bóveda
        </button>
        <div id="tmContainer"></div>
    </div>`;

  document.getElementById("tmContainer").innerHTML = templateManager.render();
  document.getElementById("backToDash").onclick = () => showVaultListView(user);

  templateService.initialize(user.uid);
  templateManager.loadTemplates();
}

async function showDocumentEditor(templateId, user) {
  const mainContainer = document.getElementById("dynamicContent");
  mainContainer.innerHTML = `
    <div class="flex flex-col justify-center items-center h-64 gap-4">
        <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
        <p class="text-slate-400 font-medium">Cargando plantilla...</p>
    </div>`;

  try {
    const template = await templateService.getTemplateById(templateId);
    const editor = new DocumentEditor(
      { template },
      () => showVaultListView(user),
      () => showTemplateManager(user)
    );
    mainContainer.innerHTML = `<div id="editorContainer" class="max-w-5xl mx-auto animate-fade-in-up"></div>`;
    document.getElementById("editorContainer").innerHTML = editor.render();
    editor.setupEventListeners();
  } catch (error) {
    console.error(error);
    alert("Error cargando plantilla");
    showTemplateManager(user);
  }
}

function openEditorForUpdate(initialData, user) {
  const mainContainer = document.getElementById("dynamicContent");
  const editor = new DocumentEditor(
    initialData,
    () => showDocumentDetails(initialData.documentId, user),
    () => showDocumentDetails(initialData.documentId, user)
  );
  mainContainer.innerHTML = `<div id="editorContainer" class="max-w-5xl mx-auto animate-fade-in-up"></div>`;
  document.getElementById("editorContainer").innerHTML = editor.render();
  editor.setupEventListeners();
}

function showSettings(user) {
  const mainContainer = document.getElementById("dynamicContent");
  mainContainer.innerHTML = `
    <div class="max-w-4xl mx-auto animate-fade-in-up">
        <button id="backToDash" class="group mb-8 flex items-center text-slate-500 hover:text-primary transition-colors font-medium text-sm bg-white/50 w-fit px-4 py-2 rounded-full backdrop-blur-sm hover:bg-white">
            <i class="fas fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i> Volver
        </button>
        <div id="settingsContainer"></div>
    </div>`;

  const settingsManager = new SettingsManager();
  document.getElementById("settingsContainer").innerHTML =
    settingsManager.render();
  settingsManager.setupEventListeners();
  document.getElementById("backToDash").onclick = () => showVaultListView(user);
}

window.app = { requireEncryption };

export function initApp() {
  initializeApplication();
}
