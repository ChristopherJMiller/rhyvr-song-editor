// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const {remote, ipcRenderer} = require('electron')
const {Menu, MenuItem} = remote

global.jQuery = require('jquery');
var $ = require('jquery');
window.$ = $;
require('bootstrap');

//Page Changing Functions

function ClearDifficulties() {
  $('#songForm').children('div[id*="difficulty"]').remove();
}

function AddDifficulty(difficulty) {
  var template = $('#difficultyTemplate').clone();
  template.attr('id', 'difficulty' + difficulty.name.replace(/\s+/g, ''));
  template.children('a').attr('href', '#difficultyTrigger' + difficulty.name.replace(/\s+/g, ''))
  template.children('a').text(difficulty.name)
  template.children('div').attr('id', 'difficultyTrigger' + difficulty.name.replace(/\s+/g, ''))
  template.children('div').children('div').children('div[name="name"]').children('input').val(difficulty.name)
  template.children('div').children('div').children('div[name="level"]').children('input').val(difficulty.level)
  template.appendTo('#songForm');
  template.removeAttr('hidden');
  template.children('div').children('div').children('div[name="color"]').children('input').val(difficulty.color.substring(1))
}

function UpdateDifficultyCount() {
  ClearDifficulties();
  for(num = 0; num < $('#songNumberOfDifficulties').val(); num++) {
    var difficulty = {name: 'New Difficulty ' + num, level: 1, color: '#ffffff'}
    AddDifficulty(difficulty)
  }
}



//Button Events

$('#songNumberOfDifficulties').change(() => { UpdateDifficultyCount() });

ipcRenderer.on('LoadSong', (event, song) => {
  $('#songName').val(song.name)
  $('#songAuthor').val(song.author)
  $('#songNumberOfDrums').val(song.numberOfDrums)
  $('#songBeatsPerMinute').val(song.bpm)
  $('#songSubdivision').val(song.subdivisions)
  $('#songNumberOfRows').val(song.difficulties[0].noteRow.length)
  $('#songNumberOfDifficulties').val(song.difficulties.length)
  ClearDifficulties()
  AddDifficulty(song.difficulties[0])
})
