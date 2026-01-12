const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// 後端進程管理
let backendProcess = null;
let backendPort = 8888;
const BACKEND_CHECK_INTERVAL = 2000; // 2秒檢查一次

// 檢查後端是否運行
function checkBackendHealth() {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.get(`http://localhost:${backendPort}/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// 啟動 Python 後端
function startBackend() {
  return new Promise((resolve, reject) => {
    const isDev = process.env.NODE_ENV === 'development';
    let backendExecutable;
    
    if (isDev) {
      // 開發模式：使用 Python 直接運行
      backendExecutable = process.platform === 'win32' ? 'python' : 'python3';
      const backendPath = path.join(__dirname, '..', 'hexstrike_server.py');
      backendProcess = spawn(backendExecutable, [backendPath, '--port', backendPort.toString()], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });
    } else {
      // 生產模式：使用打包的可執行檔
      const executableName = process.platform === 'win32' ? 'hexstrike-server.exe' : 'hexstrike-server';
      backendExecutable = path.join(process.resourcesPath, 'backend', executableName);
      
      if (!fs.existsSync(backendExecutable)) {
        reject(new Error(`Backend executable not found: ${backendExecutable}`));
        return;
      }
      
      backendProcess = spawn(backendExecutable, ['--port', backendPort.toString()], {
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });
    }

    // 後端輸出處理
    backendProcess.stdout.on('data', (data) => {
      console.log(`[Backend] ${data.toString()}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`[Backend Error] ${data.toString()}`);
    });

    backendProcess.on('error', (error) => {
      console.error('Failed to start backend:', error);
      reject(error);
    });

    backendProcess.on('exit', (code) => {
      console.log(`Backend process exited with code ${code}`);
      backendProcess = null;
      
      // 如果不是正常退出，嘗試重啟
      if (code !== 0 && code !== null) {
        console.log('Backend crashed, attempting restart...');
        setTimeout(() => startBackend().catch(console.error), 3000);
      }
    });

    // 等待後端啟動
    let attempts = 0;
    const maxAttempts = 30; // 最多等待 60 秒
    
    const checkInterval = setInterval(async () => {
      attempts++;
      const isHealthy = await checkBackendHealth();
      
      if (isHealthy) {
        clearInterval(checkInterval);
        console.log('Backend started successfully');
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        reject(new Error('Backend failed to start within timeout'));
      }
    }, BACKEND_CHECK_INTERVAL);
  });
}

// 停止後端
function stopBackend() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(__dirname, 'icons', process.platform === 'win32' ? 'icon.ico' : 
                    process.platform === 'darwin' ? 'icon.icns' : 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false // 等待後端啟動後再顯示
  });

  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    // 開發模式：連接到 Next.js dev server
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // 生產模式：載入打包的前端
    // Electron Builder 會將 Front-End/out 內容打包到應用程式資源中
    // 在打包後的應用中，__dirname 指向應用程式資源目錄
    const appPath = app.getAppPath();
    const frontendPath = path.join(appPath, 'Front-End', 'out', 'index.html');
    
    if (fs.existsSync(frontendPath)) {
      mainWindow.loadFile(frontendPath);
    } else {
      // 備用路徑
      const altPath = path.join(__dirname, '..', 'Front-End', 'out', 'index.html');
      if (fs.existsSync(altPath)) {
        mainWindow.loadFile(altPath);
      } else {
        console.error('Frontend build not found. Expected at:', frontendPath);
        mainWindow.loadURL('data:text/html,<h1>Frontend build not found</h1><p>Please rebuild the frontend.</p>');
      }
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 後端啟動成功後顯示窗口
  startBackend()
    .then(() => {
      mainWindow.show();
      mainWindow.webContents.send('backend-ready');
    })
    .catch((error) => {
      console.error('Failed to start backend:', error);
      mainWindow.show();
      mainWindow.webContents.send('backend-error', error.message);
    });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackend();
});

// IPC 處理
ipcMain.handle('get-backend-status', async () => {
  const isHealthy = await checkBackendHealth();
  return { healthy: isHealthy, port: backendPort };
});

ipcMain.handle('restart-backend', async () => {
  stopBackend();
  await new Promise(resolve => setTimeout(resolve, 1000));
  try {
    await startBackend();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
