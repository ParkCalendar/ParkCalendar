# SixFlags Magic Mountain Park Hours

Generate an ICS calendar file from the SixFlags API. This is the same data used by the official SixFlags apps.
The reasoning for this project is the park web calendar is often not showing the same data as the app. The app
display is only 1 week at a time and I wanted to visually see each month operating hours.

Hope this is useful to you. Feel free to open an issue or suggest an improvement.

Park Hours (Six Flags Website)
* https://www.sixflags.com/magicmountain/plan-your-visit/park-hours

GitHub Page:
* https://jffmrk.github.io/sfmm/

The API is checked once per day. If a change is detected a new `.ics` file will be generated, committed, and the the GitHub Page will be republished.


## Resources

List of APIs used by the SixFlags App:
* https://github.com/ThemeParks/parksapi/blob/main/lib/parks/sixflags/sixflags.js
