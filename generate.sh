#!/bin/bash

MONTH=$2
YEAR=$1
MAXDAY=31
DAY=0
while [[ "${DAY}" != "31" ]]
do
    DAY=$(( DAY + 1 ))
    gdate "+%Y-%m-%dT10:30:00" -d "${YEAR}-${MONTH}-${DAY}"
    gdate "+%Y-%m-%dT17:00:00" -d "${YEAR}-${MONTH}-${DAY}"
done
