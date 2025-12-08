// src/app.js - Archivo principal de la aplicación
import { authService } from "./services/auth.js";
import { AuthForms } from "./components/AuthForms.js";
import { PasswordPrompt } from "./components/PasswordPrompt.js";
import { encryptionService } from "./services/encryption/index.js";
import { TemplateManager } from "./components/TemplateManager.js";
import { templateService } from "./services/templates/index.js";
import { DocumentEditor } from "./components/DocumentEditor.js";
import { VaultList } from "./components/VaultList.js";
import { DocumentViewer } from "./components/DocumentViewer.js";

// Eliminamos importaciones de prueba que ya no se usan
// import { EncryptionTest } from "./components/EncryptionTest.js";

console.log("Mi Gestión - Aplicación inicializada");

// Esperar a que el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM cargado");
  initializeApplication();
});

/**
 * Función principal para inicializar la aplicación
 */
async function initializeApplication() {
  const appElement = document.getElementById("app");

  if (!appElement) {
    console.error("Elemento #app no encontrado");
    return;
  }

  // Suscribirse a cambios de autenticación
  authService.subscribe(async (user) => {
    await handleAuthStateChange(user, appElement);
  });

  // Mostrar estado inicial
  const user = authService.getCurrentUser();
  await handleAuthStateChange(user, appElement);
}

/**
 * Manejar cambios en el estado de autenticación
 */
async function handleAuthStateChange(user, appElement) {
  if (user) {
    // Usuario autenticado - mostrar dashboard
    showDashboard(user, appElement);

    // Inicializar servicios que dependen del usuario
    templateService.initialize(user.uid).catch((error) => {
      console.error("Error al inicializar servicio de plantillas:", error);
    });

    // Verificar si el cifrado está inicializado
    await checkAndInitializeEncryption(user);
  } else {
    // Usuario no autenticado - mostrar formularios de auth
    showAuthForms(appElement);
  }
}

/**
 * Verificar e inicializar cifrado si es necesario
 */
async function checkAndInitializeEncryption(user) {
  // Esperar un momento para que la UI se cargue
  setTimeout(async () => {
    // Verificar si el cifrado ya está inicializado
    const isEncryptionInitialized = encryptionService.isReady();

    if (!isEncryptionInitialized) {
      console.log("🔐 Cifrado no inicializado, mostrando prompt...");

      // Mostrar prompt para solicitar contraseña
      const passwordPrompt = new PasswordPrompt(async (password) => {
        try {
          // Inicializar cifrado con la contraseña
          await authService.initializeEncryption(password);
          return true;
        } catch (error) {
          console.error("Error al inicializar cifrado:", error);
          return false;
        }
      }, user.email);

      // Mostrar después de un pequeño delay para mejor UX
      setTimeout(() => {
        passwordPrompt.show();
      }, 500);
    } else {
      console.log("✅ Cifrado ya está inicializado");
    }
  }, 1000);
}

/**
 * Mostrar formularios de autenticación
 */
function showAuthForms(appElement) {
  const authForms = new AuthForms((userData) => {
    console.log("✅ Auth success callback:", userData);
  });

  appElement.innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div class="w-full max-w-lg">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
            <i class="fas fa-shield-alt text-3xl text-blue-600"></i>
          </div>
          <h1 class="text-3xl font-bold text-gray-800 mb-2">Mi Gestión</h1>
          <p class="text-gray-600">Protege tu información personal con cifrado de extremo a extremo</p>
        </div>
        
        <div id="authContainer"></div>
        
        <div class="mt-8 text-center text-sm text-gray-500">
          <p><i class="fas fa-lock mr-1"></i> Tus datos nunca salen de tu dispositivo cifrados</p>
        </div>
      </div>
    </div>
  `;

  const authContainer = document.getElementById("authContainer");
  if (authContainer) {
    authForms.updateView(authContainer);
  }
}

/**
 * Mostrar dashboard para usuario autenticado
 */
function showDashboard(user, appElement) {
  appElement.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <div class="flex items-center">
                <i class="fas fa-shield-alt text-xl text-blue-600 mr-3"></i>
                <h1 class="text-xl font-bold text-gray-800">Mi Gestión</h1>
              </div>
              <div class="hidden md:block ml-10">
                <div class="flex space-x-4">
                  <a href="#" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium" id="navHome">
                    <i class="fas fa-home mr-1"></i> Inicio
                  </a>
                  <a href="#mis-datos" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium" id="navMyData">
                    <i class="fas fa-database mr-1"></i> Mis Datos
                  </a>
                  <a href="#" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    <i class="fas fa-cogs mr-1"></i> Configuración
                  </a>
                </div>
              </div>
            </div>
            
            <div class="flex items-center">
              <div class="flex items-center space-x-3">
                <div class="text-right hidden md:block">
                  <p class="text-sm font-medium text-gray-700">${user.email}</p>
                </div>
                <div class="relative">
                  <button id="userMenuButton" class="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                      ${user.email.charAt(0).toUpperCase()}
                    </div>
                    <i class="fas fa-chevron-down text-gray-600"></i>
                  </button>
                  
                  <div id="userMenu" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <button id="logoutButton" class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                      <i class="fas fa-sign-out-alt mr-2"></i> Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div id="dynamicContent"></div>
      </main>
    </div>
  `;

  // Configurar event listeners del dashboard
  setupDashboardListeners();

  // Cargar la vista de VaultList por defecto al inicio
  showVaultListView(user);
}

/**
 * Mostrar la vista de lista de la bóveda
 */
