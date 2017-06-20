const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')
const {ipcMain} = require('electron')

let win

function createWindow () {
  win = new BrowserWindow({
      icon: 'build/icon.ico',
      width: 1200,
      height: 600,
      webPreferences: {
        webSecurity: false
      }
    }
  )

  win.loadURL(url.format({
    pathname: path.join(__dirname, './app/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  win.on('closed', function () {
    win = null
  })
}

app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin'
  ) {
    app.quit()
  }
})

app.on('activate', function () {
  if (win === null
  ) {
    createWindow()
  }
})

ipcMain.on('toggle-dev-tools', function () {
  toggleDevTools()
})

function toggleDevTools () {
  if (!win) return
  if (win.webContents.isDevToolsOpened()) {
    win.webContents.closeDevTools()
  } else {
    win.webContents.openDevTools({detach: true})
  }
}