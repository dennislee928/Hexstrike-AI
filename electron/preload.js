const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 給渲染進程
contextBridge.exposeInMainWorld('electronAPI', {
  // 後端狀態檢查
  getBackendStatus: () => ipcRenderer.invoke('get-backend-status'),
  
  // 重啟後端
  restartBackend: () => ipcRenderer.invoke('restart-backend'),
  
  // 後端事件監聽
  onBackendReady: (callback) => {
    ipcRenderer.on('backend-ready', callback);
  },
  
  onBackendError: (callback) => {
    ipcRenderer.on('backend-error', (event, error) => callback(error));
  },
  
  // 移除監聽器
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
  
  // 平台資訊
  platform: process.platform,
  
  // 環境資訊
  isElectron: true
});
