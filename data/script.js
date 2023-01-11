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

    var doFetch = (jsonFile) => {
        if (didFetch.includes(jsonFile)) {
            console.log("Skipping: " + jsonFile);
            return;
        }
        didFetch.push(jsonFile);
        console.log("Loading: " + jsonFile);
        var jsonUrl = "archive/" + jsonFile;
        fetch(jsonUrl)
            .then(response => {
                if (!response.ok) {
                    return [];
                }
                return response.json();
            })
            .then(data => {
                data.forEach(e => {
                    calendar.addEvent(e);
                });
            });
    };

    var isInTheFuture = (date) => {
        const today = new Date();
        return date > today;
    };

    var pastEvents = (fetchInfo, success, failure) => {
        var start = new Date(fetchInfo.startStr);
        if (isInTheFuture(start)) {
            return;
        }
        start.setDate(start.getDate() + 8);
        var year = start.getFullYear();
        var mon = ("0" + (start.getMonth() + 1)).slice(-2);
        var jsonFile = year + "-" + mon + ".json";
        doFetch(jsonFile);
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
        showNonCurrentDates: false,
        fixedWeekCount: false
    });

    calendar.addEventSource({
        id: 'future',
        url: 'https://jffmrk.github.io/sfmm/hours.end.ics?t=202301091824',
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
