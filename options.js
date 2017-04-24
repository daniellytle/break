/*
  Localization
*/

// Localize all elements with a data-i18n="message_name" attribute
var localizedElements = document.querySelectorAll('[data-i18n]'), el, message;
for(var i = 0; i < localizedElements.length; i++) {
  el = localizedElements[i];
  message = chrome.i18n.getMessage(el.getAttribute('data-i18n'));

  // Capitalize first letter if element has attribute data-i18n-caps
  if(el.hasAttribute('data-i18n-caps')) {
    message = message.charAt(0).toUpperCase() + message.substr(1);
  }

  el.innerHTML = message;
}

/*
  Form interaction
*/

$('#type-select').dropdown();

var form = document.getElementById('options-form'),
  // siteListEl = document.getElementById('site-list'),
  // whitelistEl = document.getElementById('blacklist-or-whitelist'),
  // showNotificationsEl = document.getElementById('show-notifications'),
  // shouldRingEl = document.getElementById('should-ring'),
  // clickRestartsEl = document.getElementById('click-restarts'),
  saveSuccessfulEl = document.getElementById('save-successful'),
  timeFormatErrorEl = document.getElementById('time-format-error'),
  background = chrome.extension.getBackgroundPage(),
  startCallbacks = {}, durationEls = {};

durationEls['work'] = document.getElementById('work-duration');
durationEls['snoozeDuration'] = document.getElementById('snooze-duration');

var TIME_REGEX = /^([0-9]+)?$/;

form.onsubmit = function () {
  console.log("form submitted");
  var durations = {}, duration, durationStr, durationMatch;

  for(var key in durationEls) {
    durationStr = durationEls[key].value;
    durationMatch = durationStr.match(TIME_REGEX);
    if(durationMatch) {
      console.log(durationMatch);
      durations[key] = (60 * parseInt(durationMatch[1], 10));
    } else {
      timeFormatErrorEl.className = 'show';
      return false;
    }
  }

  // get type
  var selectedType = "Any";
  var selected = $('#type-select').dropdown('get value');
  if (selected == "Physical" || selected == "Mental") {
    selectedType = selected;
  }

  console.log(durations);

  background.setPrefs({
    // siteList:           siteListEl.value.split(/\r?\n/),
    durations:          durations,
    type:               selectedType,
    showNotifications:  true,
    // shouldRing:         shouldRingEl.checked,
    // clickRestarts:      clickRestartsEl.checked,
    // whitelist:          whitelistEl.selectedIndex == 1
  })
  saveSuccessfulEl.className = 'show';
  return false;
}

// siteListEl.onfocus = formAltered;
// showNotificationsEl.onchange = formAltered;
// shouldRingEl.onchange = formAltered;
// clickRestartsEl.onchange = formAltered;
// whitelistEl.onchange = formAltered;

function formAltered() {
  saveSuccessfulEl.removeAttribute('class');
  timeFormatErrorEl.removeAttribute('class');
}

// siteListEl.value = background.PREFS.siteList.join("\n");
// showNotificationsEl.checked = background.PREFS.showNotifications;
// shouldRingEl.checked = background.PREFS.shouldRing;
// clickRestartsEl.checked = background.PREFS.clickRestarts;
// whitelistEl.selectedIndex = background.PREFS.whitelist ? 1 : 0;

var duration, minutes, seconds;
for(var key in durationEls) {
  duration = background.PREFS.durations[key];
  seconds = duration % 60;
  minutes = (duration - seconds) / 60;
  if(seconds >= 10) {
    durationEls[key].value = minutes + ":" + seconds;
  } else if(seconds > 0) {
    durationEls[key].value = minutes + ":0" + seconds;
  } else {
    durationEls[key].value = minutes;
  }
  durationEls[key].onfocus = formAltered;
}

// Preset Type
$('#type-select').dropdown('set selected', background.PREFS.type);

function setInputDisabled(state) {
  siteListEl.disabled = state;
  whitelistEl.disabled = state;
  for(var key in durationEls) {
    durationEls[key].disabled = state;
  }
}

startCallbacks.work = function () {
  document.body.className = 'work';
  // setInputDisabled(true);
}

startCallbacks.break = function () {
  document.body.removeAttribute('class');
  setInputDisabled(false);
}

if(background.mainPomodoro.mostRecentMode == 'work') {
  startCallbacks.work();
}
