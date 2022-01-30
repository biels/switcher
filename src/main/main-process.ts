import { app, BrowserWindow, screen } from "electron";
import { initialize, enable } from "@electron/remote/main";
import "reflect-metadata"

declare const ENVIRONMENT: String;

const IS_DEV = (ENVIRONMENT == "development"); // const injected via webpack define plugin.
const DEV_SERVER_URL = "http://localhost:5001"; // must match webpack dev server port.
const HTML_FILE_PATH = "renderer/index.html";

const Store = require('electron-store');

Store.initRenderer();

function createWindow(): BrowserWindow | null {

    let width = 600;
    let height = 800;
    let win: BrowserWindow | null = new BrowserWindow({
        width: width,
        height: height,
        // bottom right corner of screen.
        x: screen.getPrimaryDisplay().bounds.width - width,
        y: screen.getPrimaryDisplay().bounds.height - height,
        maximizable: true,

        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,

        },
        alwaysOnTop: true,
    });

    if (IS_DEV) {
        win.webContents.openDevTools();
        win.loadURL(DEV_SERVER_URL);
    }
    else {
        win.loadFile(HTML_FILE_PATH);
        win.removeMenu();
    }

    return win;
}

app.whenReady()
    .then(() => {

        let win = createWindow();
        if (!win) throw Error("BrowserWindow is null. Check main process initialization!");
        initialize();

        // win.maximize();
        enable(win.webContents);

        win.on("closed", () => {
            win = null;
        });

        app.on('window-all-closed', () => {
            if (process.platform != "darwin") {
                app.quit()
            }
        })

        app.on('activate', () => {
            if (win === null) {
                createWindow()
            }
        })

    });
