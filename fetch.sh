#!/bin/bash
##
## Fetch the current SixFlags Hours
##

cd "$(dirname "$0")"

export TZ=America/Los_Angeles

SHOULD_COMMIT=0
FORCE_UPDATE=0
ICS_UPDATE=0
if [[ "$1" == "commit" ]]
then
    SHOULD_COMMIT=1
fi
if [[ "$2" == "force" ]]
then
    FORCE_UPDATE=1
fi

##
## Fetch current times from the API
##
./api-hours.sh | jq > data/current.json
./list.sh data/current.json > data/current.txt
./upcoming.sh data/current.json > data/current.upcoming.txt

##
## Detect changes in the JSON
##
CHANGES=$(( 0 + $(git status --porcelain | grep json | wc -l) ))
MESSAGE="fetch update"
if [[ "$CHANGES" != "0" ]]
then
    echo "::notice::JSON Changed"
    git add data/current.json
    MESSAGE="fetch - JSON Changed"
fi

##
## Archive past times
##
./archive.sh data/hours.upcoming.txt
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
./list.sh data/hours.json > data/hours.txt

NOW=$(date +%m-%d-%Y)
YEAR=$(date +%Y)
EXT=$(date +%Y%m%d)
CACHE=$(date +%Y%m%d%H%M)
LASTCHANGE=$(date "+%a %b %d %Y @ %I:%M %p")

CHANGE_FILE=data/changelog/${YEAR}/diff.${EXT}.txt
mkdir -p data/changelog/${YEAR}

echo "Diff times..."
diff data/hours.txt data/current.txt > ${CHANGE_FILE}
CHANGES_DIFF=$?
if [[ "${CHANGES_DIFF}" == "0" ]]
then
    rm ${CHANGE_FILE}
else
    cat ${CHANGE_FILE}
    ICS_UPDATE=1
    CHANGES=2
    echo "::notice::Times Changed"
    MESSAGE="fetch - New Times"
fi

if [[ "${CHANGES_DIFF}" != "0" || "${CHANGES_ARCHIVE}" != "0" || "${FORCE_UPDATE}" == "1" ]]
then
    cp data/current.json data/hours.json
    cp data/current.txt data/hours.txt
    cp data/current.upcoming.txt data/hours.upcoming.txt
    git add data/current.*
    git add data/hours.*
fi

if [[ "${ICS_UPDATE}" == "1" || "${FORCE_UPDATE}" == "1" ]]
then
    CHANGES=3

    echo "Generate ics (end) ..."
    ./ical.sh data/hours.json end > data/hours.end.ics

    # echo "Generate ics (archive) ..."
    # ./ical.sh data/hours.json end archive > data/hours.end.archive.ics

    echo "Generate ics (subscribe) ..."
    ./ical.sh data/hours.json summary > data/hours.ics

    # echo "Generate ics (subscribe archive) ..."
    # ./ical.sh data/hours.json summary > data/hours.archive.ics

    git add data/hours*ics

    if [[ "${CHANGES_DIFF}" == "1" ]]
    then
        echo "<div class='changelog-entry' data-change='${EXT}'><h2>${LASTCHANGE}</h2><pre>" > data/changelog.xx.1.txt
        echo "</pre></div>" > data/changelog.xx.2.txt
        cat data/changelog.xx.1.txt ${CHANGE_FILE} data/changelog.xx.2.txt data/changelog.body.txt > data/changelog.xx.body.txt
        mv data/changelog.xx.body.txt data/changelog.body.txt
        cat data/changelog.head.html data/changelog.body.txt data/changelog.foot.html > data/changelog.html
        rm data/changelog.xx.*
        git add data/changelog.*
        git add ${CHANGE_FILE}
    fi
fi

if [[ "${CHANGES}" != "0" ]]
then

    sed -e "s#<em>.*</em>#<em>Updated: ${LASTCHANGE}</em>#g" data/index.html > data/index.html.new
    mv data/index.html.new data/index.html
    sed -e "s#script.js?t=.*\"#script.js?t=${CACHE}\"#" data/index.html > data/index.html.new
    mv data/index.html.new data/index.html
    sed -e "s#style.css?t=.*\"#style.css?t=${CACHE}\"#" data/index.html > data/index.html.new
    mv data/index.html.new data/index.html
    sed -e "s#hours.end.ics?t=.*'#hours.end.ics?t=${CACHE}'#" data/script.js > data/script.js.new
    mv data/script.js.new data/script.js

    git add data/index.html
    git add data/script.js

    echo "Commit: ${MESSAGE} ${NOW}"
    if [[ "${SHOULD_COMMIT}" == "1" ]]
    then
        git commit -m "${MESSAGE} ${NOW}" 
        git push
    else
        echo "•• commit skipped ••"
    fi
fi
