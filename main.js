const {electron, BrowserWindow, app, Menu, dialog, ipcMain} = require('electron')

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600})

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

let song

function OpenAndLoadSong(filePath) {
  if (filePath === undefined) {
    return
  }
  var parsedObject
  let fs = require('fs')
  fs.readFile(filePath[0], 'utf8', function (err,data) {
    song = JSON.parse(data.toString())
  });
  mainWindow.webContents.send('LoadSong', song);
}

function PromptNewSong() {
  let promptWindow = new BrowserWindow({parent: mainWindow, modal: true, resizable: true, frame: false, width: 400, height: 620})
  promptWindow.webContents.on('did-finish-load', () => {
    promptWindow.show()
    promptWindow.focus()
  })
  promptWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'new.html'),
    protocol: 'file:',
    slashes: true
  }))
  //promptWindow.webContents.openDevTools()
}

const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New',
        click: function () {
          PromptNewSong()
        }
      },
      {
        label: 'Open',
        click: function () {
          console.log(dialog.showOpenDialog({properties: ['openFile']}, OpenAndLoadSong))
        }
      },
      {
        label: 'Save'
      },
      {
        label: 'Save As'
      },
      {
        type: 'separator'
      },
      {
        role: 'quit'
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {
        role: 'undo'
      },
      {
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        role: 'cut'
      },
      {
        role: 'copy'
      },
      {
        role: 'paste'
      },
      {
        role: 'pasteandmatchstyle'
      },
      {
        role: 'delete'
      },
      {
        role: 'selectall'
      },
      {
        type: 'separator'
      },
      {
        role: 'toggledevtools'
      },
      {
        role: 'forcereload'
      }
    ]
  }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)
