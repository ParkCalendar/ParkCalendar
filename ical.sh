#!/bin/zsh

if [[ "$1" == "" ]]
then
    exit
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
        START=${R}
        continue
    fi

    END=${R}
    CLOSE=$(date -jf '%Y%m%dT%H%M%S' +'%I:%M' "${END}")

    cat <<__STOP
BEGIN:VEVENT
UID:${START}@sixflags.com
DTSTAMP:${START}
DTSTART:${START}
DTEND:${END}
SUMMARY:"- ${CLOSE}p"
END:VEVENT
__STOP

    START=""
done

cat <<__STOP
END:VCALENDAR
__STOP
