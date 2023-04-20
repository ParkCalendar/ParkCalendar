#!/bin/bash
##
## Magic Mountain: 6
## Hurricane Harbor: 11

PARK_ID=$1
if [[ "${PARK_ID}" == "" ]]
then
    PARK_ID=6
fi

curl https://api.sixflags.net/mobileapi/v1/park/${PARK_ID}/hours

## Hours
## curl https://api.sixflags.net/mobileapi/v1/park/6/hours

## curl https://api.sixflags.net/mobileapi/v1/park/11/hours

## Ride Status
#curl https://api.sixflags.net/mobileapi/v1/park/6/rideStatus
