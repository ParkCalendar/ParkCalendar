#!/bin/bash
##
## Fetch the current SixFlags Hours
##

cd "$(dirname "$0")"

export TZ=America/Los_Angeles

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

##
## Fetch current times from the API
##
echo "Fetch new json..."
./api-hours.sh | jq > ${DATA_DIR}/current.json
echo "Parse new json (all)..."
./list.sh ${DATA_DIR}/current.json > ${DATA_DIR}/current.txt
echo "Parse new json (upcoming)..."
./upcoming.sh ${DATA_DIR}/current.json > ${DATA_DIR}/current.upcoming.txt

##
## Detect changes in the JSON
##
echo "Check for json changes..."
CHANGES=$(( 0 + $(git status --porcelain | grep json | wc -l) ))
MESSAGE="fetch update"
if [[ "$CHANGES" != "0" ]]
then
    echo "::notice::JSON Changed"
    git add ${DATA_DIR}/current.json
    MESSAGE="fetch - JSON Changed"
fi

##
## Archive past times
##
echo "Archive past upcoming times..."
./archive.sh ${DATA_DIR}/hours.upcoming.txt
CHANGES_ARCHIVE=$?
if [[ "${CHANGES_ARCHIVE}" != "0" ]]
then
    ICS_UPDATE=1
    CHANGES=3
    echo "::notice::Archive Changed"
    MESSAGE="fetch - Archive Changed"
fi

##
## Regenerate upcoming times from previous API response & check for changes
##
echo "Parse previous json (all)..."
./list.sh ${DATA_DIR}/hours.json > ${DATA_DIR}/hours.txt

NOW=$(date +%m-%d-%Y)
YEAR=$(date +%Y)
EXT=$(date +%Y%m%d-%H%M%S)
CACHE=$(date +%Y%m%d%H%M)
LASTCHANGE=$(date "+%a %b %d %Y @ %I:%M %p")

CHANGE_FILE=${DATA_DIR}/changelog/${YEAR}/diff.${EXT}.txt
mkdir -p ${DATA_DIR}/changelog/${YEAR}

echo "Diff upcoming times..."
diff --expand-tabs --side-by-side --width 60 --suppress-common-lines ${DATA_DIR}/hours.txt ${DATA_DIR}/current.txt > ${CHANGE_FILE}
CHANGES_DIFF=$?
if [[ "${CHANGES_DIFF}" == "0" ]]
then
    rm ${CHANGE_FILE}
    echo "::notice::Upcoming Times - No Change"
else
    cat ${CHANGE_FILE}
    ICS_UPDATE=1
    CHANGES=2
    echo "::notice::Upcoming Times - CHANGED!"
    MESSAGE="fetch - New Times"
fi

if [[ "${CHANGES_DIFF}" != "0" || "${CHANGES_ARCHIVE}" != "0" || "${FORCE_UPDATE}" == "1" ]]
then
    cp ${DATA_DIR}/current.json ${DATA_DIR}/hours.json
    cp ${DATA_DIR}/current.txt ${DATA_DIR}/hours.txt
    cp ${DATA_DIR}/current.upcoming.txt ${DATA_DIR}/hours.upcoming.txt
    git add ${DATA_DIR}/current.*
    git add ${DATA_DIR}/hours.*
fi

if [[ "${ICS_UPDATE}" == "1" || "${FORCE_UPDATE}" == "1" ]]
then
    CHANGES=3

    echo "Generate ics (end) ..."
    ./ical.sh ${DATA_DIR}/hours.json end > ${DATA_DIR}/hours.end.ics

    # echo "Generate ics (archive) ..."
    # ./ical.sh ${DATA_DIR}/hours.json end archive > ${DATA_DIR}/hours.end.archive.ics

    echo "Generate ics (subscribe) ..."
    ./ical.sh ${DATA_DIR}/hours.json summary > ${DATA_DIR}/hours.ics

    # echo "Generate ics (subscribe archive) ..."
    # ./ical.sh ${DATA_DIR}/hours.json summary > ${DATA_DIR}/hours.archive.ics

    git add ${DATA_DIR}/hours.*

    if [[ "${CHANGES_DIFF}" == "1" ]]
    then
        echo "<div class='changelog-entry' data-change='${EXT}'><h2>${LASTCHANGE}</h2><pre>" > ${DATA_DIR}/changelog.xx.1.txt
        echo "</pre></div>" > ${DATA_DIR}/changelog.xx.2.txt
        cat ${DATA_DIR}/changelog.xx.1.txt ${CHANGE_FILE} ${DATA_DIR}/changelog.xx.2.txt ${DATA_DIR}/changelog.body.txt > ${DATA_DIR}/changelog.xx.body.txt
        mv ${DATA_DIR}/changelog.xx.body.txt ${DATA_DIR}/changelog.body.txt
        cat ${DATA_DIR}/changelog.head.html ${DATA_DIR}/changelog.body.txt ${DATA_DIR}/changelog.foot.html > ${DATA_DIR}/changelog.html
        rm ${DATA_DIR}/changelog.xx.*
        git add ${DATA_DIR}/changelog.*
        git add ${CHANGE_FILE}
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
        git commit -m "${MESSAGE} ${NOW}" 
        git push
    else
        echo "•• commit skipped ••"
    fi
fi

if [[ "${CHANGES_DIFF}" != 0 && "${SLACK_WEBHOOK_URL}" != "" ]]
then
    LINK="<https://jffmrk.github.io/sfmm/|SFMM Park Hours>"
    DIFF="\`\`\`\n$(cat ${CHANGE_FILE})\n\`\`\`"
    read -r -d '' SLACK_MESSAGE << EOM
{
	"blocks": [
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "${LASTCHANGE}\n\n${DIFF}\n\n${LINK}"
			}
		}
	]
}
EOM
    curl -X POST -H 'Content-type: application/json' --data "${SLACK_MESSAGE}" ${SLACK_WEBHOOK_URL}
fi
