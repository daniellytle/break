/*

Constants

*/

var PREFS = loadPrefs(),
BADGE_BACKGROUND_COLORS = {
  work: [192, 0, 0, 255],
  break: [0, 192, 0, 255]
}, RING = new Audio("ring.ogg"),
ringLoaded = false;

loadRingIfNecessary();

function defaultPrefs() {
  return {
    siteList: [
      'facebook.com',
      'youtube.com',
      'twitter.com',
      'tumblr.com',
      'pinterest.com',
      'myspace.com',
      'livejournal.com',
      'digg.com',
      'stumbleupon.com',
      'reddit.com',
      'kongregate.com',
      'newgrounds.com',
      'addictinggames.com',
      'hulu.com'
    ],
    durations: { // in seconds
      work: 1500,
      snoozeDuration: 180
    },
    shouldRing: true,
    clickRestarts: false,
    whitelist: false,
    type: "Any",
    showNotifications: true
  }
}

function loadPrefs() {
  if(typeof localStorage['prefs'] !== 'undefined') {
    return updatePrefsFormat(JSON.parse(localStorage['prefs']));
  } else {
    return savePrefs(defaultPrefs());
  }
}

function updatePrefsFormat(prefs) {
  // Sometimes we need to change the format of the PREFS module. When just,
  // say, adding boolean flags with false as the default, there's no
  // compatibility issue. However, in more complicated situations, we need
  // to modify an old PREFS module's structure for compatibility.

  if(prefs.hasOwnProperty('domainBlacklist')) {
    // Upon adding the whitelist feature, the domainBlacklist property was
    // renamed to siteList for clarity.

    prefs.siteList = prefs.domainBlacklist;
    delete prefs.domainBlacklist;
    savePrefs(prefs);
    console.log("Renamed PREFS.domainBlacklist to PREFS.siteList");
  }

  if(!prefs.hasOwnProperty('showNotifications')) {
    // Upon adding the option to disable notifications, added the
    // showNotifications property, which defaults to true.
    prefs.showNotifications = true;
    savePrefs(prefs);
    console.log("Added PREFS.showNotifications");
  }

  return prefs;
}

function savePrefs(prefs) {
  localStorage['prefs'] = JSON.stringify(prefs);
  return prefs;
}

function setPrefs(prefs) {
  PREFS = savePrefs(prefs);
  loadRingIfNecessary();
  return prefs;
}

function loadRingIfNecessary() {
  console.log('is ring necessary?');
  if(PREFS.shouldRing && !ringLoaded) {
    console.log('ring is necessary');
    RING.onload = function () {
      console.log('ring loaded');
      ringLoaded = true;
    }
    RING.load();
  }
}

var ICONS = {
  ACTION: {
    CURRENT: {},
    PENDING: {}
  },
  FULL: {},
}, iconTypeS = ['default', 'idle', 'work'],
iconType;
for(var i in iconTypeS) {
  iconType = iconTypeS[i];
  ICONS.ACTION.CURRENT[iconType] = "icons/working.png";
  ICONS.ACTION.PENDING[iconType] = "icons/full.png";
  ICONS.FULL[iconType] = "icons/full.png";
  ICONS.NOTIFICATION = "icons/notification.png";
}

/*

Activities

*/

var ACTIVITIES = [
  {
    "type": "Physical",
    "description": "Do a few pushups"
  },
  {
    "type": "Physical",
    "description": "Walk around the room"
  },
  {
    "type": "Physical",
    "description": "Stand up and stretch"
  },
  {
    "type": "Regular",
    "description": "Take 4 slow deep breathes"
  },
  {
    "type": "Regular",
    "description": "Stand up and touch you toes"
  },
  {
    "type": "Regular",
    "description": "Walk to the bathroom and back"
  },
  {
    "type": "Regular",
    "description": "Start a conversation with a friend"
  },
  {
    "type": "Regular",
    "description": "Call a friend"
  }
]

/*

Models

*/

