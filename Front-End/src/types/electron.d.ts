// Electron API 類型定義
export interface ElectronAPI {
  getBackendStatus: () => Promise<{ healthy: boolean; port: number }>;
  restartBackend: () => Promise<{ success: boolean; error?: string }>;
  onBackendReady: (callback: () => void) => void;
  onBackendError: (callback: (error: string) => void) => void;
  removeAllListeners: (channel: string) => void;
  platform: string;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
