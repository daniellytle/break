var background = chrome.extension.getBackgroundPage();


$('#time').text(parseInt(background.mainPomodoro.totalTime / 60) + " Min")
$('#sessions').text(background.mainPomodoro.sessions)
