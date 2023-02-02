var calendar;
var lastFetch = new Date().toJSON();
var lastToggle = new Date().getTime();
var rapidToggleCount = 0;

function log(level, message) {
    var debug = document.getElementById('log');
    var el = document.createElement('div');
    var time = new Date().toUTCString();
    var prefix = '[DEBUG]';
    if (level == 'debug') {
        console.debug(message);
    } else if (level == 'log') {
        prefix = '[LOG]';
        console.log(message);
    } else if (level == 'warn') {
        console.warn(message);
        prefix = '[WARN]';
    } else if (level == 'err') {
        console.error(message);
        prefix = '[ERR]';
    }
    el.innerText = time + ' ' + prefix + ' ' + message;
    debug.insertBefore(el, debug.firstChild);
}

function toggleDebug() {
    console.log("DEBUG");
    var debug = document.getElementById('log');
    if (debug.style.display == 'none') {
        debug.style.display = '';
    } else {
        debug.style.display = 'none';
    }
}

function setTheme(theme) {
    document.querySelector('button#themeToggle i').classList = [theme];
    if (theme == 'system') {
        document.documentElement.classList = [];
        localStorage.removeItem('theme');
    } else {
        document.documentElement.classList = [theme];
        localStorage.setItem('theme', theme);
    }
}

function checkRefreshTap() {
    var now = new Date().getTime();
    if (now - lastToggle < 750) {
        rapidToggleCount++;
    } else {
        rapidToggleCount = 0;
    }
    lastToggle = now;
    if (rapidToggleCount > 2) {
        rapidToggleCount = 0;
        log('debug', "Refreshing");
        refresh("Refreshing...");
    }
}

function toggleTheme() {
    checkRefreshTap();
    var toggleButton = document.querySelector('button#themeToggle i');
    if (toggleButton.classList.contains('system')) {
        setTheme('light');
    } else if (toggleButton.classList.contains('light')) {
        setTheme('dark');
    } else {
        setTheme('system');
    }
}

function setupTheme() {
    var theme = localStorage.getItem('theme');
    if (theme) {
        setTheme(theme);
    }

    var toggleButton = document.getElementById('themeToggle');
    if (toggleButton) {
        toggleButton.addEventListener('click', toggleTheme);
    }

    var debug = document.getElementById('debug');
    if (debug) {
        debug.addEventListener('click', toggleDebug);
    }
}

function setupCalendar() {
    var calendarEl = document.getElementById('calendar');

    if (!calendarEl) {
        return;
    }

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            start: 'title',
            center: 'subscribe',
            end: 'today prev,next'
        },
        customButtons: {
            subscribe: {
                text: 'Subscribe',
                click: function() {
                    var calUrl = 'webcal://jffmrk.github.io/sfmm/hours.ics';
                    document.location.assign(calUrl);
                    navigator.clipboard.writeText(calUrl);
                    setTimeout(function() {
                        alert("WebCal URL copied to clipboard. Open your Calendar App to subscribe.\n\n" + calUrl);
                    }, 750);
                }
            }
        },
        editable: false,
        selectable: false,
        displayEventTime: true,
        eventDisplay: 'block',
        aspectRatio: 2.5,
        nextDayThreshold: '07:00:00',
        showNonCurrentDates: true,
        fixedWeekCount: true
    });

    hideCalendar();

    addCalendarSources();
}

var pastEvents = {

    didFetch: [],

    getJsonFile: function(date) {
        var year = date.getFullYear();
        var mon = ("0" + (date.getMonth() + 1)).slice(-2);
        var jsonFile = year + "-" + mon + ".json";
        return jsonFile;
    },

    isInTheFuture: function(date) {
        const today = new Date();
        return date > today;
    },

    queryParams: function(date) {
        const t = new Date();
        var mon = ("0" + (date.getMonth() + 1)).slice(-2);
        var params = "?t=" + t.getFullYear() + mon;
        if (date.getFullYear() != t.getFullYear() || date.getMonth() != t.getMonth()) {
            return params;
        }
        params += t.getDate() + "." + t.getHours() + t.getMinutes();
        return params;
    },

    doFetch: function(date) {
        var jsonFile = this.getJsonFile(date);
        if (this.isInTheFuture(date)) {
            log('debug', jsonFile + " • Skip:Future");
            return;
        }
        if (this.didFetch.includes(jsonFile)) {
            log('debug', jsonFile + " • Skip:Fetched");
            return;
        }
        var fetchArray = this.didFetch;
        fetchArray.push(jsonFile);
        log('debug', jsonFile + " • loading");
        var jsonUrl = "archive/" + jsonFile + this.queryParams(date);
        fetch(jsonUrl)
            .then(response => {
                if (!response.ok) {
                    log('warn', jsonFile + " • no data");
                    return Promise.reject("NoData");
                }
                return response.json();
            })
            .then(data => {
                console.info(jsonFile + " • " + data.length);
                data.forEach(e => {
                    calendar.addEvent(e);
                });
            })
            .catch(error => {
                if (error == "NoData") {
                    return;
                }
                log('err', "ERR • Retry: " + jsonFile);
                const index = fetchArray.indexOf(jsonFile);
                if (index > -1) {
                    fetchArray.splice(index, 1);
                }
            });
    },

    calendarFetchFn: function(fetchInfo, success, failure) {
        log('debug', "Request: " + fetchInfo.startStr + " -> " + fetchInfo.endStr);
        var start = new Date(fetchInfo.startStr);
        this.doFetch(start);
        start.setDate(start.getDate() + 8);
        this.doFetch(start);
        var end = new Date(fetchInfo.endStr);
        this.doFetch(end);
        success([]);
    },

    reset: function() {
        this.didFetch = [];
    }
};

