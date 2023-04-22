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
        ARCHIVE_DIR=$(${DATECMD} +'archive/%Y' -d "${START}")
        mkdir -p "${ARCHIVE_DIR}"
        ARCHIVE_FILE=$(${DATECMD} +'%Y-%m' -d "${START}")
        echo "${START}" >> ${ARCHIVE_DIR}/${ARCHIVE_FILE}.txt
        echo "${END}" >> ${ARCHIVE_DIR}/${ARCHIVE_FILE}.txt
        git add ${ARCHIVE_DIR}/${ARCHIVE_FILE}.txt
        HAS_ARCHIVE=1
    fi

    START=""
done

if [[ "${HAS_ARCHIVE}" == "1" ]]
then
    "${BASE_SCRIPT}/archive-json.sh" ${ARCHIVE_DIR}/${ARCHIVE_FILE}.txt | jq > ${ARCHIVE_DIR}/${ARCHIVE_FILE}.json
    git add ${ARCHIVE_DIR}/${ARCHIVE_FILE}.json
fi

exit ${HAS_ARCHIVE}