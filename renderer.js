// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
global.jQuery = require('jquery');
var $ = require('jquery');
window.$ = $;
require('bootstrap');

const {remote} = require('electron')
const {Menu, MenuItem} = remote
Menu.getApplicationMenu().items[0].submenu.items[1].click = (menuItem, browserWindow, event) => { console.log("triggered") };
console.log(Menu.getApplicationMenu())
