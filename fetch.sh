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

SHOULD_COMMIT=0
FORCE_UPDATE=0
ICS_UPDATE=0
PARK_ID=$3
if [[ "$1" == "commit" ]]
then
    SHOULD_COMMIT=1
fi
if [[ "$2" == "force" ]]
then
    FORCE_UPDATE=1
fi
if [[ "$PARK_ID" == "" ]]
then
    PARK_ID=6
fi
DATA_DIR=data/park/${PARK_ID}
DATA_COMMON=data/park/common
mkdir -p "${DATA_DIR}"

##
## Fetch current times from the API
##
echo "Fetch new json..."
./api-hours.sh ${PARK_ID} | jq > ${DATA_DIR}/current.json
echo "Parse new json (all)..."
./list.sh ${DATA_DIR}/current.json > ${DATA_DIR}/current.txt
echo "Parse new json (upcoming)..."
./upcoming.sh ${DATA_DIR}/current.json > ${DATA_DIR}/current.upcoming.txt

PARK_NAME=$(cat ${DATA_DIR}/current.json | jq -r .name)
PARK_ABBREVIATION=$(cat ${DATA_DIR}/current.json | jq -r .abbreviation)
echo "Park Name: ${PARK_NAME}"
echo "Abbreviation: ${PARK_ABBREVIATION}"

addToSummary "${PARK_NAME}"

##
## Detect changes in the JSON
##
echo "Check for json changes..."
CHANGES=$(( 0 + $(git status --porcelain | grep json | wc -l) ))
MESSAGE="fetch update"
if [[ "$CHANGES" != "0" ]]
then
    echo "••• JSON Changed ${PARK_NAME}"
    git add ${DATA_DIR}/current.json
    MESSAGE="fetch - JSON Changed - ${PARK_NAME}"
    addToSummary "✅"
else
    addToSummary "x"
fi

##
## Archive past times
##
if [[ -f "${DATA_DIR}/hours.upcoming.txt" ]]
then
    echo "Archive past upcoming times..."
    ./archive.sh ${DATA_DIR}/hours.upcoming.txt
    CHANGES_ARCHIVE=$?
    if [[ "${CHANGES_ARCHIVE}" != "0" ]]
    then
        ICS_UPDATE=1
        CHANGES=3
        echo "••• Archive Changed ${PARK_NAME}"
        MESSAGE="fetch - Archive Changed - ${PARK_NAME}"
        addToSummary "✅"
    else
        addToSummary "x"
    fi
else
    addToSummary "x"
fi

##
## Regenerate upcoming times from previous API response & check for changes
##
CACHE=$(date +%Y%m%d%H%M)
LASTCHANGE=$(date "+%a %b %d %Y @ %I:%M %p")
NOW=$(date +%m-%d-%Y)
YEAR=$(date +%Y)
EXT=$(date +%Y%m%d-%H%M%S)
CHANGE_FILE=${DATA_DIR}/changelog/${YEAR}/diff.${EXT}.txt
mkdir -p ${DATA_DIR}/changelog/${YEAR}
if [[ -f "${DATA_DIR}/hours.json" ]]
then
    echo "Parse previous json (all)..."
    ./list.sh ${DATA_DIR}/hours.json > ${DATA_DIR}/hours.txt

    echo "Diff upcoming times..."
    diff --expand-tabs --side-by-side --width 60 --suppress-common-lines ${DATA_DIR}/hours.txt ${DATA_DIR}/current.txt > ${CHANGE_FILE}
    CHANGES_DIFF=$?
    if [[ "${CHANGES_DIFF}" == "0" ]]
    then
        rm ${CHANGE_FILE}
        echo "••• Upcoming Times - No Change - ${PARK_NAME}"
        addToSummary "x"
    else
        cat ${CHANGE_FILE}
        ICS_UPDATE=1
        CHANGES=2
        echo "••• Upcoming Times - CHANGED - ${PARK_NAME}"
        MESSAGE="fetch - New Times - ${PARK_NAME}"
        addToSummary "✅"
    fi
else
    CHANGES_DIFF=1
    ICS_UPDATE=1
    CHANGES=2
    echo "••• BRAND NEW TIMES - ${PARK_NAME}"
    MESSAGE="fetch - New Times - ${PARK_NAME}"
    echo "initial fetch" > ${CHANGE_FILE}
    addToSummary "✅ NEW ✅"
fi

