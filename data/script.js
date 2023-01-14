function setTheme(theme) {
    document.querySelector('button.themeToggle i').classList = [theme];
    if (theme == 'system') {
        document.documentElement.classList = [];
        localStorage.removeItem('theme');
    } else {
        document.documentElement.classList = [theme];
        localStorage.setItem('theme', theme);
    }
}

function toggleTheme() {
    var toggleButton = document.querySelector('button.themeToggle i');
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

    var toggleButton = document.querySelector('button.themeToggle');
    if (toggleButton) {
        toggleButton.addEventListener('click', toggleTheme);
    }
}

function setupCalendar() {
    var calendarEl = document.getElementById('calendar');

    if (!calendarEl) {
        return;
    }

    var didFetch = [];

    var getJsonFile = (date) => {
        var year = date.getFullYear();
        var mon = ("0" + (date.getMonth() + 1)).slice(-2);
        var jsonFile = year + "-" + mon + ".json";
        return jsonFile;
    };

    var isInTheFuture = (date) => {
        const today = new Date();
        return date > today;
    };

    var doFetch = (date) => {
        var jsonFile = getJsonFile(date);
        if (isInTheFuture(date)) {
            console.debug(jsonFile + " • Skip:Future");
            return;
        }
        if (didFetch.includes(jsonFile)) {
            console.debug(jsonFile + " • Skip:Fetched");
            return;
        }
        didFetch.push(jsonFile);
        console.debug(jsonFile + " • loading");
        var jsonUrl = "archive/" + jsonFile;
        fetch(jsonUrl)
            .then(response => {
                if (!response.ok) {
                    console.warn(jsonFile + " • no data");
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
                console.error("ERR • Retry: " + jsonFile);
                const index = didFetch.indexOf(jsonFile);
                if (index > -1) {
                    didFetch.splice(index, 1);
                }
            });
    };

    var pastEvents = (fetchInfo, success, failure) => {
        console.debug("Request: " + fetchInfo.startStr + " -> " + fetchInfo.endStr);
        var start = new Date(fetchInfo.startStr);
        doFetch(start);
        start.setDate(start.getDate() + 8);
        doFetch(start);
        var end = new Date(fetchInfo.endStr);
        doFetch(end);
        success([]);
    };

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

    calendar.addEventSource({
        id: 'future',
        url: 'https://jffmrk.github.io/sfmm/hours.end.ics?t=202301140842',
        format: 'ics'
    });

    calendar.addEventSource({
        id: 'pastEvents',
        events: pastEvents
    });

    setTimeout(function() {
        calendar.render();
    }, 250);
}

document.addEventListener('DOMContentLoaded', function() {

    setupTheme();
    setupCalendar();

});
