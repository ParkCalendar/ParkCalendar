#!/bin/bash
##
## Add a closure
##

PARK_ID=$1
if [[ "${PARK_ID}" == "" ]]
then
    echo "USAGE: ./closed.sh <park_id> [commit [reason]]"
    exit 9
fi

DATA_DIR="data/park/${PARK_ID}"

export TZ=America/Los_Angeles
OS=$(uname)
if [[ "${OS}" == "Darwin" ]]
then
    DATECMD=gdate
else
    DATECMD=date
fi

SHOULD_COMMIT=0
REASON=$2
if [[ "${REASON}" == "commit" ]]
then
    SHOULD_COMMIT=1
    REASON=$3
fi

if [[ "${REASON}" == "" ]]
then
    REASON="Rain Closure"
fi

FILE_DIR="${DATA_DIR}/archive/$(${DATECMD} +'%Y')"
FILE=$(${DATECMD} +'%Y-%m')

FILE_TXT="${FILE_DIR}/${FILE}.txt"
FILE_JSON="${FILE_DIR}/${FILE}.json"

START=$(${DATECMD} +'%Y-%m-%dT10:30:00')
CLOSED="⛔️ ${REASON}"
## CLOSED="☔️ Closed Early"

echo $START >> $FILE_TXT
echo $CLOSED >> $FILE_TXT

./archive-json.sh ${FILE_TXT} | jq > ${FILE_JSON}

if [[ "${SHOULD_COMMIT}" == "1" ]]
then
    DATE_CLOSED=$(${DATECMD} +'%Y-%m-%d')
    git add ${FILE_TXT}
    git add ${FILE_JSON}
    git commit -m "${CLOSED} -- ${DATE_CLOSED}"
    git push
else
    echo "•• commit skipped ••"
fi

