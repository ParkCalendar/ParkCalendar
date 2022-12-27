#!/bin/bash
##
## Fetch the current SixFlags Hours
##

cd "$(dirname "$0")"

./api-hours.sh > data/current.json

./list.sh data/current.json > data/current.txt
./list.sh data/hours.json > data/hours.txt

diff data/hours.txt data/current.txt

if [[ "$?" == "0" ]]
then
    echo "No changes"
    exit 0
fi

cp data/current.json data/hours.json
cp data/current.txt data/hours.txt

./ical.sh data/hours.json > data/hours.ics
