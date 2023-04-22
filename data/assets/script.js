var calendar;
var lastFetch = new Date().toJSON();
var lastToggle = new Date().getTime();
var rapidToggleCount = 0;
var allParks = [];
var parkCalendar = 6;

var parkNames = {
    6: {
        name: "Six Flags Magic Mountain",
        abbr: "SFMM"
    },
    11: {
        name: "Six Flags Hurricane Harbor, Los Angeles",
        abbr: "SFHHLA"
    }
}

function abbreviation() {
    return parkNames[parkCalendar].abbr.toString().toLowerCase();
}

function pad(str) {
    return ("0" + str).slice(-2);
}

function toDateString(now) {
    var month = now.getMonth() + 1;
    var day = now.getDate();
    var year = now.getFullYear();
    var hour = now.getHours();
    var min = pad(now.getMinutes());
    var sec = pad(now.getSeconds());

    return month + "/" + day + "/" + year + " @ " + hour + ":" + min + ":" + sec;
}

function exportSuffix() {
    var now = new Date();
    var month = pad(now.getMonth() + 1);
    var day = pad(now.getDate());
    var year = now.getFullYear();

    return "--exported-" + year + "-" + month + "-" + day;
}

function log(level, message) {
    var debug = document.getElementById('log');
    var el = document.createElement('div');
    var now = new Date();
    var time = toDateString(now);
    var prefix = '[DEBUG]';
    if (level == 'debug') {
        console.debug(message);
    } else if (level == 'warn') {
        console.warn(message);
        prefix = '[WARN]';
    } else if (level == 'err') {
        console.error(message);
        prefix = '[ERR]';
    } else {
        prefix = '[LOG]';
        console.log(message);
    }
    el.innerText = time + ' ' + prefix + ' ' + message;
    if (debug) {
        debug.insertBefore(el, debug.firstChild);
    }
}

function toggleDebug() {
    var debug = document.getElementById('log');
    if (!debug) {
        return;
    }
    if (debug.style.display == 'none') {
        debug.style.display = '';
    } else {
        debug.style.display = 'none';
    }
}

function printCalendar() {
    handleExport("print");
}

function takeScreenshot() {
    handleExport("screenshot");
}

function handleExport(exportType) {
    document.documentElement.classList = 'print preparing';
    refresh(exportType == "screenshot" ? "Take Screenshot" : "Preparing Print");
    setTimeout(function() {
        doTakeScreenshot(exportType);
    }, 1500);
}

function doTakeScreenshot(exportType) {
    var now = new Date();
    var dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    var timeStr = now.toLocaleTimeString('en-US', { timeStyle: 'short' });
    document.getElementById('printDate').innerHTML = "Exported on " + dateStr + " @ " + timeStr;
    if (exportType == "screenshot") {
        exportImage();
    } else {
        exportPrint();
    }
}

function exportReady() {
    document.documentElement.classList.remove('preparing');
}

function exportScreenshot() {
    var capture = document.getElementById('capture');
    html2canvas(capture).then(function(canvas) {
        exportReady();
        var year = calendar.view.currentStart.getFullYear();
        var month = pad(calendar.view.currentStart.getMonth() + 1);
        var link = document.createElement('a');
        var suffix = exportSuffix();
        link.setAttribute('download', year + '-' + month + '-' + abbreviation() + '--parkcalendar' + suffix + '.png');
        link.setAttribute('href', canvas.toDataURL("image/png"));
        link.click();
        exportReset();
    });
}

