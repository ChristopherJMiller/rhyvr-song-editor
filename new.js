const remote = require('electron').remote

global.jQuery = require('jquery');
var $ = require('jquery');

console.log(remote)

let win = remote.getCurrentWindow()

$('#cancel').click(() => {
  win.close()
})