function Pomodoro(options) {
  this.mostRecentMode = 'work';
  this.nextMode = 'work';
  this.running = false;
  this.sessions = 0;
  this.totalTime = 0;

  this.onTimerEnd = function (timer) {
    this.running = false;
    // Set popup to activity
  }

  this.snooze = function (timer) {
    // Make value dynamic
    this.currentTimer.timeRemaining += options.getDurations().snoozeDuration;
    if (!this.running) {
      this.start();
    }
  }

  this.break = function() {
    // end
    this.stop();
    options.timer.onEnd(this.currentTimer);
    console.log('break early')
  }

  this.start = function () {
    // change to timer popup
    chrome.browserAction.setPopup({
      "popup": "timer.html"
    });
    var timerOptions = {};
    // var mostRecentMode = this.mostRecentMode,
    // this.mostRecentMode = this.nextMode;
    // this.nextMode = mostRecentMode;

    for(var key in options.timer) {
      timerOptions[key] = options.timer[key];
    }
    timerOptions.type = options.getType();
    timerOptions.duration = options.getDurations()[this.mostRecentMode];
    this.running = true;
    if (this.currentTimer) {
      delete this.currentTimer
    }
    this.currentTimer = new Pomodoro.Timer(this, timerOptions);
    this.currentTimer.start();
  }

  this.restart = function () {
    chrome.browserAction.setPopup({
      "popup": "timer.html"
    });
    if(this.currentTimer) {
      this.currentTimer.restart();
    }
  }

  this.stop = function () {
    chrome.browserAction.setPopup({
      "popup": "init-popup.html"
    });
    this.sessions = 0;
    this.totalTime = 0;
    if(this.currentTimer) {
      this.currentTimer.stop();
      this.running = false;
    }
  }

  this.getStats = function() {
    return {
      "sessions": this.sessions,
      "totalTime": this.totalTime
    }
  }
}

Pomodoro.Timer = function Timer(pomodoro, options) {
  var tickInterval, timer = this;
  this.pomodoro = pomodoro;
  this.timeRemaining = options.duration;
  this.type = options.type;

  this.start = function () {
    if (!tickInterval) {
      tickInterval = setInterval(tick, 1000);
    }
    options.onStart(timer);
    options.onTick(timer);
  }

  this.restart = function() {
    this.timeRemaining = options.duration;
    tickInterval = setInterval(tick, 1000);
    options.onTick(timer)
  }

  this.stop = function () {
    this.timeRemaining = options.duration;
    clearInterval(tickInterval);
    tickInterval = undefined;
    options.onStop(timer);
  }

  this.timeRemainingString = function () {
    if(this.timeRemaining >= 60) {
      return Math.round(this.timeRemaining / 60) + "m";
    } else {
      return (this.timeRemaining % 60) + "s";
    }
  }

  this.timeCounterString = function () {
    return 0;
  }

  function tick() {
    timer.timeRemaining--;
    options.onTick(timer);
    if(timer.timeRemaining <= 0) {
      clearInterval(tickInterval);
      pomodoro.onTimerEnd(timer);
      options.onEnd(timer);
    }
  }
}

/*

Views

*/

// The code gets really cluttered down here. Refactor would be in order,
// but I'm busier with other projects >_<

function locationsMatch(location, listedPattern) {
  return domainsMatch(location.domain, listedPattern.domain) &&
  pathsMatch(location.path, listedPattern.path);
}

function parseLocation(location) {
  var components = location.split('/');
  return {domain: components.shift(), path: components.join('/')};
}

function pathsMatch(test, against) {
  /*
  index.php ~> [null]: pass
  index.php ~> index: pass
  index.php ~> index.php: pass
  index.php ~> index.phpa: fail
  /path/to/location ~> /path/to: pass
  /path/to ~> /path/to: pass
  /path/to/ ~> /path/to/location: fail
  */

  return !against || test.substr(0, against.length) == against;
}

function domainsMatch(test, against) {
  /*
  google.com ~> google.com: case 1, pass
  www.google.com ~> google.com: case 3, pass
  google.com ~> www.google.com: case 2, fail
  google.com ~> yahoo.com: case 3, fail
  yahoo.com ~> google.com: case 2, fail
  bit.ly ~> goo.gl: case 2, fail
  mail.com ~> gmail.com: case 2, fail
  gmail.com ~> mail.com: case 3, fail
  */

  // Case 1: if the two strings match, pass
  if(test === against) {
    return true;
  } else {
    var testFrom = test.length - against.length - 1;

    // Case 2: if the second string is longer than first, or they are the same
    // length and do not match (as indicated by case 1 failing), fail
    if(testFrom < 0) {
      return false;
    } else {
      // Case 3: if and only if the first string is longer than the second and
      // the first string ends with a period followed by the second string,
      // pass
      return test.substr(testFrom) === '.' + against;
    }
  }
}

function isLocationBlocked(location) {
  for(var k in PREFS.siteList) {
    listedPattern = parseLocation(PREFS.siteList[k]);
    if(locationsMatch(location, listedPattern)) {
      // If we're in a whitelist, a matched location is not blocked => false
      // If we're in a blacklist, a matched location is blocked => true
      return !PREFS.whitelist;
    }
  }

  // If we're in a whitelist, an unmatched location is blocked => true
  // If we're in a blacklist, an unmatched location is not blocked => false
  return PREFS.whitelist;
}

function executeInTabIfBlocked(action, tab) {
  var file = "content_scripts/" + action + ".js", location;
  location = tab.url.split('://');
  location = parseLocation(location[1]);

  if(isLocationBlocked(location)) {
    chrome.tabs.executeScript(tab.id, {file: file});
  }
}