function exportImage() {
    var capture = document.getElementById('capture');
    html2canvas(capture).then(function(canvas) {
        var imgData = canvas.toDataURL("image/png");
        var year = calendar.view.currentStart.getFullYear();
        var month = pad(calendar.view.currentStart.getMonth() + 1);
        var link = document.createElement('a');
        var suffix = exportSuffix();
        var filename = year + '-' + month + '-' + abbreviation() + '--parkcalendar' + suffix + '.png';
        link.setAttribute('download', filename);
        link.setAttribute('href', imgData);
        var img = document.createElement('img');
        img.src = imgData;
        img.style.width = '820px';
        img.setAttribute('download', filename);
        link.appendChild(img);

        var info = document.createElement('h2');
        info.textContent = 'Tap or long press to save image ⤵️';

        var imgDiv = document.createElement('div');
        imgDiv.appendChild(info);
        imgDiv.appendChild(link);
        capture.parentNode.insertBefore(imgDiv, capture);
        capture.style.display = 'none';

        var topPrintEl = document.getElementById('topPrint');
        topPrintEl.style.display = 'none';

        var topResetEl = document.getElementById('topReset');
        var topResetHandler = function() {
            topPrintEl.style.display = '';
            capture.style.display = '';
            imgDiv.remove();
            exportReset();
            topResetEl.removeEventListener('click', topResetHandler);
        };
        topResetEl.addEventListener('click', topResetHandler);

        exportReady();
    });
}

function exportPrint() {
    var topPrintEl = document.getElementById('topPrint');
    var topPrintHandler = function() {
        window.print();
    };
    topPrintEl.addEventListener('click', topPrintHandler);

    var topResetEl = document.getElementById('topReset');
    var topResetHandler = function() {
        exportReset();
        topPrintEl.removeEventListener('click', topPrintHandler);
        topResetEl.removeEventListener('click', topResetHandler);
    };
    topResetEl.addEventListener('click', topResetHandler);
    exportReady();
}

function exportReset() {
    document.documentElement.classList = [];
    setupTheme();
    document.getElementById('calendar').style.display = 'none';
    setTimeout(function() {
        refresh("Reset Page");
    }, 500);
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

    var screenshot = document.getElementById('captureButton');
    if (screenshot) {
        screenshot.addEventListener('click', takeScreenshot);
    }

    var print = document.getElementById('printButton');
    if (print) {
        print.addEventListener('click', printCalendar);
    }
}

function doSubscribe() {
    var calUrl = 'webcal://jffmrk.github.io/sfmm/park/' + parkCalendar + '/hours.ics';
    document.location.assign(calUrl);
    navigator.clipboard.writeText(calUrl);
    setTimeout(function() {
        alert("WebCal URL copied to clipboard. Open your Calendar App to subscribe.\n\n" + calUrl);
    }, 750);
}

function calendarStart() {
    var year = calendar.view.currentStart.getFullYear();
    var month = pad(calendar.view.currentStart.getMonth() + 1);
    return year + "-" + month;
}

function setupCalendar() {
    var calendarEl = document.getElementById('calendar');

    if (!calendarEl) {
        return;
    }

    var headerToolbarOptions = {
        start: 'title',
        center: '',
        end: 'today prev,next'
    }
    if (document.documentElement.classList.contains('print')) {
        headerToolbarOptions = {
            start: '',
            center: 'title',
            end: ''
        }
    }

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        validRange: {
            start: '2021-12-01'
        },
        headerToolbar: headerToolbarOptions,
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

    var elements = document.getElementsByClassName('webcal-subscribe');
    Array.prototype.forEach.call(elements, function(e) {
        console.log("add event");
        e.addEventListener('click', doSubscribe);
    });
}

var pastEvents = {

    didFetch: [],

    getJsonFile: function(date) {
        var year = date.getFullYear();
        var mon = ("0" + (date.getMonth() + 1)).slice(-2);
        var jsonFile = year + "/" + year + "-" + mon + ".json";
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
        var jsonUrl = 'park/' + parkCalendar + '/archive/' + jsonFile + this.queryParams(date);
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
        start.setDate(1);
        this.doFetch(start);
        var end = new Date(fetchInfo.endStr);
        this.doFetch(end);
        success([]);
        setTimeout(function() {
            sessionStorage.setItem('currentStart', calendarStart());
        }, 750);
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
    if (calendarEl) {
        calendarEl.style.filter = 'opacity(0)';
    }
}

function setStatus(value) {
    var changeTimeEl = document.getElementById('lastChangeTime');
    if (changeTimeEl) {
        log('debug', "status: " + value);
        changeTimeEl.innerText = value;
    }
}

function refresh(reason) {

    setStatus(reason);

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

    var upcomingUrl = 'park/' + parkCalendar + '/hours.end.ics?t=' + btoa(lastFetch);

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

        var savedCurrentStart = sessionStorage.getItem('currentStart');
        if (savedCurrentStart) {
            calendar.gotoDate(savedCurrentStart);
        }
    }, 250);
}

