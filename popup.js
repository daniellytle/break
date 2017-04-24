var w = chrome.extension.getBackgroundPage();

$('#start-session').click((e => {
  window.close();
  w.mainPomodoro.start();
}))