function executeInAllBlockedTabs(action) {
  var windows = chrome.windows.getAll({populate: true}, function (windows) {
    var tabs, tab, domain, listedDomain;
    for(var i in windows) {
      tabs = windows[i].tabs;
      for(var j in tabs) {
        executeInTabIfBlocked(action, tabs[j]);
      }
    }
  });
}

var notification, mainPomodoro = new Pomodoro({
  getDurations: function () {
    PREFS = loadPrefs();
    return PREFS.durations
  },
  getType: function () {
    PREFS = loadPrefs();
    return PREFS.type
  },
  timer: {
    onStop: function (timer) {
      chrome.browserAction.setIcon({
        path: 'icons/idle-48.png'
      });
      chrome.browserAction.setBadgeText({text: ""});
      // chrome.browserAction.setBadgeText({text: ''});
    },
    onEnd: function (timer) {

      // update session
      mainPomodoro.sessions++;
      // chrome.browserAction.setIcon({
      //   path: "icons/full.png"
      // });
      // chrome.browserAction.setBadgeText({text: ''});

      if(PREFS.showNotifications) {
        var rand = (Math.random()*101|0) % ACTIVITIES.length;
        var activity = ACTIVITIES[rand];
        while (timer.type != "Any" && timer.type != activity.type) {
          rand = (Math.random()*101|0) % ACTIVITIES.length;
          activity = ACTIVITIES[rand];
        }

        chrome.notifications.create("", {
          type: "basic",
          title: activity.type,
          message: activity.description,
          priority: 2,
          requireInteraction: true,
          buttons: [
            {
              title: "Shuffle",
              iconUrl: "https://cdn4.iconfinder.com/data/icons/sound-and-audio/32/black_2_audio_simple_repeat_2-128.png"
            }, {
              title: "I've Finished the Activity",
              iconUrl: "https://cdn3.iconfinder.com/data/icons/flat-actions-icons-9/512/Tick_Mark-128.png"
            }
          ],
          iconUrl: ICONS.NOTIFICATION
        }, function() {});
      }

      RING.play();
      // Set popup to activity
      chrome.browserAction.setPopup({
        "popup": "activity.html"
      });

    },
    onStart: function (timer) {
      // chrome.browserAction.setBadgeText({text: "..."});
      chrome.browserAction.setIcon({
        path: "icons/work-48.png"
      });
      chrome.browserAction.setBadgeText({text: '...'});
      if(notification) notification.cancel();
    },
    onTick: function (timer) {
      mainPomodoro.totalTime++;
    }
  }
});

chrome.browserAction.onClicked.addListener(function (tab) {

  if(mainPomodoro.running) {
    if(PREFS.clickRestarts) {
      mainPomodoro.restart();
    }
  } else {
    mainPomodoro.start();
  }
});

// chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
//   if(mainPomodoro.mostRecentMode == 'work') {
//     executeInTabIfBlocked('block', tab);
//   }
// });

chrome.notifications.onClicked.addListener(function (id) {
  // Clicking the notification brings you back to Chrome, in whatever window
  // you were last using.
  chrome.windows.getLastFocused(function (window) {
    chrome.windows.update(window.id, {focused: true});
  });
});

chrome.notifications.onButtonClicked.addListener(function (id, index) {
  // restart timer
  chrome.notifications.clear(id);
  if (index == 0) {
    var rand = (Math.random()*101|0) % ACTIVITIES.length;
    var activity = ACTIVITIES[rand];
    while (PREFS.type != "Any" && PREFS.type != activity.type) {
      rand = (Math.random()*101|0) % ACTIVITIES.length;
      activity = ACTIVITIES[rand];
    }

    chrome.notifications.create("", {
      type: "basic",
      title: activity.type,
      message: activity.description,
      priority: 2,
      requireInteraction: true,
      buttons: [
        {
          title: "Shuffle",
          iconUrl: "https://cdn4.iconfinder.com/data/icons/sound-and-audio/32/black_2_audio_simple_repeat_2-128.png"
        }, {
          title: "I've Finished the Activity",
          iconUrl: "https://cdn3.iconfinder.com/data/icons/flat-actions-icons-9/512/Tick_Mark-128.png"
        }
      ],
      iconUrl: ICONS.NOTIFICATION
    }, function() {});
  } else {
    mainPomodoro.restart();
  }
})

chrome.notifications.onClosed.addListener((id, byUser) => {
  // do something

  //console.log(id, byUser, 'noty closed')
  if (byUser) {
    // snooze timer 3min
    mainPomodoro.snooze();
    //console.log('by user')
  } else {

    //console.log('nah')
  }
})