if [[ "${CHANGES_DIFF}" != "0" || "${CHANGES_ARCHIVE}" != "0" || "${FORCE_UPDATE}" == "1" ]]
then
    cp ${DATA_DIR}/current.json ${DATA_DIR}/hours.json
    cp ${DATA_DIR}/current.txt ${DATA_DIR}/hours.txt
    cp ${DATA_DIR}/current.upcoming.txt ${DATA_DIR}/hours.upcoming.txt
    git add ${DATA_DIR}/current.*
    git add ${DATA_DIR}/hours.*
    git add ${CHANGE_FILE}
fi

if [[ "${ICS_UPDATE}" == "1" || "${FORCE_UPDATE}" == "1" ]]
then
    CHANGES=3

    echo "Generate ics (end) ..."
    ./ical.sh ${DATA_DIR}/hours.json end future "${PARK_NAME}" > ${DATA_DIR}/hours.end.ics

    # echo "Generate ics (archive) ..."
    # ./ical.sh ${DATA_DIR}/hours.json end archive "${PARK_NAME}" > ${DATA_DIR}/hours.end.archive.ics

    echo "Generate ics (subscribe) ..."
    ./ical.sh ${DATA_DIR}/hours.json summary future "${PARK_NAME}" > ${DATA_DIR}/hours.ics

    # echo "Generate ics (subscribe archive) ..."
    # ./ical.sh ${DATA_DIR}/hours.json summary archive "${PARK_NAME}" > ${DATA_DIR}/hours.archive.ics

    git add ${DATA_DIR}/hours.*

    if [[ "${CHANGES_DIFF}" == "1" ]]
    then
        echo "<div class='changelog-entry' data-change='${EXT}'><h2>${LASTCHANGE}</h2><pre>" > ${DATA_DIR}/changelog.xx.1.txt
        echo "</pre></div>" > ${DATA_DIR}/changelog.xx.2.txt
        sed "s/::PARK_TITLE::/${PARK_NAME}/g" ${DATA_COMMON}/changelog.head.html > ${DATA_DIR}/changelog.xx.head.html
        cat ${DATA_DIR}/changelog.xx.1.txt ${CHANGE_FILE} ${DATA_DIR}/changelog.xx.2.txt ${DATA_DIR}/changelog.body.txt > ${DATA_DIR}/changelog.xx.body.txt
        mv ${DATA_DIR}/changelog.xx.body.txt ${DATA_DIR}/changelog.body.txt
        cat ${DATA_DIR}/changelog.xx.head.html ${DATA_DIR}/changelog.body.txt ${DATA_COMMON}/changelog.foot.html > ${DATA_DIR}/changelog.html
        rm ${DATA_DIR}/changelog.xx.*
        git add ${DATA_DIR}/changelog.*
    fi
fi

if [[ "${CHANGES}" != "0" ]]
then

    sed -e "s#script.js?t=.*\"#script.js?t=${CACHE}\"#" data/index.html > data/index.html.new
    mv data/index.html.new data/index.html
    sed -e "s#style.css?t=.*\"#style.css?t=${CACHE}\"#" data/index.html > data/index.html.new
    mv data/index.html.new data/index.html
    echo "${LASTCHANGE}" > ${DATA_DIR}/lastChange.txt

    git add data/index.html
    git add ${DATA_DIR}/lastChange.txt

    echo "Commit: ${MESSAGE} ${NOW}"
    if [[ "${SHOULD_COMMIT}" == "1" ]]
    then
        git commit -m "${MESSAGE} ${NOW} - ${PARK_NAME}" 
        git push
    else
        echo "•• commit skipped ••"
    fi
fi

if [[ "${CHANGES_DIFF}" != 0 && "${SLACK_WEBHOOK_URL}" != "" ]]
then
    LINK="<https://jffmrk.github.io/sfmm/|${PARK_NAME} Park Calendar>"
    DIFF="\`\`\`\n$(cat ${CHANGE_FILE})\n\`\`\`"
    read -r -d '' SLACK_MESSAGE << EOM
{
	"blocks": [
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "${PARK_NAME} - ${LASTCHANGE}\n\n${DIFF}\n\n${LINK}"
			}
		}
	]
}
EOM
    curl -X POST -H 'Content-type: application/json' --data "${SLACK_MESSAGE}" ${SLACK_WEBHOOK_URL}
fi

echo "${SUMMARY}" >> ${GITHUB_STEP_SUMMARY}
