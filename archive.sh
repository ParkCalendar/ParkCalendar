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

cd "$(dirname "$0")"
BASE_SCRIPT=$(pwd)

cd "$(dirname "${FILE}")"
BASE_FILE="$(basename "${FILE}")"

TODAY=$(${DATECMD} +%Y%m%d)
HAS_ARCHIVE=0

for row in $(cat ${BASE_FILE})
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
        echo "${START}" >> archive/${ARCHIVE_FILE}.txt
        echo "${END}" >> archive/${ARCHIVE_FILE}.txt
        git add archive/${ARCHIVE_FILE}.txt
        HAS_ARCHIVE=1
    fi

    START=""
done

if [[ "${HAS_ARCHIVE}" == "1" ]]
then
    "${BASE_SCRIPT}/archive-json.sh" archive/${ARCHIVE_FILE}.txt | jq > archive/${ARCHIVE_FILE}.json
    git add archive/${ARCHIVE_FILE}.json
fi

exit ${HAS_ARCHIVE}