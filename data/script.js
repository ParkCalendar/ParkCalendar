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

    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
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
        nextDayThreshold: '07:00:00'
    });

    setTimeout(function() {
        calendar.render();
    }, 250);
}

document.addEventListener('DOMContentLoaded', function() {

    setupTheme();
    setupCalendar();

});
