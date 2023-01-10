#!/bin/bash
##
## Extract upcoming dates
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
MAX=5
COUNT=0

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
        START=""
        continue
    fi

    echo ${START}
    echo ${END}

    COUNT=$(( COUNT + 1 ))
    if [[ "${COUNT}" == "${MAX}" ]]
    then
        break
    fi

    START=""
done