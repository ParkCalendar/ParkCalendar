#!/bin/bash
##
## Fetch the current SixFlags Hours
##

cd "$(dirname "$0")"

./api-hours.sh > data/current.json
./list.sh data/current.json > data/current.txt

CHANGES=$(( 0 + $(git status --porcelain | grep json | wc -l) ))
MESSAGE=""

if [[ "$CHANGES" == "1" ]]
then
    git add data/current.json
    MESSAGE="JSON Changed"
fi

diff data/hours.txt data/current.txt

if [[ "$?" == "0" ]]
then
    date
    echo "No changes"
else
    CHANGES=2
    MESSAGE="New Times"
    cp data/current.json data/hours.json
    cp data/current.txt data/hours.txt
    ./ical.sh data/hours.json > data/hours.ics

    git add data/current.*
    git add data/hours.*
fi

if [[ "${CHANGES}" != "0" ]]
then
    LASTCHANGE=$(date "+%b %d %Y")
    sed -e "s#<em>.*</em>#<em>Last changed: ${LASTCHANGE}</em>#g" data/index.html > data/index.html.new
    mv data/index.html.new data/index.html
    git add data/index.html

    NOW=$(date +%m-%d-%Y)
    echo "Commit: ${MESSAGE} ${NOW}"
    git commit -m "${MESSAGE} ${NOW}" 
    git push
fi
