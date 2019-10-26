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

//============================================= get download path
var promise = new Promise((resolve, reject) => {
  const exec = require('child_process').exec;
  exec('echo %HOMEDRIVE%%HOMEPATH%\\Downloads',
      (error, stdout, stderr) => {
          resolve(stdout)
          //console.log(`stdout: ${stdout}`);
          //console.log(`stderr: ${stderr}`);
          path = stdout;
          if (error !== null) {
              console.log(`exec error: ${error}`);
          }
  });
});
promise.then(function(value) {
  console.log(value);
  GlobalDownloadPath = value.replace(/\r?\n|\r/, ''); //REMOVE NEWLINE CHAR
});

//============================================= download path selector
ipcMain.on('setDownloadPath', (event) =>{
  const { dialog } = require('electron');
  dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  }).then(result => {
    if(result.canceled){
      event.returnValue = GlobalDownloadPath;
    }else{
      GlobalDownloadPath = result.filePaths;
      event.returnValue = result.filePaths;
    }
    //console.log(result.canceled)
    //console.log(result.filePaths)
  }).catch(err => {
    console.log(err)
  });
});

//============================================= show download path to render
ipcMain.on('getDlPath',(event) => {
  event.returnValue = GlobalDownloadPath;
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
      //var file = GlobalDownloadPath + '\\' + arg[5];
      var file = GlobalDownloadPath + '\\' + arg[5];
      console.log(file);
      stream.pipe(fs.createWriteStream(file));
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

//============================================= array date range 
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
//https://www.christianengvall.se/electron-packager-tutorial/