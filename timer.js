var w = chrome.extension.getBackgroundPage();

var sessionsElt = $('#sessions')[0];
var timerElt = $('#timer')[0];
updateTime = function() {
  var time = w.mainPomodoro.currentTimer.timeRemainingString();
  var stats = w.mainPomodoro.getStats();

  timerElt.innerHTML = time;
  if (w.mainPomodoro.currentTimer.timeRemaining <= 0) {
    window.close();
  }
  // update stats
  sessionsElt.innerHTML = stats["sessions"];

  setTimeout(updateTime, 1000);
}

$('#snooze').click(() => {
  window.close();
  w.mainPomodoro.snooze();
})

$('#end-session').click((e) => {
  window.close();
  w.mainPomodoro.stop();
})

$('#break').click((e) => {
  window.close();
  w.mainPomodoro.break();
})

$('a.flip').click((e) => {
  $('.ui.card').toggle();
})

updateTime();
