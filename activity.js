var w = chrome.extension.getBackgroundPage();

$('#done').click((e) => {
  window.close();
  w.mainPomodoro.restart();
})
