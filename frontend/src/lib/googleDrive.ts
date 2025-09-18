// Configuração do Google Drive API
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink?: string;
  thumbnailLink?: string;
}

export interface GoogleDriveFolder {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

class GoogleDriveService {
  private gapi: any = null;
  private tokenClient: any = null;
  private isInitialized = false;
  private isSignedIn = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Verificar se as variáveis de ambiente estão configuradas
    if (!CLIENT_ID || !API_KEY) {
      console.warn('Google Drive API não configurada. Configure VITE_GOOGLE_CLIENT_ID e VITE_GOOGLE_API_KEY');
      return;
    }

    return new Promise((resolve, reject) => {
      // Verificar se o script já foi carregado
      if (window.gapi) {
        this.loadGapiClient();
        resolve();
        return;
      }

      // Carregar a API do Google
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        this.loadGapiClient();
        resolve();
      };
      script.onerror = () => reject(new Error('Falha ao carregar Google API'));
      document.head.appendChild(script);
    });
  }

  private async loadGapiClient(): Promise<void> {
    try {
      // Carregar apenas o cliente, sem auth2
      await new Promise<void>((resolve, reject) => {
        window.gapi.load('client', {
          callback: resolve,
          onerror: reject
        });
      });

      // Aguardar um pouco para garantir que o client foi carregado
      await new Promise(resolve => setTimeout(resolve, 100));

      // Inicializar o cliente
      await window.gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC]
      });

      this.gapi = window.gapi;
      this.isInitialized = true;
      
      // Aguardar o script da Google Identity Services carregar
      if (!window.google?.accounts?.oauth2) {
        await this.waitForGoogleIdentityServices();
      }
      
      // Inicializar o Token Client para autenticação
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.access_token) {
            this.gapi.client.setApiKey(API_KEY);
            this.gapi.client.setToken(response);
            this.isSignedIn = true;
          }
        }
      });
    } catch (error) {
      console.error('Erro ao inicializar Google Drive API:', error);
      throw error;
    }
  }

  private async waitForGoogleIdentityServices(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      // Timeout após 10 segundos
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 10000);
    });
  }

  async signIn(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isInitialized || !this.gapi || !this.tokenClient) {
      console.error('Google Drive API não foi inicializada corretamente');
      return false;
    }

    try {
      // Criar uma Promise que resolve quando o callback for chamado
      return new Promise<boolean>((resolve) => {
        // Atualizar o callback do token client
        this.tokenClient.callback = (response: any) => {
          if (response.access_token) {
            this.gapi.client.setApiKey(API_KEY);
            this.gapi.client.setToken(response);
            this.isSignedIn = true;
            resolve(true);
          } else {
            resolve(false);
          }
        };
        
        // Solicitar token de acesso
        this.tokenClient.requestAccessToken();
      });
    } catch (error) {
      console.error('Erro ao fazer login no Google Drive:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Revogar o token de acesso
      if (this.gapi.client.getToken()) {
        window.google.accounts.oauth2.revoke(this.gapi.client.getToken().access_token);
        this.gapi.client.setToken(null);
      }
      this.isSignedIn = false;
    } catch (error) {
      console.error('Erro ao fazer logout do Google Drive:', error);
    }
  }

  isAuthenticated(): boolean {
    return this.isSignedIn;
  }

  async getFiles(folderId: string = 'root', pageToken?: string): Promise<{
    files: GoogleDriveFile[];
    folders: GoogleDriveFolder[];
    nextPageToken?: string;
  }> {
    if (!this.isInitialized || !this.isSignedIn) {
      throw new Error('Google Drive não está autenticado');
    }

    try {
      const response = await this.gapi.client.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink, thumbnailLink)',
        pageSize: 50,
        pageToken: pageToken,
        orderBy: 'folder,name'
      });

      const files: GoogleDriveFile[] = [];
      const folders: GoogleDriveFolder[] = [];

      response.result.files.forEach((file: any) => {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          folders.push({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            modifiedTime: file.modifiedTime
          });
        } else {
          files.push({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            size: file.size,
            modifiedTime: file.modifiedTime,
            webViewLink: file.webViewLink,
            thumbnailLink: file.thumbnailLink
          });
        }
      });

      return {
        files,
        folders,
        nextPageToken: response.result.nextPageToken
      };
    } catch (error) {
      console.error('Erro ao buscar arquivos do Google Drive:', error);
      throw error;
    }
  }

  async downloadFile(fileId: string): Promise<Blob> {
    if (!this.isInitialized || !this.isSignedIn) {
      throw new Error('Google Drive não está autenticado');
    }

    try {
      const response = await this.gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
      });

      return new Blob([response.body], { type: 'application/octet-stream' });
    } catch (error) {
      console.error('Erro ao baixar arquivo do Google Drive:', error);
      throw error;
    }
  }

  async getFileMetadata(fileId: string): Promise<GoogleDriveFile> {
    if (!this.isInitialized || !this.isSignedIn) {
      throw new Error('Google Drive não está autenticado');
    }

    try {
      const response = await this.gapi.client.drive.files.get({
        fileId: fileId,
        fields: 'id, name, mimeType, size, modifiedTime, webViewLink, thumbnailLink'
      });

      return response.result;
    } catch (error) {
      console.error('Erro ao buscar metadados do arquivo:', error);
      throw error;
    }
  }
}

// Instância singleton
export const googleDriveService = new GoogleDriveService();

// Declaração global para TypeScript
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}