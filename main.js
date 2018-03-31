const {electron, BrowserWindow, app, Menu, dialog, ipcMain} = require('electron')

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  let fs = require('fs')
  if (fs.existsSync('song.wav')) {
    fs.unlinkSync('song.wav')
  }
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600})

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'pages', 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  //mainWindow.webContents.openDevTools()

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
  let fs = require('fs')
  let wav = require('wav');
  let yauzl = require("yauzl")

  let songData = {}
  let song = null

  yauzl.open(String(filePath), {lazyEntries: true}, function(err, zipfile) {
    if (err) throw err;
    zipfile.readEntry();
    zipfile.on("entry", function(entry) {
      if (/\/$/.test(entry.fileName)) {
        // Directory file names end with '/'.
        // Note that entires for directories themselves are optional.
        // An entry's fileName implicitly requires its parent directories to exist.
        zipfile.readEntry()
      } else {
        // file entry
        zipfile.openReadStream(entry, function(err, readStream) {
          if (err) throw err;
          result = ''
          readStream.on("end", function() {
            if (entry.fileName == 'song.json') {
              songData = JSON.parse(result)
            } else {
              song = result
            }
            zipfile.readEntry()
          })
          readStream.on('data', function(chunk) {
            result += chunk
          })
          if (entry.fileName == 'song.wav') {
            let writeStream = fs.createWriteStream(entry.fileName)
            readStream.pipe(writeStream)
          }
        })
      }
    })
    zipfile.on("close", () => {
      console.log("Sending Song")
      mainWindow.webContents.send('LoadSong', songData, true)
    })
  })
}

function ImportJSONSong(filePath) {
  if (filePath === undefined) {
    return
  }
  let fs = require('fs')
  fs.readFile(filePath[0], 'utf8', function (err,data) {
    song = JSON.parse(data.toString())
    mainWindow.webContents.send('LoadSong', song)
  })
}

function PromptNewSong() {
  let promptWindow = new BrowserWindow({parent: mainWindow, modal: true, resizable: true, frame: false, width: 400, height: 620, maxHeight: 620})
  promptWindow.webContents.on('did-finish-load', () => {
    promptWindow.show()
    promptWindow.focus()
  })
  promptWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'pages', 'new.html'),
    protocol: 'file:',
    slashes: true
  }))
  //promptWindow.webContents.openDevTools()
}

function SaveSong(path) {
  mainWindow.webContents.send('SaveSongData')
  ipcMain.on('ReturnedSongData', (event, arg) => {
    let fs = require('fs')
    var yazl = require("yazl");

    var zipfile = new yazl.ZipFile();
    zipfile.addBuffer(Buffer.from(JSON.stringify(arg.data)), "song.json", {
      mtime: new Date(),
      mode: parseInt("0100664", 8), // -rw-rw-r--
    })
    zipfile.addFile(arg.song, "song.wav");
    zipfile.outputStream.pipe(fs.createWriteStream(path)).on("close", function() {
      console.log("done")
    })
    zipfile.end()
  })
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
          dialog.showOpenDialog({filters: [{name: 'RhyVR Song File', extensions: ['rhyvr']}]}, OpenAndLoadSong)
        }
      },
      {
        label: 'Import',
        click: function () {
          dialog.showOpenDialog({filters: [{name: 'JSON File', extensions: ['json']}]}, ImportJSONSong)
        }
      },      
      {
        label: 'Save',
        click: function () {
          dialog.showSaveDialog({filters: [{name: 'RhyVR Song File', extensions: ['rhyvr']}]}, SaveSong)
        }
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
