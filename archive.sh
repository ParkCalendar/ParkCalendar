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

TODAY=$(${DATECMD} +%Y%m%d)
HAS_ARCHIVE=0

for row in $(cat ${FILE})
do
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
        ARCHIVE_FILE=$(${DATECMD} +'%Y-%m' -d "${START}")
        echo "${START}" >> data/archive/${ARCHIVE_FILE}.txt
        echo "${END}" >> data/archive/${ARCHIVE_FILE}.txt
        git add data/archive/${ARCHIVE_FILE}.txt
        HAS_ARCHIVE=1
    fi

    START=""
done

## TODO: regenerate .json from .txt file

exit ${HAS_ARCHIVE}