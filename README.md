
# SixFlags Park Hours

A couple reasons for this project:

* Generate an ICS calendar subscription file.
* View the park hours in a compact month view.

The park hours are generated directly from the SixFlags API (see below). A GitHub action runs daily to fetch and update the park hours and publish the GitHub Page.

Hope this is useful to you. Feel free to open an issue or suggest an improvement.

## View the Calendar

View this page to see upcoming & past hours, subscribe to the .ics calendar feed, save a screenshot, or print out a calendar.

[ParkCalendar.com](https://parkcalendar.com)

## Track Changes

View the [last fetch summary](LAST_FETCH.md) to see what has recently changed.

Join the [Discord Server](https://parkcalendar.com/links/#discord) to see the changes posted as they are detected.


## Resources

Park Hours (Six Flags Website)
* https://www.sixflags.com/magicmountain/plan-your-visit/park-hours

Queue Times
* https://queue-times.com/parks/32/queue_times

FullCalendar.io
* https://fullcalendar.io

List of APIs used by the SixFlags App
* https://github.com/ThemeParks/parksapi/blob/main/lib/parks/sixflags/sixflags.js