function updateLastChangeTime() {
    setStatus(lastFetch);
}

var lastFocusCheck = 0;
var focusCheckTime = 15000;
var abortFetchTime = parseInt(focusCheckTime * 2 / 3);

function detectChange(onChange, onSuccess) {
    var cache = new Date().getTime();
    var url = 'park/' + parkCalendar + "/lastChange.txt?t=" + cache;

    const controller = new AbortController();
    const id = setTimeout(function() {
        log('warn', "• aborting - request timeout");
        controller.abort();
    }, abortFetchTime);
    const fetchOptions = {
        signal: controller.signal
    }

    fetch(url, fetchOptions)
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
        })
        .finally(() => {
            lastFocusCheck = 0;
            clearTimeout(id);
        });
}

function setupFocus() {
    detectChange();

    var lastFocus = new Date().getTime();
    lastFocusCheck = lastFocus;
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
        var now = new Date().getTime();
        var checkDiff = now - lastFocusCheck;
        if (checkDiff < focusCheckTime) {
            log('warn', "focus: duplicate, skipping");
            return;
        }
        lastFocusCheck = now;
        var diff = now - lastFocus;
        log('log', "focus: diff=" + diff);
        if (diff > focusCacheTime) {
            detectChange(onChange, reloadSuccess);
        } else if (diff > checkTime) {
            detectChange(onChange, updateLastFocus);
        }
    };

    window.addEventListener('focus', onFocus);
}

function selectPark(newPark) {
    localStorage.setItem('parkId', newPark);
    parkCalendar = newPark;
    var elements = document.getElementsByClassName('dynamic');
    Array.prototype.forEach.call(elements, function(e) {
        e.href = 'park/' + newPark + '/' + e.dataset.link;
    });
    document.getElementById('pageTitle').innerText = parkNames[parkCalendar].name;
    document.title = parkNames[parkCalendar].name + " • ParkCalendar.com";
}

function setupSelect() {
    var parkSelect = document.getElementById('parkid');
    parkSelect.addEventListener('change', function() {
        var newPark = parkSelect.value;
        if (newPark != parkCalendar) {
            selectPark(newPark);
            detectChange();
            refresh("New Park Selected");
        }
    });

    var len = parkSelect.options.length - 1;
    for (var i = len; i >= 0; i--) {
        parkSelect.remove(i);
    }
    parkNames = {};
    allParks.forEach(park => {
        parkNames[park.parkId] = {
            name: park.name,
            abbr: park.parkId
        };
        var option = document.createElement('option');
        option.text = park.name + " (" + park.city + ", " + park.state + ")";
        option.value = park.parkId;
        parkSelect.add(option);
    });

    var savedParkId = localStorage.getItem('parkId');
    if (savedParkId != null) {
        parkSelect.value = savedParkId;
        selectPark(savedParkId);
    } else {
        selectPark(parkSelect.value);
    }
}

function fetchAllParks(onFetch) {
    var url = 'park/sixflags.json';
    fetch(url)
        .then(response => {
            if (!response.ok) {
                log('warn', "No Park Data!");
                return Promise.reject("NoData");
            }
            return response.json();
        })
        .then(data => {
            console.info("Fetched Parks: • " + data.length);
            allParks = data;
            onFetch();
            console.info("Fetched Parks: DONE");
        })
        .catch(error => {
            if (error == "NoData") {
                return;
            }
            log('err', "ERR • Fetching Park Data");
        });
}

document.addEventListener('DOMContentLoaded', function() {
    var logDiv = document.getElementById('log');
    if (logDiv) {
        logDiv.style.display = 'none';
    }

    hideCalendar();

    setupTheme();
    setupFocus();
    fetchAllParks(function() {
        setupSelect();
        setupCalendar();
    });

    // Update calendar when printing
    // window.matchMedia('print').addEventListener('change', function(mql) {
    //     if (mql.matches) {
    //         if (!document.documentElement.classList.contains('print')) {
    //             setTimeout(function() {
    //                 alert("Please use Print Icon for better results");
    //             }, 500);
    //         }
    //     }
    // });
});
