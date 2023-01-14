# SixFlags Magic Mountain Park Hours

A couple reasons for this project:

* Generate an ICS calendar subscription file.
* View the park hours in a compact month view.

The park hours are generated directly from the SixFlags API (see below). A GitHub action runs daily to fetch and update the park hours and publish the GitHub Page.

Hope this is useful to you. Feel free to open an issue or suggest an improvement.

## GitHub Page

View the published page to see upcoming & past hours or subscribe to the .ics calendar feed:

https://jffmrk.github.io/sfmm/


## Resources

Park Hours (Six Flags Website)
* https://www.sixflags.com/magicmountain/plan-your-visit/park-hours

Queue Times
* https://queue-times.com/parks/32/queue_times

FullCalendar.io
* https://fullcalendar.io

List of APIs used by the SixFlags App
* https://github.com/ThemeParks/parksapi/blob/main/lib/parks/sixflags/sixflags.js
