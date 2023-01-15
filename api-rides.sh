#!/bin/bash
##

RIDES_JSON="data/rides.json"

## Ride Status
curl https://api.sixflags.net/mobileapi/v1/park/6/ride > ${RIDES_JSON}

##
date +'%Y-%m-%d @ %H:%M %p'
echo ""
echo "OPEN"
echo "----"
cat ${RIDES_JSON} | jq -r '.rides[] | select(.status == "AttractionStatusOpen") | {name, waitTime} | join (" - ")'

echo ""
echo "CLOSED"
echo "------"
cat ${RIDES_JSON} | jq -r '.rides[] | select(.status == "AttractionStatusClosed") | .name'
