console.log('Loaded');
$('#numberOfDifficulties').change(() => {
  console.log('Changed');
  $('#songForm').children('div[id*="difficulty"]').remove();
  for(num = 0; num < $('#numberOfDifficulties').val(); num++) {
    var template = $('#difficultyTemplate').clone();
    template.attr('id', 'difficulty' + num);
    template.children('a').attr('href', '#difficultyTrigger' + num)
    template.children('div').attr('id', 'difficultyTrigger' + num)
    template.appendTo('#songForm');
    template.removeAttr('hidden');
  }
});
