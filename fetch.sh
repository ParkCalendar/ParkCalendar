#!/bin/bash
##
## Fetch the current SixFlags Hours
##

cd "$(dirname "$0")"

./api-hours.sh > data/current.json

FILE=$1
TODAY=$(date +%Y%m%d)

for row in $(cat ${FILE} | jq -r '.operatingHours[] | .open, .close')
do
    R=$(echo "${row}" | sed 's/-//g' | sed 's/://g')
    if [[ "${START}" == "" ]]
    then
        START=${R}
        continue
    fi

    END=${R}

    DAY=$(date -jf '%Y%m%dT%H%M%S' +'%Y%m%d' "${END}")
    if [[ "${DAY}" < "${TODAY}" ]]
    then
        continue
    fi

    OPEN=$(date -jf '%Y%m%dT%H%M%S' +'%I:%M%p' "${START}" | sed 's/AM/a/' | sed 's/PM/p/' )
    CLOSE=$(date -jf '%Y%m%dT%H%M%S' +'%I:%M%p' "${END}" | sed 's/AM/a/' | sed 's/PM/p/' )

    echo "${DAY} -- ${OPEN} - ${CLOSE}"

    START=""
done
