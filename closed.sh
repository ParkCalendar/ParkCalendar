#!/bin/bash
##
## Add a closure
##

export TZ=America/Los_Angeles
OS=$(uname)
if [[ "${OS}" == "Darwin" ]]
then
    DATECMD=gdate
else
    DATECMD=date
fi

REASON=$1
if [[ "${REASON}" == "" ]]
then
    REASON="Rain Closure"
fi

FILE=$(${DATECMD} +'%Y-%m')

FILE_TXT="data/archive/${FILE}.txt"
FILE_JSON="data/archive/${FILE}.json"

START=$(${DATECMD} +'%Y-%m-%dT10:30:00')
CLOSED="⛔️ ${REASON}"

echo $START >> $FILE_TXT
echo $CLOSED >> $FILE_TXT

./archive-json.sh ${FILE_TXT} | jq > ${FILE_JSON}
