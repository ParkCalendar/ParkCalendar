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
    R=$(echo "${row}" | sed 's/-//g' | sed 's/://g')
    if [[ "${START}" == "" ]]
    then
        START=${row}
        START_VCAL=${R}
        continue
    fi

    END=${row}
    END_VCAL=${R}

    OPEN=$(${DATECMD} +"%I:%M%p" -d "${START}" | sed 's/AM/a/' | sed 's/PM/p/' )
    CLOSE=$(${DATECMD} +"%I:%M%p" -d "${END}" | sed 's/AM/a/' | sed 's/PM/p/' )

    cat <<__STOP
BEGIN:VEVENT
UID:${START_VCAL}@sixflags.com
DTSTAMP:${START_VCAL}
DTSTART:${START_VCAL}
DTEND:${END_VCAL}
SUMMARY:- ${CLOSE}
END:VEVENT
__STOP

    START=""
    START_VCAL=""
done

cat <<__STOP
END:VCALENDAR
__STOP
