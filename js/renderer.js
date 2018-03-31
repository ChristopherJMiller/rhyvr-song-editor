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
  for (num = 0; num < $('#songNumberOfRows').val(); num++) {
    if (difficulty.noteRow[num] === undefined) {
      let newRow = {
        row: []
      }
      for (var i = 0; i < $('#songNumberOfDrums').val(); i++) {
        newRow.row[i] = 0;
      }
      AddNoteRow(noteArea, newRow, num)
    } else {
      AddNoteRow(noteArea, difficulty.noteRow[num], num)
    }
    sleep(1)
  }
}

let timer;
let currentRow;
let idPrefix;
let tmpBackgroundColor;
function StartRows() {
  idPrefix = '#' + difficultyContainers[currentlySelected].attr('id') + 'Row'
  currentRow = 1;
  tmpBackgroundColor = $(idPrefix + currentRow).css('background-color')
  timer = new NanoTimer();
  timer.setInterval(function() {
    if (currentRow != 0) {
      $(idPrefix + (currentRow - 1)).css('background-color', tmpBackgroundColor)
      tmpBackgroundColor = $(idPrefix + currentRow).css('background-color')
    }
    $(idPrefix + currentRow).css('background-color', 'red')
    currentRow++
  }, '', timeBetweenRow + 's')
}

let fileToPlay = false;

function PlaySong() {
  if (!fileToPlay) {
    $('#audioPlayer').attr('src', $('#songFile').prop('files')[0].path)
  } else {
    $('#audioPlayer').attr('src', '../song.wav')
  }
  document.getElementById('audioPlayer').load()
  document.getElementById('audioPlayer').play()
  sleep(((offset * 1000) + (timeBetweenRow * 1000)))
  StartRows()
}

function StopSong() {
  document.getElementById('audioPlayer').pause()
  timer.clearInterval()
  $(idPrefix + (currentRow - 1)).css('background-color', tmpBackgroundColor)
}



//Button Events

$('#songStart').click(() => { PlaySong() })
$('#songStop').click(() => { StopSong() })

$('#addDifficulty').click(() => { var difficulty = {name: 'New Difficulty ' + difficultyContainers.length, level: 1, color: '#ffffff', noteRow: []}; AddDifficulty(difficulty); })

let difficultiesFromSong = null
$('#loadDifficulty').click(() => { 
   for(var i = 0; i < difficultiesFromSong.length; i++) {
    AddDifficulty(difficultiesFromSong[i])
   }
   $('#loadDifficulty').hide()
})

//IPC

ipcRenderer.on('LoadSong', (event, song, file = false) => {
  console.log("Song Received")
  $('#songName').val(song.name)
  $('#songAuthor').val(song.author)
  $('#songNumberOfDrums').val(song.numberOfDrums)
  $('#noteTemplate').attr('class', 'col-sm-' + Math.floor(12 / (Number(song.numberOfDrums) + 1)))
  $('#noteRowTemplate').children('strong').attr('class', 'col-sm-' + Math.floor(12 / (Number(song.numberOfDrums) + 1)))
  $('#songBeatsPerMinute').val(song.bpm)
  $('#songSubdivision').val(song.subdivision)
  timeBetweenRow = 60 / (song.bpm * song.subdivision)
  console.log(timeBetweenRow)
  offset = song.offset
  subdivisions = song.subdivisions
  numOfRows = song.difficulties[0].noteRow.length
  $('#songOffset').val(song.offset)
  $('#songNumberOfRows').val(song.difficulties[0].noteRow.length)
  $('#songNumberOfDifficulties').val(song.difficulties.length)
  if (file) {
    $('#songFile').hide(500)
    $('#songFile').parent().children('label').text("Song: Added")
    fileToPlay = file
  }
  difficultyContainers = [];
  difficultiesFromSong = song.difficulties
})

ipcRenderer.on('SaveSongData', () => {
  let data = {
    name: $('#songName').val(),
    author: $('#songAuthor').val(),
    numberOfDrums: $('#songNumberOfDrums').val(),
    bpm: $('#songBeatsPerMinute').val(),
    subdivision: $('#songSubdivision').val(),
    offset: $('#songOffset').val(),
    difficulties: [{
      name: null,
      level: null,
      color: null,
      noteRow: []
    }]
  }
  for (i = 0; i < difficultyContainers.length; i++) {
    let difficultyArea =  $('#difficultyArea').children()[i]
    data.difficulties[i].name = $(difficultyArea).children('div').children('div').children('div[name="name"]').children('input').val()
    data.difficulties[i].level = $(difficultyArea).children('div').children('div').children('div[name="level"]').children('input').val()
    data.difficulties[i].color = $(difficultyArea).children('div').children('div').children('div[name="color"]').children('input').val()
    for (j = 0; j < difficultyContainers[i].children().length; j++) {
      let dataRow = difficultyContainers[i].children()[j]
      data.difficulties[i].noteRow[j] = {
        row: []
      }
      for (k = 1; k < $(dataRow).children().length; k++) {
        data.difficulties[i].noteRow[j].row[k - 1] = $($(dataRow).children()[k]).children('input').prop( "checked" ) ? 1 : 0
      }
    }
  }
  ipcRenderer.send("ReturnedSongData", {data: data, song: fileToPlay ? 'song.wav' : document.getElementById("songFile").files[0].path})
})
