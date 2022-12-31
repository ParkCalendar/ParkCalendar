#!/bin/bash
##
## Fetch the current SixFlags Hours
##

cd "$(dirname "$0")"

SHOULD_COMMIT=0
FORCE_UPDATE=0
if [[ "$1" == "commit" ]]
then
    SHOULD_COMMIT=1
fi
if [[ "$2" == "force" ]]
then
    FORCE_UPDATE=1
fi

./api-hours.sh | jq > data/current.json
./list.sh data/current.json > data/current.txt

CHANGES=$(( 0 + $(git status --porcelain | grep json | wc -l) ))
MESSAGE=""

if [[ "$CHANGES" == "1" ]]
then
    echo "::notice::JSON Changed"
    git add data/current.json
    MESSAGE="JSON Changed"
fi

./list.sh data/hours.json > data/hours.txt

NOW=$(date +%m-%d-%Y)
EXT=$(date +%Y%m%d)
CHANGE_FILE=data/changelog.diff.${EXT}.txt

echo "Diff times..."
diff data/hours.txt data/current.txt > ${CHANGE_FILE}
CHANGES_DIFF=$?
if [[ "${CHANGES_DIFF}" == "0" ]]
then
    rm ${CHANGE_FILE}
fi

if [[ "${CHANGES_DIFF}" == "0" && "${FORCE_UPDATE}" == "0" ]]
then
    date
    echo "::notice::No Changes"
else
    echo "::notice::Times Changed"
    CHANGES=2
    MESSAGE="New Times"
    cp data/current.json data/hours.json
    cp data/current.txt data/hours.txt

    echo "Generate ics (end) ..."
    ./ical.sh data/hours.json end > data/hours.end.ics

    echo "Generate ics (subscribe) ..."
    ./ical.sh data/hours.json summary > data/hours.ics

    if [[ "${CHANGES_DIFF}" == "1" ]]
    then
        echo "<div class='changelog-entry' data-change='${NOW}'><h2>${NOW}</h2><pre>" > data/changelog.xx.1.txt
        echo "</pre></div>" > data/changelog.xx.2.txt
        cat data/changelog.xx.1.txt ${CHANGE_FILE} data/changelog.xx.2.txt data/changelog.body.txt > data/changelog.xx.body.txt
        mv data/changelog.xx.body.txt data/changelog.body.txt
        cat data/changelog.head.html data/changelog.body.txt data/changelog.foot.html > data/changelog.html
        rm data/changelog.xx.*
        git add data/changelog.*
    fi

    git add data/current.*
    git add data/hours.*
fi

if [[ "${CHANGES}" != "0" ]]
then

    LASTCHANGE=$(date "+%b %d %Y")
    sed -e "s#<em>.*</em>#<em>Last changed: ${LASTCHANGE}</em>#g" data/index.html > data/index.html.new
    mv data/index.html.new data/index.html

    git add data/index.html

    echo "Commit: ${MESSAGE} ${NOW}"
    if [[ "${SHOULD_COMMIT}" == "1" ]]
    then
        git commit -m "${MESSAGE} ${NOW}" 
        git push
    else
        echo "•• commit skipped ••"
    fi
fi
