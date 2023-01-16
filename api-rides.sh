#!/bin/bash
##

RIDES_JSON="data/rides.json"

## Ride Status
curl https://api.sixflags.net/mobileapi/v1/park/6/ride > ${RIDES_JSON}

OPEN=$(( $(cat ${RIDES_JSON} | jq -r '.rides[] | select(.status | contains("Open")) | .name' | wc -l) + 0 ))
CLOSED=$(( $(cat ${RIDES_JSON} | jq -r '.rides[] | select(.status | contains("Closed")) | .name' | wc -l) + 0 ))

##
date +'%Y-%m-%d @ %H:%M %p'
echo ""
echo "Open Rides: ${OPEN}"
echo "Closed: ${CLOSED}"
echo ""
echo "OPEN (Thrill)"
echo "-------------"
cat ${RIDES_JSON} | jq -r '.rides[] | select(.status == "AttractionStatusOpen") | select( (.rideType[] | contains("Thrill")) or (.thrillLevel == "ThrillLevelMax") ) | [.name, .waitTime ] | join (" - ")'

echo ""
echo "OPEN (Other)"
echo "------------"
cat ${RIDES_JSON} | jq -r '.rides[] | select(.status == "AttractionStatusOpen") | select( (.rideType[] | contains("Thrill") | not) and (.thrillLevel != "ThrillLevelMax") ) | [.name, .waitTime ] | join (" - ")'

echo ""
echo "TEMPORARILY CLOSED"
echo "------------------"
cat ${RIDES_JSON} | jq -r '.rides[] | select(.status == "AttractionStatusTemporarilyClosed") | .name'

echo ""
echo "CLOSED"
echo "------"
cat ${RIDES_JSON} | jq -r '.rides[] | select(.status == "AttractionStatusClosed") | .name'

echo ""
echo "CLOSED (for season)"
echo "-------------------"
cat ${RIDES_JSON} | jq -r '.rides[] | select(.status == "AttractionStatusClosedForSeason") | .name'

echo ""
echo "Other"
echo "-----"
cat ${RIDES_JSON} | jq -r '.rides[] | select(.status != "AttractionStatusTemporarilyClosed" and .status != "AttractionStatusClosed" and .status != "AttractionStatusOpen" and .status != "AttractionStatusClosedForSeason") | [.name, .status] | join (" - ")'