function fadeIn(el) {
    fade(el, true, 10);
}

function fadeOut(el) {
    fade(el, false, 10);
}

function fade(el, increase, delay) {
    // Increase Params
    var opacity = 0.1;
    var opacityEnd = 1;
    var factor = 1.1;
    var atLimit = val => val >= 1;

    // Decrease
    if (!increase) {
        opacity = 1;
        opacityEnd = 0;
        factor = 0.9;
        atLimit = val => val < 0.1;
    }

    el.style.filter = 'opacity(' + opacity + ')';
    var timer = setInterval(function() {
        if (atLimit(opacity)) {
            clearInterval(timer);
            opacity = opacityEnd;
        }
        el.style.filter = 'opacity(' + opacity + ')';
        opacity *= factor;
    }, delay);
}

function hideCalendar() {
    var calendarEl = document.getElementById('calendar');
    calendarEl.style.filter = 'opacity(0)';
}

function refresh(reason) {

    var changeTimeEl = document.getElementById('lastChangeTime');
    if (changeTimeEl) {
        changeTimeEl.innerText = reason;
    }

    // Remove the old calendar
    document.getElementById('calendar').remove();

    // Create and setup the new calendar
    var newCalendar = document.createElement('div');
    newCalendar.id = 'calendar';
    document.getElementsByClassName('calendarWrapper')[0].appendChild(newCalendar);

    setTimeout(setupCalendar, 750);
}

function addCalendarSources() {

    pastEvents.reset();

    var upcomingUrl = "https://jffmrk.github.io/sfmm/hours.end.ics?t=" + btoa(lastFetch);

    calendar.addEventSource({
        id: 'future',
        url: upcomingUrl,
        format: 'ics'
    });

    calendar.addEventSource({
        id: 'pastEvents',
        events: pastEvents.calendarFetchFn.bind(pastEvents)
    });

    setTimeout(function() {
        calendar.render();

        var calendarEl = document.getElementById('calendar');
        fadeIn(calendarEl);

        updateLastChangeTime();
    }, 250);
}

function updateLastChangeTime() {
    var changeTimeEl = document.getElementById('lastChangeTime');
    if (changeTimeEl) {
        changeTimeEl.innerText = lastFetch;
    }
}

function detectChange(onChange, onSuccess) {
    var cache = new Date().getTime();
    var url = "lastChange.txt?t=" + cache;
    fetch(url)
        .then(response => {
            if (!response.ok) {
                log('warn', "lastChange.txt • no data");
                return Promise.reject("NoData");
            }
            return response.text();
        })
        .then(text => {
            if (lastFetch != text) {
                lastFetch = text;
                log('log', "• change detected " + text);
                if (onChange) { 
                    onChange();
                }
            } else {
                log('log', "• no changes");
                if (onSuccess) {
                    onSuccess();
                }
            }
        })
        .catch(error => {
            if (error == "NoData") {
                return;
            }
            log('err', "lastChange.txt • ERR");
        });
}

function setupFocus() {
    detectChange();

    var lastFocus = new Date().getTime();
    var focusCacheTime = 1800000;
    var checkTime = 300000;

    var updateLastFocus = function() {
        lastFocus = new Date().getTime();
    };

    var onChange = function() {
        updateLastFocus();
        refresh("Loading changes...");
    };

    var reloadSuccess = function() {
        updateLastFocus();
        refresh("Reloading...");
    };

    var onFocus = (event) => {
        var now = new Date();
        var diff = now - lastFocus;
        log('log', "focus: diff=" + diff + ", cache=" + focusCacheTime);
        if (diff > focusCacheTime) {
            detectChange(onChange, reloadSuccess);
        } else if (diff > checkTime) {
            detectChange(onChange, updateLastFocus);
        }
    };

    addEventListener('focus', onFocus);
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('log').style.display = 'none';

    hideCalendar();

    setupTheme();
    setupFocus();
    setupCalendar();

    // Update calendar when printing
    window.matchMedia('print').addEventListener('change', function(mql) {
        if (mql.matches) {
            calendar.render();
        }
    });
});
