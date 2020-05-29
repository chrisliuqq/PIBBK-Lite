import { app, Menu, BrowserWindow, dialog, ipcMain } from 'electron'
import * as windowStateKeeper from 'electron-window-state'
import { isLinux, isMacintosh, isWindows } from '../common/platform';
import * as url from 'url';
import * as path from 'path';

let i18n = new(require('../ui/i18n'));
let mainWindow: Electron.BrowserWindow | null = null

let initOpenFileQueue = [];
let isDuplicateInstance = false;
const gotSingleInstanceLock = app.requestSingleInstanceLock()
isDuplicateInstance = !gotSingleInstanceLock
if (isDuplicateInstance) {
    app.quit()
}

app.on('second-instance', (event, args, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
        if (mainWindow.isMinimized()) {
            mainWindow.restore()
        }

        if (!mainWindow.isVisible()) {
            mainWindow.show()
        }

        mainWindow.focus()
    }
})

app.on('ready', () => {
    if (isDuplicateInstance) {
        return
    }
    createWindow()
});

app.on('window-all-closed', () => {
    mainWindow = null;
    if (!isMacintosh) {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('will-finish-launching', () => {
    app.on('open-file', (event, path) => {
        if (app.isReady() === false) {
            initOpenFileQueue.push(path);
        }
    });
});

ipcMain.on('render-inited', (event, arg) => {

    if (process.platform == 'win32' && process.argv.length >= 2) {
        initOpenFileQueue.push(process.argv[1]);
    }

    if (initOpenFileQueue.length) {
        mainWindow!.webContents.send('file-open', initOpenFileQueue.pop());
    }
});

function createWindow() {
    const minWidth = 960;
    const minHeight = 660;

    const savedWindowState = windowStateKeeper({
        defaultWidth: minWidth,
        defaultHeight: minHeight,
    })

    const windowOptions: Electron.BrowserWindowConstructorOptions = {
        x: savedWindowState.x,
        y: savedWindowState.y,
        width: savedWindowState.width,
        height: savedWindowState.height,
        minWidth: minWidth,
        minHeight: minHeight,
        webPreferences: {
            // Disable auxclick event
            // See https://developers.google.com/web/updates/2016/10/auxclick
            disableBlinkFeatures: 'Auxclick',
            // Enable, among other things, the ResizeObserver
            experimentalFeatures: true,
            nodeIntegration: true,
            webviewTag: true,
        },
        acceptFirstMouse: true,
    }

    if (isMacintosh) {
        windowOptions.titleBarStyle = 'hidden'
    } else if (isWindows) {
        // windowOptions.frame = false
    } else if (isLinux) {
        windowOptions.icon = path.join(__dirname, 'build/logo', 'logo-256.png')
    }

    mainWindow = new BrowserWindow(windowOptions);
    savedWindowState.manage(mainWindow);

    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, '../build/index.html'),
            protocol: 'file:',
            slashes: false,
        })
    );

    buildMenu(mainWindow);

    if (process.env.NODE_ENV !== 'production') {
        // BrowserWindow.addDevToolsExtension('node_modules/vue-devtools/vender');
    }

    // // 設定小說家的 cookie
    // session.defaultSession.cookies.set({ url: 'https://novel18.syosetu.com', name: 'over18', value: 'yes' })
    // .then(() => {}, (error) => {
    //     console.error(error)
    // })
}

