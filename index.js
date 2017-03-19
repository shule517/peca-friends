let electron = require('electron');
let app = electron.app;
let BrowserWindow = electron.BrowserWindow;

let mainWindow = null;

app.on('window-all-closed', () => {
    app.quit();
});

app.on('ready', () => {
    console.log(process.versions);
    mainWindow = new BrowserWindow({width:800, height:600});
    mainWindow.loadURL('file://' + __dirname + '/index.html');
    mainWindow.webContents.openDevTools();
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
});
