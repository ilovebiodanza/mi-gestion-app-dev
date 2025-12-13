// src/services/google-drive.js
import { googleConfig } from "../../config/google-config.js";

class GoogleDriveService {
  constructor() {
    this.tokenClient = null;
    this.accessToken = null;
    this.isGapiLoaded = false;
    this.isGisLoaded = false;
  }

  // Carga inicial de librerías
  loadLibs() {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (window.google && window.gapi) {
          clearInterval(check);
          this.initializeGapi(resolve);
        }
      }, 100);
    });
  }

  async initializeGapi(resolve) {
    try {
      await new Promise((r) => window.gapi.load("client", r));
      await window.gapi.client.init({
        apiKey: googleConfig.apiKey,
        discoveryDocs: googleConfig.discoveryDocs,
      });
      this.isGapiLoaded = true;

      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: googleConfig.clientId,
        scope: googleConfig.scope,
        callback: (tokenResponse) => {
          if (tokenResponse.error) {
            console.error("Error Auth:", tokenResponse);
            return;
          }
          this.accessToken = tokenResponse.access_token;
        },
      });
      this.isGisLoaded = true;

      console.log("☁️ Google Drive Service Listo");
      resolve();
    } catch (error) {
      console.error("❌ Error inicializando Google Drive:", error);
    }
  }

  // Método helper para saber si ya tenemos permiso
  hasToken() {
    return !!this.accessToken;
  }

  // Solicitar permiso al usuario (Login)
  async authenticate(forcePopup = false) {
    if (!this.isGapiLoaded) await this.loadLibs();

    return new Promise((resolve, reject) => {
      this.tokenClient.callback = (resp) => {
        if (resp.error) {
          reject(resp);
          return;
        }
        this.accessToken = resp.access_token;
        resolve(this.accessToken);
      };

      // Si forcePopup es true (click del usuario), forzamos 'consent' para asegurar que salga el popup
      // Si es false, probamos silencioso ''
      this.tokenClient.requestAccessToken({
        prompt: forcePopup ? "consent" : "",
      });
    });
  }

  // Subir Archivo (Ahora asume que ya tienes token)
  async uploadFile(file) {
    if (!this.accessToken) {
      throw new Error(
        "No hay sesión de Drive activa. Por favor haz clic en el botón de nuevo."
      );
    }

    const metadata = {
      name: file.name,
      mimeType: file.type,
    };

    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append("file", file);

    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink",
      {
        method: "POST",
        headers: new Headers({ Authorization: "Bearer " + this.accessToken }),
        body: form,
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        this.accessToken = null; // Token vencido
        throw new Error("La sesión de Google expiró. Intenta subir de nuevo.");
      }
      const errText = await response.text();
      throw new Error(
        "Error subiendo a Drive: " + response.status + " " + errText
      );
    }

    const data = await response.json();
    await this.setPermission(data.id);

    return data;
  }

  async setPermission(fileId) {
    await window.gapi.client.drive.permissions.create({
      fileId: fileId,
      resource: {
        role: "reader",
        type: "anyone",
      },
    });
  }
}

export const googleDriveService = new GoogleDriveService();