function buildMenu(window: BrowserWindow) {

    const separator: Electron.MenuItemConstructorOptions = { type: 'separator' }

    const menuTemplate = new Array<Electron.MenuItemConstructorOptions>();

    if (isMacintosh) {
        menuTemplate.push({
            label: 'PIBBK Lite',
            submenu: [
                { role: 'about', label: '關於 PIBBK Lite' },
                separator,
                { role: 'services', label: '服務' },
                separator,
                { role: 'hide', label: '隱藏 PIBBK Lite' },
                { role: 'hideOthers', label: '隱藏其他' },
                separator,
                { role: 'quit', label: '離開 PIBBK Lite', accelerator: isMacintosh ? 'Cmd+Q' : 'Ctrl+Q' }
            ]
        });
    }

    const fileMenu: Electron.MenuItemConstructorOptions = {
        label: isMacintosh ? '檔案' : '檔案(&F)',
        submenu: [
            { label: i18n.__('開啟檔案'), accelerator: isMacintosh ? 'Cmd+O' : 'Ctrl+O',click() { showOpenDialog(); } },
            { label: i18n.__('儲存檔案'), accelerator: isMacintosh ? 'Cmd+S' : 'Ctrl+S', click() { saveCurrentFile(); } },
            { label: i18n.__('另存新檔'), accelerator: isMacintosh ? 'Cmd+Shift+S' : 'Ctrl+Shift+S', click() { saveNewFile(); } },
            separator,
            { label: i18n.__('匯入至原文'), click() { showImportDialog('source'); } },
            { label: i18n.__('匯入至譯文'), click() { showImportDialog('translation'); } },
            { label: i18n.__('匯入取代清單'), click() { showImportDialog('replace'); } },
            separator,
            { label: i18n.__('匯出純文字譯文'), click() { showExportTranslationDialog(); } },
            { label: i18n.__('匯出取代清單'), click() { showExportReplacesDialog(); } },
            separator,
            { label: i18n.__('關閉檔案'), accelerator: isMacintosh ? 'Cmd+W' : 'Ctrl+W', click() { closeCurrentFile(); } },
        ]
    }

    menuTemplate.push(fileMenu)

    menuTemplate.push({
        label: isMacintosh ? '編輯' : '編輯(&E)',
        submenu: [
            { role: 'undo', label: isMacintosh ? 'Undo' : '&Undo' },
            { role: 'redo', label: isMacintosh ? 'Redo' : '&Redo' },
            separator,
            { role: 'cut', label: isMacintosh ? 'Cut' : 'Cu&t' },
            { role: 'copy', label: isMacintosh ? 'Copy' : '&Copy' },
            { role: 'paste', label: isMacintosh ? 'Paste' : '&Paste' },
            { role: 'selectAll', label: 'Select All' }
        ],
    })

    menuTemplate.push({
        label: '檢視',
        submenu: [
            { role: 'forceReload', label: '重新讀取程式' },
            { role: 'toggleDevTools', label: '切換開發者工具'}
        ]
    });

    menuTemplate.push({
        label: '視窗',
        role: 'window',
        submenu: [
            { role: 'minimize', label: '最小化' },
            { role: 'zoom', label: '縮放'},
            { type: 'separator' },
            { role: 'front', label: '全部移至最上層'},
        ]
    });

    menuTemplate.push({
        label: '說明',
        role: 'help',
        submenu: [
        ]
    });

    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
}

/* ------------------
    menu event
   ------------------ */

function showOpenDialog() {
    dialog.showOpenDialog({ properties: ['openFile'], filters: [ {name: 'PIBBK 檔案', extensions: ['pibbk'] } ] }).
    then(result => {
        if (result.filePaths.length === 1) {
            if (mainWindow === null) {
                initOpenFileQueue.push(result!.filePaths[0]);
                createWindow();
            }
            else {
                mainWindow!.webContents.send('file-open', result!.filePaths[0]);
            }
        }
    }).catch(err => {
        console.log(err);
    });
}

function showImportDialog(type: string) {

    if (type === 'replace') {
        dialog.showOpenDialog({ properties: ['openFile'], filters: [ {name: 'PIBBK 檔案', extensions: ['pibbk'] } ] }).
        then(result => {
            if (result.filePaths.length === 1) {
                mainWindow!.webContents.send(`file-import-${type}`, result!.filePaths[0]);
            }
        }).catch(err => {
            console.log(err);
        });
        return;
    }

    dialog.showOpenDialog({ properties: ['openFile'], filters: [ {name: '純文字檔案', extensions: ['txt'] } ] }).
    then(result => {
        if (result.filePaths.length === 1) {
            mainWindow!.webContents.send(`file-import-${type}`, result!.filePaths[0]);
        }
    }).catch(err => {
        console.log(err);
    });
}

function showExportTranslationDialog() {
    dialog.showSaveDialog({ filters: [ {name: '所有檔案', extensions: ['*'] } ] }).
    then(result => {
        if (result.filePath) {
            mainWindow!.webContents.send('file-export-translation', result!.filePath);
        }
    }).catch(err => {
        console.log(err);
    });
}

function showExportReplacesDialog() {
    dialog.showSaveDialog({ filters: [ {name: '所有檔案', extensions: ['*'] } ] }).
    then(result => {
        if (result.filePath) {
            mainWindow!.webContents.send('file-export-replaces', result!.filePath);
        }
    }).catch(err => {
        console.log(err);
    });
}

function saveCurrentFile() {
    mainWindow!.webContents.send('file-save-current');
}

function saveNewFile() {
    mainWindow!.webContents.send('file-save-current-new');
}

function closeCurrentFile() {
    mainWindow!.webContents.send('file-close-current');
}
