#!/bin/bash
##
## Fetch the current SixFlags Hours
##

cd "$(dirname "$0")"

export TZ=America/Los_Angeles

SUMMARY="|"
addToSummary () {
    SUMMARY="${SUMMARY} $1 |"
}

PARK_ID=6
DATA_DIR=data/park/${PARK_ID}
DATA_COMMON=data/park/common

PARK_NAME=$(cat ${DATA_DIR}/current.json | jq -r .name)
PARK_ABBREVIATION=$(cat ${DATA_DIR}/current.json | jq -r .abbreviation)
echo "Park Name: ${PARK_NAME}"
echo "Abbreviation: ${PARK_ABBREVIATION}"

addToSummary "[${PARK_NAME}](https://parkcalendar.com#${PARK_ID})"
addToSummary "x"
addToSummary "x"

CHANGE_ID=20230417-185013
CHANGE_FILE=${DATA_DIR}/changelog/2023/diff.20230417-185013.txt
LASTCHANGE=$(date "+%a %b %d %Y @ %I:%M %p")
CHANGE_LINES=$(( 0 + $(cat ${CHANGE_FILE} | wc -l) ))
CHANGE_TOP=$(head -4 ${CHANGE_FILE})
CHANGE_TOP_MORE=""
LINK="[${PARK_NAME}](https://parkcalendar.com/#${PARK_ID})"
CHANGELINK="[Changes on ${LASTCHANGE}](https://parkcalendar.com/park/${PARK_ID}/changelog.html?id=${CHANGE_ID})"
if (( CHANGE_LINES > 4 ))
then
    CHANGELINK="${CHANGELINK} - tap for full list of changes"
    CHANGE_TOP_MORE="..."
fi
CHANGE_TOP=$(echo "${CHANGE_TOP}" | jq -R -s '.' | sed 's/"//g')

if [[ "${DISCORD_WEBHOOK_URL}" != "" ]]
then
    CONTENT=$(echo "${LINK}\n🔸 ${CHANGELINK}\n\`\`\`${CHANGE_TOP}${CHANGE_TOP_MORE}\`\`\`\n---")
    read -r -d '' DISCORD_MESSAGE << EOM
{
    "content": "${CONTENT}"
}
EOM
    echo "Content:"
    echo ${CONTENT}
    echo "Notify Discord - ${PARK_ID} - ${PARK_NAME}"
    curl -X POST -H 'Content-type: application/json' --data "${DISCORD_MESSAGE}" ${DISCORD_WEBHOOK_URL}
fi

echo "${SUMMARY}"

if [[ "${GITHUB_STEP_SUMMARY}" != "" ]]
then
    echo "${SUMMARY}" >> ${GITHUB_STEP_SUMMARY}
fi
