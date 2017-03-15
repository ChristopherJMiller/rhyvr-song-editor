// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const {remote, ipcRenderer} = require('electron')
const {Menu, MenuItem} = remote

var NanoTimer = require('nanotimer');

global.jQuery = require('jquery');
var $ = require('jquery');
window.$ = $;
require('bootstrap');

//Page Changing Functions

var subdivisions

var offset
var timeBetweenRow
var numOfRows

var difficultyContainers = []
var currentlySelected

function SelectDifficulty(index) {
  for (difficulties = 0; difficulties < difficultyContainers.length; difficulties++) {
    difficultyContainers[difficulties].hide()
  }
  currentlySelected = index
  difficultyContainers[index].show()
}

function AddNoteRow(noteAreaContainer, noteRow, rowNumber) {
  var template = $('#noteRowTemplate').clone()
  template.attr('id', noteAreaContainer.attr('id') + 'Row' + rowNumber)
  template.children('strong').text(rowNumber + 1)
  if ((rowNumber + 1) % subdivisions == 0) {
    template.css('background-color', 'LightGrey')
  }
  template.appendTo(noteAreaContainer)
  template.removeAttr('hidden')
  for (rowNum = 0; rowNum < noteRow.row.length; rowNum++) {
    var note = $('#noteTemplate').clone()
    note.attr('id', noteAreaContainer.attr('id') + 'Row' + rowNumber + 'Note' + rowNum)
    note.children('input').prop('checked', noteRow.row[rowNum])
    note.appendTo(template)
    note.removeAttr('hidden')
  }
}

function ConstructNoteContainer(diffiuculty) {
  var template = $('#noteRowContainerTemplate').clone()
  template.attr('id', 'noteArea' + diffiuculty.name.replace(/\s+/g, ''))
  template.appendTo('#noteArea')
  template.removeAttr('hidden')
  template.hide()
  return template
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function DeleteDifficulty(index) {
  difficultyContainers[index].remove()
}


function AddDifficulty(difficulty) {
  var template = $('#difficultyTemplate').clone();
  template.attr('id', 'difficulty' + difficulty.name.replace(/\s+/g, ''));
  template.children('a').attr('href', '#difficultyTrigger' + difficulty.name.replace(/\s+/g, ''))
  template.children('a').text(difficulty.name)
  template.children('div').attr('id', 'difficultyTrigger' + difficulty.name.replace(/\s+/g, ''))
  template.children('div').children('div').children('div[name="name"]').children('input').val(difficulty.name)
  template.children('div').children('div').children('div[name="level"]').children('input').val(difficulty.level)
  template.children('div').children('div').children('div[name="color"]').children('input').val(difficulty.color.substring(1))
  template.children('a').css('background-color', difficulty.color.substring(1))
  template.appendTo('#difficultyArea');
  template.removeAttr('hidden');
  var noteArea = ConstructNoteContainer(difficulty)
  var index = difficultyContainers.length
  difficultyContainers[difficultyContainers.length] = noteArea
  template.children('div').children('div').children('a[name="load"]').click(function() {
    SelectDifficulty(index)
  })
  template.children('div').children('div').children('a[name="delete"]').click(function() {
    DeleteDifficulty(index)
    template.fadeOut("fast", () => {
      template.remove()
    })
  })
  for (num = 0; num < difficulty.noteRow.length; num++) {
    AddNoteRow(noteArea, difficulty.noteRow[num], num)
    sleep(1)
  }
}

function StartRows() {
  var idPrefix = '#' + difficultyContainers[currentlySelected].attr('id') + 'Row'
  var currentRow = 0;
  var tmpBackgroundColor = $(idPrefix + currentRow).css('background-color')
  var timer = new NanoTimer();
  timer.setInterval(function() {
    if (currentRow != 0) {
      $(idPrefix + (currentRow - 1)).css('background-color', tmpBackgroundColor)
      tmpBackgroundColor = $(idPrefix + currentRow).css('background-color')
    }
    $(idPrefix + currentRow).css('background-color', 'red')
    currentRow++
  }, '', timeBetweenRow + 's')
}

function PlaySong() {
  $('#audioPlayer').attr('src', $('#songFile').prop('files')[0].path)
  document.getElementById('audioPlayer').play()
  sleep(((offset * 1000) + (timeBetweenRow * 1000)))
  StartRows()
}



//Button Events

$('#songStart').click(() => { PlaySong() })

$('#addDifficulty').click(() => { var difficulty = {name: 'New Difficulty ' + difficultyContainers.length, level: 1, color: '#ffffff', noteRow: []}; AddDifficulty(difficulty); })

//IPC

ipcRenderer.on('LoadSong', (event, song) => {
  $('#songName').val(song.name)
  $('#songAuthor').val(song.author)
  $('#songNumberOfDrums').val(song.numberOfDrums)
  $('#noteTemplate').attr('class', 'col-sm-' + Math.floor(12 / (song.numberOfDrums + 1)))
  $('#noteRowTemplate').children('strong').attr('class', 'col-sm-' + Math.floor(12 / (song.numberOfDrums + 1)))
  $('#songBeatsPerMinute').val(song.bpm)
  $('#songSubdivision').val(song.subdivisions)
  timeBetweenRow = 60 / (song.bpm * song.subdivisions)
  console.log(timeBetweenRow)
  offset = song.offset
  subdivisions = song.subdivisions
  numOfRows = song.difficulties[0].noteRow.length
  $('#songOffset').val(song.offset)
  $('#songNumberOfRows').val(song.difficulties[0].noteRow.length)
  $('#songNumberOfDifficulties').val(song.difficulties.length)
  ClearDifficulties()
  AddDifficulty(song.difficulties[0])
})
