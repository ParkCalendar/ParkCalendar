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

    var doFetch = (jsonFile, count) => {
        console.log("Loading: " + jsonFile);
        var eventSource = calendar.getEventSourceById('pastEvents');
        if (eventSource == null && count < 3) {
            setTimeout(function() {
                doFetch(jsonFile, count + 1);
            }, 750);
            return;
        }
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
                    calendar.addEvent(e, eventSource);
                });
            });
    };

    var pastEvents = (fetchInfo, success, failure) => {
        var start = new Date(fetchInfo.startStr);
        start.setDate(start.getDate() + 8);
        var year = start.getFullYear();
        var mon = ("0" + (start.getMonth() + 1)).slice(-2);
        var jsonFile = year + "-" + mon + ".json";
        doFetch(jsonFile, 0);
        success([]);
    };

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        // Upcoming (ICS)
        events: {
            url: 'https://jffmrk.github.io/sfmm/hours.end.ics?t=202301091824',
            format: 'ics'
        },
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
        id: 'pastEvents',
        events: pastEvents,
        display: 'block',
        backgroundColor: '#777777',
        borderColor: '#676767'
    });

    setTimeout(function() {
        calendar.render();
    }, 250);
}

document.addEventListener('DOMContentLoaded', function() {

    setupTheme();
    setupCalendar();

});
