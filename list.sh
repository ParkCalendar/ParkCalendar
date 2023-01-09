#!/bin/bash
##
## List the current SixFlags Hours
##

if [[ "$1" == "" ]]
then
    exit
fi

ARCHIVE=0
if [[ "$2" == "archive" ]]
then
    ARCHIVE=1
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

TODAY=$(${DATECMD} +%Y%m%d)

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

    DAY=$(${DATECMD} +'%Y%m%d' -d "${START}")
    if [[ "${DAY}" < "${TODAY}" ]]
    then
        if [[ "${ARCHIVE}" == "1" ]]
        then
            echo "${START}" > data/archive/${DAY}.txt
            echo "${END}" >> data/archive/${DAY}.txt
            git add data/archive/${DAY}.txt
        fi
        START=""
        continue
    fi

    OPEN=$(${DATECMD} +"%I:%M%p" -d "${START}" | sed 's/AM/a/' | sed 's/PM/p/' )
    CLOSE=$(${DATECMD} +"%I:%M%p" -d "${END}" | sed 's/AM/a/' | sed 's/PM/p/' )

    echo "${DAY} -- ${OPEN} - ${CLOSE}"

    START=""
done
