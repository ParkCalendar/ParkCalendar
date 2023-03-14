#!/bin/bash
##
## Archive past upcoming times
##

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

if [[ ! -f "${FILE}" ]]
then
    echo "archive.sh> File not found: ${FILE}"
    exit 9
fi

COUNT=0

echo "["

while read -r row
do
    R=${row}
    if [[ "${START}" == "" ]]
    then
        START=${R}
        continue
    fi

    END=${R}
    CLOSURE=0
    if [[ ${END} == "⛔️"* || ${END} == "☔️"* ]]
    then
        TITLE=${END}
        START=$(${DATECMD} +"%Y-%m-%d" -d "${START}")
        CLOSURE=1
    else
        CLOSE=$(${DATECMD} +"%I:%M%p" -d "${END}" | sed 's/AM/a/' | sed 's/PM/p/' )
        TITLE="- ${CLOSE}"
    fi

    if [[ "${COUNT}" != "0" ]]
    then
        echo ","
    fi
    COUNT=$(( COUNT + 1 ))

    if [[ "${CLOSURE}" == "0" ]]
    then

        cat <<__STOP
{
    "title": "${TITLE}",
    "start": "${START}",
    "end": "${END}"
}
__STOP

    else

        cat <<__STOP
{
    "title": "${TITLE}",
    "start": "${START}",
    "allday": "true"
}
__STOP

    fi

    START=""

done < "${FILE}"

echo "]"
