#!/bin/bash

MONTH=10
YEAR=2022
MAXDAY=31
DAY=0
while [[ "${DAY}" != "31" ]]
do
    DAY=$(( DAY + 1 ))
    gdate "+%Y-%m-%dT10:30:00" -d "${YEAR}-${MONTH}-${DAY}"
    gdate "+%Y-%m-%dT17:00:00" -d "${YEAR}-${MONTH}-${DAY}"
done
