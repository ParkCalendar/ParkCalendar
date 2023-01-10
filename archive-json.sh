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

for row in $(cat ${FILE})
do
    R=${row}
    if [[ "${START}" == "" ]]
    then
        START=${R}
        continue
    fi

    END=${R}

    CLOSE=$(${DATECMD} +"%I:%M%p" -d "${END}" | sed 's/AM/a/' | sed 's/PM/p/' )

    if [[ "${COUNT}" != "0" ]]
    then
        echo ","
    fi
    COUNT=$(( COUNT + 1 ))

    cat <<__STOP
{
    "title": "- ${CLOSE}",
    "start": "${START}",
    "end": "${END}"
}
__STOP

    START=""
done

echo "]"
