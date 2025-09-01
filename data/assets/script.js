var calendar;
var lastFetch = new Date().toJSON();
var lastToggle = new Date().getTime();
var rapidToggleCount = 0;
var allParks = [];
var parkCalendar = null;
var allAbbreviations = {};

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
    if (allAbbreviations[parkCalendar] != null) {
        return allAbbreviations[parkCalendar].toLowerCase();
    }
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
    document.getElementById('printDate').innerHTML = "Last change " + lastFetch + "<br>Exported on " + dateStr + " @ " + timeStr;
    document.getElementById('directLink').href = 'https://parkcalendar.com/#' + parkCalendar;
    document.getElementById('directLink').innerText = 'ParkCalendar.com#' + parkCalendar;
    if (exportType == "screenshot") {
        exportImage();
    } else {
        exportPrint();
    }
}

function exportReady() {
    document.documentElement.classList.remove('preparing');
}

function exportImage() {
    //TODO: base64 to File - https://stackoverflow.com/a/38935990
    //TODO: share api: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
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
    document.getElementById('directLink').href = 'https://parkcalendar.com/';
    document.getElementById('directLink').innerText = 'ParkCalendar.com';
    setupTheme();
    document.getElementById('calendar').style.display = 'none';
    setTimeout(function() {
        refresh("Reset Page");
        updateHash();
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
    var calUrl = 'webcal://parkcalendar.com/park/' + parkCalendar + '/hours.ics';
    document.location.assign(calUrl);
    navigator.clipboard.writeText(calUrl);
    setTimeout(function() {
        alert("WebCal URL copied to clipboard. Open your Calendar App to subscribe.\n\n" + calUrl);
    }, 750);
}

function doShare() {
    var shareUrl = 'https://parkcalendar.com/#' + parkCalendar
    var currentStart = sessionStorage.getItem('currentStart');
    var today = new Date();
    if (currentStart && currentStart != yearMonth(today)) {
        shareUrl += ',' + currentStart;
    }
    navigator.clipboard.writeText(shareUrl);
    setTimeout(function() {
        alert("URL copied to clipboard. Paste to share.\n\n" + shareUrl);
    }, 250);
}

function setupLinks() {
    var addToCalendar = document.getElementById('addToCalendar');
    addToCalendar.addEventListener('click', doSubscribe);

    var shareCalendar = document.getElementById('shareCalendar');
    shareCalendar.addEventListener('click', doShare);
}

function calendarStart() {
    return yearMonth(calendar.view.currentStart);
}

function yearMonth(date) {
    var year = date.getFullYear();
    var month = pad(date.getMonth() + 1);
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
}

var pastEvents = {

    didFetch: [],

    getJsonFile: function(date) {
        var year = date.getFullYear();
        var file = yearMonth(date);
        var jsonFile = year + "/" + file + ".json";
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
        var isFirst = this.didFetch.length == 0;
        log('debug', "Request: " + fetchInfo.startStr + " -> " + fetchInfo.endStr);
        var start = new Date(fetchInfo.startStr);
        this.doFetch(start);
        start.setDate(start.getDate() + 8);
        start.setDate(1);
        if (!isFirst) {
            var currentCalendarView = yearMonth(start);
            sessionStorage.setItem('currentStart', currentCalendarView);
            updateHash();
        }
        this.doFetch(start);
        var end = new Date(fetchInfo.endStr);
        this.doFetch(end);
        success([]);
    },

    reset: function() {
        this.didFetch = [];
    }
};

function fadeIn(el, onComplete) {
    fade(el, true, 10, onComplete);
}

function fadeOut(el, onComplete) {
    fade(el, false, 10, onComplete);
}

function fade(el, increase, delay, onComplete) {
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
            if (typeof onComplete === "function") {
                onComplete();
            }
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

        var savedCurrentStart = sessionStorage.getItem('currentStart');
        if (savedCurrentStart) {
            calendar.gotoDate(savedCurrentStart);
        }

        setStatus(lastFetch);
    }, 250);
}

function fetchAbbreviation() {
    if (parkCalendar == null) {
        return;
    }

    if (allAbbreviations[parkCalendar] != null) {
        return;
    }

    var cache = new Date().getTime();
    var url = 'park/' + parkCalendar + "/abbreviation.txt?t=" + cache;
    log('debug', url);

    const controller = new AbortController();
    const id = setTimeout(function() {
        log('warn', "• abbreviation.txt - request timeout");
        controller.abort();
    }, abortFetchTime);
    const fetchOptions = {
        signal: controller.signal
    }

    fetch(url, fetchOptions)
        .then(response => {
            if (!response.ok) {
                log('warn', "abbreviation.txt • no data");
                return Promise.reject("NoData");
            }
            return response.text();
        })
        .then(text => {
            allAbbreviations[parkCalendar] = text;
            log('log', "• abbreviation " + text);
        })
        .catch(error => {
            if (error == "NoData") {
                return;
            }
            log('err', "abbreviation.txt • ERR");
        })
        .finally(() => {
            lastFocusCheck = 0;
            clearTimeout(id);
        });
}

var lastFocusCheck = 0;
var focusCheckTime = 15000;
var abortFetchTime = parseInt(focusCheckTime * 2 / 3);

