#!/bin/bash

if [[ "$1" == "" ]]
then
    exit
fi

OS=$(uname)
if [[ "${OS}" == "Darwin" ]]
then
    DATECMD=gdate
else
    DATECMD=date
fi

FILE=$1

START=""
END=""

cat <<__STOP
BEGIN:VCALENDAR
PRODID:Six Flags Magic Mountain Hours
VERSION:2.0
CALSCALE:GREGORIAN
__STOP

for row in $(cat ${FILE} | jq -r '.operatingHours[] | .open, .close')
do
    # R=$(echo "${row}" | sed 's/-//g' | sed 's/://g')
    R=${row}
    if [[ "${START}" == "" ]]
    then
        START=${R}
        continue
    fi

    END=${R}

    OPEN=$(${DATECMD} +"%I:%M%p" -d "${START}" | sed 's/AM/a/' | sed 's/PM/p/' )
    CLOSE=$(${DATECMD} +"%I:%M%p" -d "${END}" | sed 's/AM/a/' | sed 's/PM/p/' )

    cat <<__STOP
BEGIN:VEVENT
UID:${START}@sixflags.com
DTSTAMP:${START}
DTSTART:${START}
DTEND:${END}
SUMMARY:- ${CLOSE}
END:VEVENT
__STOP

    START=""
done

cat <<__STOP
END:VCALENDAR
__STOP
