#!/bin/bash
##
## List the current SixFlags Hours
##

if [[ "$1" == "" ]]
then
    exit
fi

OS=$(uname)
if [[ "${OS}" == "Darwin" ]]
then
    DATECMD=gdate
else
    DATECMD=date
fi

FILE=$1

TODAY=$(${DATECMD} +%Y%m%d)

for row in $(cat ${FILE} | jq -r '.operatingHours[] | .open, .close')
do
    # R=$(echo "${row}" | sed 's/-//g' | sed 's/://g')
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
        START=""
        continue
    fi

    OPEN=$(${DATECMD} +"%I:%M%p" -d "${START}" | sed 's/AM/a/' | sed 's/PM/p/' )
    CLOSE=$(${DATECMD} +"%I:%M%p" -d "${END}" | sed 's/AM/a/' | sed 's/PM/p/' )

    echo "${DAY} -- ${OPEN} - ${CLOSE}"

    START=""
done