function detectChange(onChange, onSuccess) {
    if (parkCalendar == null) {
        return;
    }

    var cache = new Date().getTime();
    var url = 'park/' + parkCalendar + "/lastChange.txt?t=" + cache;
    log('debug', url);

    const controller = new AbortController();
    const id = setTimeout(function() {
        log('warn', "• aborting - request timeout");
        controller.abort();
    }, abortFetchTime);
    const fetchOptions = {
        signal: controller.signal
    }

    fetchAbbreviation();

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
                setStatus(lastFetch);
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

function getHashData() {
    var hash = window.location.hash;
    var obj = {
        parkId: null,
        currentStart: null
    };
    if (hash == null || hash.trim().length == 0) {
        return obj;
    }
    var arr = hash.trim();
    if (arr.startsWith('#')) {
        arr = arr.substring(1);
    }
    arr = arr.split(',');
    if (arr.length < 1 || arr.length > 2) {
        return obj;
    }

    // Extract park id
    var parkId = parseInt(arr[0]);
    if (parkId > 0) {
        obj.parkId = arr[0];
    }

    // Extract current start
    if (arr.length > 1) {
        var start = arr[1];
        var found = start.match(/\d{4}-\d{2}/);
        if (found != null) {
            obj.currentStart = found;
        }
    }

    console.log(JSON.stringify(obj));
    return obj;
}

function updateHash() {
    var newHash = parkCalendar;
    var currentStart = sessionStorage.getItem('currentStart');
    var today = new Date();
    if (currentStart && currentStart != yearMonth(today)) {
        newHash = newHash + ',' + currentStart;
    }
    window.location.hash = newHash;
}

function selectPark(newPark) {
    log('log', "selectPark " + newPark);
    parkCalendar = newPark;

    var lastSelectedPark = document.querySelector('.parks .selected');
    if (lastSelectedPark) {
        lastSelectedPark.classList.remove('selected');
    }
    var newlySelectedPark = document.getElementById('park-' + newPark);
    if (newlySelectedPark) {
        newlySelectedPark.classList.add('selected');
    }

    setStatus("New Park Selected");
    var onFetch = function() {
        refresh("Loading...");
    };
    detectChange(onFetch, onFetch);

    var elements = document.getElementsByClassName('park-links');
    Array.prototype.forEach.call(elements, function(e) {
        e.classList = 'park-links hidden';
    });
    var selectedEl = document.getElementById('park-links-' + newPark);
    if (selectedEl) {
        selectedEl.classList.remove('hidden');
    }
    
    localStorage.setItem('parkId', newPark);
    updateHash();
    var elements = document.getElementsByClassName('dynamic');
    Array.prototype.forEach.call(elements, function(e) {
        e.href = 'park/' + newPark + '/' + e.dataset.link;
    });
    document.getElementById('pageTitle').innerText = parkNames[parkCalendar].name;
    document.title = parkNames[parkCalendar].name + " • ParkCalendar.com";
}

function toggleLocationSelector() {
    var parkSelectWrapper = document.getElementById('parkSelectWrapper');
    var cover = document.getElementById('cover');
    var show = parkSelectWrapper.style.display == '';

    if (show) {
        parkSelectWrapper.style.filter = 'opacity(0)';
        cover.style.filter = 'opacity(0)';
        parkSelectWrapper.style.display = 'flex';
        cover.style.display = 'block';
        fadeIn(parkSelectWrapper);
        fadeIn(cover);

        var selectedPark = document.getElementById('park-' + parkCalendar);
        var offset = selectedPark.offsetTop;
        var height = selectedPark.offsetHeight;

        document.getElementById('parkSelectContent').scrollTop = offset - (height * 1.5);
    } else {
        fadeOut(parkSelectWrapper, function() {
            parkSelectWrapper.style.display = '';
        });
        fadeOut(cover, function() {
            cover.style.display = '';
        });
    }
}

function setupSelect() {

    var parkSelectContent = document.getElementById('parkSelectContent');
    var lastState = '';

    var cover = document.getElementById('cover');
    cover.addEventListener('click', toggleLocationSelector);

    var toggleButton = document.getElementById('location');
    toggleButton.addEventListener('click', toggleLocationSelector);

    var closeButton = document.getElementById('parkSelectClose');
    closeButton.addEventListener('click', toggleLocationSelector);

    parkNames = {};
    allParks.forEach(park => {
        parkNames[park.parkId] = {
            name: park.name,
            abbr: park.parkId
        };

        if (lastState != park.state) {
            lastState = park.state;
            var state = document.createElement('div');
            state.classList = 'state';
            state.innerText = lastState;
            parkSelectContent.appendChild(state);
        }

        var sel = document.createElement('a');
        sel.id = 'park-' + park.parkId;
        sel.classList = 'button';
        sel.href = '#' + park.parkId;
        sel.innerHTML = park.name + '<br><span class="small">' + park.city + ', ' + park.state + '</span>';
        sel.addEventListener('click', function() {
            selectPark(park.parkId);
            toggleLocationSelector();
        });
        parkSelectContent.appendChild(sel);

    });

    var hashObj = getHashData();
    if (hashObj.parkId != null) {
        if (parkNames[hashObj.parkId] == null) {
            hashObj.parkId = null;
        }
    }
    if (hashObj.parkId == null) {
        hashObj.parkId = localStorage.getItem('parkId');
        if (parkNames[hashObj.parkId] == null) {
            hashObj.parkId = null;
        }
    }

    // Default to Magic Mountain
    if (hashObj.parkId == null) {
        hashObj.parkId = 6;
    }

    if (hashObj.currentStart != null) {
        sessionStorage.setItem('currentStart', hashObj.currentStart);
    }

    selectPark(hashObj.parkId);

    window.history.replaceState(null, document.title, "/");
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
        setupLinks();
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
