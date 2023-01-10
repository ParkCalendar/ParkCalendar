#!/bin/bash

if [[ "$1" == "" ]]
then
    exit
fi

export TZ=America/Los_Angeles

OS=$(uname)
if [[ "${OS}" == "Darwin" ]]
then
    DATECMD=gdate
else
    DATECMD=date
fi

FILE=$1

USE_END_DATE=0
if [[ "$2" == "end" ]]
then
    USE_END_DATE=1
fi

USE_ARCHIVE=0
PRODID="SixFlags Magic Mountain Park Hours"
CALNAME="SixFlags Magic Mountain - Upcoming"
if [[ "$3" == "archive" ]]
then
    USE_ARCHIVE=1
    PRODID="SixFlags Magic Mountain Park Hours - Archive"
    CALNAME="SixFlags Magic Mountain - Archive"
fi

START=""
END=""

cat <<__STOP
BEGIN:VCALENDAR
PRODID:${PRODID}
X-WR-CALNAME:${CALNAME}
X-PUBLISHED-TTL:P1D
X-WR-TIMEZONE:America/Los_Angeles
VERSION:2.0
CALSCALE:GREGORIAN
__STOP

TODAY=$(${DATECMD} +%Y%m%d)

if [[ "${USE_ARCHIVE}" == "0" ]]
then
    OUT_TIMES=$(cat ${FILE} | jq -r '.operatingHours[] | .open, .close')
else
    OUT_TIMES=$(cat ${FILE})
fi

for row in ${OUT_TIMES}
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

    DAY=$(${DATECMD} +'%Y%m%d' -d "${START}")
    IN_PAST=0
    if [[ "${DAY}" < "${TODAY}" ]]
    then
        IN_PAST=1
    fi
    if [[ "${IN_PAST}" != "${USE_ARCHIVE}" ]]
    then
        START=""
        START_VCAL=""
        continue
    fi

    OPEN=$(${DATECMD} +"%I:%M%p" -d "${START}" | sed 's/AM/a/' | sed 's/PM/p/' )
    CLOSE=$(${DATECMD} +"%I:%M%p" -d "${END}" | sed 's/AM/a/' | sed 's/PM/p/' )

    SUMMARY="Magic Mountain"
    if [[ "${USE_END_DATE}" == "1" ]]
    then
        SUMMARY="- ${CLOSE}"
    fi

    cat <<__STOP
BEGIN:VEVENT
UID:${START_VCAL}@sixflags.com
DTSTAMP:${START_VCAL}
DTSTART:${START_VCAL}
DTEND:${END_VCAL}
SUMMARY:${SUMMARY}
END:VEVENT
__STOP

    START=""
    START_VCAL=""
done

cat <<__STOP
END:VCALENDAR
__STOP