function showVaultListView(user) {
  const mainContainer = document.querySelector("main");
  if (!mainContainer) return;

  mainContainer.innerHTML = `
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Mis Datos</h2>
        <p class="text-gray-600">Información protegida y cifrada</p>
      </div>
      <button id="btnNewDocVault" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center shadow-sm">
        <i class="fas fa-plus mr-2"></i> Nuevo
      </button>
    </div>
    <div id="vaultListContainer"></div>
  `;

  const vaultList = new VaultList(
    (docId) => {
      console.log("Abrir documento cifrado:", docId);
      showDocumentDetails(docId, user);
    },
    () => {
      showTemplateManager(user);
    }
  );

  document.getElementById("btnNewDocVault")?.addEventListener("click", () => {
    showTemplateManager(user);
  });

  vaultList.loadDocuments();
}

/**
 * Mostrar detalles del documento (Lectura y Edición)
 * CORREGIDO: Maneja el callback de edición
 */
async function showDocumentDetails(docId, user) {
  const appElement = document.getElementById("app");

  appElement.innerHTML = `
    <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div id="documentViewerPlaceholder"></div>
    </div>
  `;

  const container = document.getElementById("documentViewerPlaceholder");

  const viewer = new DocumentViewer(docId, (actionData) => {
    // 👇👇 CORRECCIÓN CRÍTICA AQUÍ 👇👇
    // Si recibimos datos (actionData), significa que el usuario hizo clic en "Editar"
    if (actionData) {
      console.log("✏️ Modo edición activado");
      openEditorForUpdate(actionData, user);
    } else {
      // Si es undefined/null, es solo "Volver"
      console.log("🔙 Volviendo al listado");
      showDashboard(user, appElement);
    }
  });

  container.innerHTML = viewer.render();
  await viewer.load();
}

/**
 * Mostrar editor de documentos (Creación)
 */
async function showDocumentEditor(templateId, user) {
  const appElement = document.getElementById("app");

  appElement.innerHTML = `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>`;

  try {
    const template = await templateService.getTemplateById(templateId);

    const editor = new DocumentEditor(
      { template: template },
      () => {
        showDashboard(user, appElement);
      },
      () => {
        showTemplateManager(user);
      }
    );

    appElement.innerHTML = `
      <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div id="editorContainer"></div>
      </div>
    `;

    document.getElementById("editorContainer").innerHTML = editor.render();
    editor.setupEventListeners();
  } catch (error) {
    console.error("Error cargando editor:", error);
    alert("Error al cargar la plantilla: " + error.message);
    showTemplateManager(user);
  }
}

/**
 * Función auxiliar para abrir el editor en modo Edición
 */
function openEditorForUpdate(initialData, user) {
  const appElement = document.getElementById("app");

  const editor = new DocumentEditor(
    initialData,
    () => {
      // Al guardar, volvemos a ver el documento actualizado
      showDocumentDetails(initialData.documentId, user);
    },
    () => {
      // Al cancelar, volvemos al visor del documento
      showDocumentDetails(initialData.documentId, user);
    }
  );

  appElement.innerHTML = `
    <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div id="editorContainer"></div>
    </div>
  `;

  document.getElementById("editorContainer").innerHTML = editor.render();
  editor.setupEventListeners();
}

/**
 * Mostrar gestor de plantillas
 */
function showTemplateManager(user) {
  const appElement = document.getElementById("app");
  if (!appElement) return;

  const templateManager = new TemplateManager((templateId) => {
    console.log("Plantilla seleccionada:", templateId);
    showDocumentEditor(templateId, user);
  });

  appElement.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <button id="backToDashboard" class="mr-4 text-gray-600 hover:text-blue-600">
                <i class="fas fa-arrow-left text-lg"></i>
              </button>
              <div class="flex items-center">
                <i class="fas fa-layer-group text-xl text-indigo-600 mr-3"></i>
                <h1 class="text-xl font-bold text-gray-800">Gestión de Plantillas</h1>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div id="templateManagerContainer"></div>
      </main>
    </div>
  `;

  const container = document.getElementById("templateManagerContainer");
  if (container) {
    container.innerHTML = templateManager.render();
    templateService.initialize(user.uid);
    templateManager.loadTemplates();
  }

  document.getElementById("backToDashboard")?.addEventListener("click", () => {
    const user = authService.getCurrentUser();
    if (user) {
      showDashboard(user, appElement);
    }
  });
}

/**
 * Configurar listeners del dashboard
 */
function setupDashboardListeners() {
  const userMenuButton = document.getElementById("userMenuButton");
  const userMenu = document.getElementById("userMenu");
  const logoutButton = document.getElementById("logoutButton");

  if (userMenuButton && userMenu) {
    userMenuButton.addEventListener("click", (e) => {
      e.stopPropagation();
      userMenu.classList.toggle("hidden");
    });
    document.addEventListener("click", () => userMenu.classList.add("hidden"));
    userMenu.addEventListener("click", (e) => e.stopPropagation());
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      try {
        await authService.logout();
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
      }
    });
  }

  // Navegación
  document.getElementById("navMyData")?.addEventListener("click", (e) => {
    e.preventDefault();
    const user = authService.getCurrentUser();
    showVaultListView(user);
  });

  document.getElementById("navHome")?.addEventListener("click", (e) => {
    e.preventDefault();
    const user = authService.getCurrentUser();
    showVaultListView(user); // Por defecto el home muestra la bóveda
  });
}

// Nueva función para el flujo de login exitoso
async function initializePostLogin(user, password) {
  await encryptionService.initialize(password, user.uid);
}

export function initApp() {
  initializeApplication();
}

window.app = {
  initializePostLogin,
};
