#!/bin/bash

MONTH=$2
YEAR=$1
END=$3
if [[ "${END}" == "" ]]
then
    END=17
fi
MAXDAY=31
DAY=0
while [[ "${DAY}" != "31" ]]
do
    DAY=$(( DAY + 1 ))
    gdate "+%Y-%m-%dT10:30:00" -d "${YEAR}-${MONTH}-${DAY}"
    gdate "+%Y-%m-%dT${END}:00:00" -d "${YEAR}-${MONTH}-${DAY}"
done
