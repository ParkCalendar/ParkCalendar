#!/bin/bash
##
## Add a closure
##

PARK_ID=6
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
REASON=$1
if [[ "${REASON}" == "commit" ]]
then
    SHOULD_COMMIT=1
    REASON=$2
fi

if [[ "${REASON}" == "" ]]
then
    REASON="Rain Closure"
fi

FILE=$(${DATECMD} +'%Y-%m')

FILE_TXT="${DATA_DIR}/archive/${FILE}.txt"
FILE_JSON="${DATA_DIR}/archive/${FILE}.json"

START=$(${DATECMD} +'%Y-%m-%dT10:30:00')
CLOSED="⛔️ ${REASON}"

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

