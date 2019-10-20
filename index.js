const {
  app,
  BrowserWindow,
  ipcMain
} = require('electron');
const moment = require('moment');
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  mainWindow.loadFile('download.html');
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

//============================================= list data
ipcMain.on('arrMsg', (event, arg) => {
  //console.log('index ' + arg);
  //console.log(arg[4]);
  var Client = require('ftp');
  var c = new Client();
  c.on('ready', function () {
    c.list(arg[4], function (err, list) {
      //if (err) throw (err);
      if (err) {
        console.log('ERROR : ' + arg[4] + ' ' + err.message);
        event.returnValue = 0;
      } else {
        //console.log(list[0].name);
        event.returnValue = list;
      }
      c.end();
    });
  });
  // caught error
  c.on('error', function(err){
    const { dialog } = require('electron')
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      message: err.message,
    });
    mainWindow.reload();
  });
  // connect to server
  c.connect({
    host: arg[0],
    port: arg[1],
    user: arg[2],
    password: arg[3],
    //debug: console.log
  });
});

//============================================= download files
ipcMain.on('arrDlMsg', (event, arg) => {
  console.log('dl ' + arg);
  var Client = require('ftp');
  var fs = require('fs');
  var c = new Client();
  c.on('ready', function () {
    c.get(arg[4], function (err, stream) {
      //if (err) throw err;
      if (err) console.log(err);
      stream.once('close', function () {
        c.end();
      });
      stream.pipe(fs.createWriteStream(arg[5]));
    });
  });
  c.connect({
    host: arg[0],
    port: arg[1],
    user: arg[2],
    password: arg[3],
  });
  event.returnValue = 'done!';
});

//============================================= array data range 
ipcMain.on('arrDateRange', (event, arg) => {
  var dateArray = [];
  var currentDate = moment(arg[0]);
  var stopDate = moment(arg[1]);
  while (currentDate <= stopDate) {
      dateArray.push( moment(currentDate).format('YYYY/MM/DD') )
      currentDate = moment(currentDate).add(1, 'days');
  }
  console.log(dateArray);
  event.returnValue = dateArray;
});

//https://github.com/mscdex/node-ftp