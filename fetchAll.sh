#!/bin/bash
##
## Fetch the current SixFlags Hours
##

cd "$(dirname "$0")"

ARG1="up"
ARG2="up"

if [[ "$1" == "commit" ]]
then
    ARG1="commit"
fi
if [[ "$2" == "update" ]]
then
    ARG2="update"
fi

./fetch.sh ${ARG1} ${ARG2} 1
./fetch.sh ${ARG1} ${ARG2} 2
./fetch.sh ${ARG1} ${ARG2} 3
./fetch.sh ${ARG1} ${ARG2} 5
./fetch.sh ${ARG1} ${ARG2} 6
./fetch.sh ${ARG1} ${ARG2} 7
./fetch.sh ${ARG1} ${ARG2} 8
./fetch.sh ${ARG1} ${ARG2} 10
./fetch.sh ${ARG1} ${ARG2} 11
./fetch.sh ${ARG1} ${ARG2} 13
./fetch.sh ${ARG1} ${ARG2} 14
./fetch.sh ${ARG1} ${ARG2} 17
./fetch.sh ${ARG1} ${ARG2} 20
./fetch.sh ${ARG1} ${ARG2} 23
./fetch.sh ${ARG1} ${ARG2} 24
./fetch.sh ${ARG1} ${ARG2} 25
./fetch.sh ${ARG1} ${ARG2} 28
./fetch.sh ${ARG1} ${ARG2} 29
./fetch.sh ${ARG1} ${ARG2} 32
./fetch.sh ${ARG1} ${ARG2} 42
./fetch.sh ${ARG1} ${ARG2} 43
./fetch.sh ${ARG1} ${ARG2} 44
./fetch.sh ${ARG1} ${ARG2} 45
./fetch.sh ${ARG1} ${ARG2} 46
./fetch.sh ${ARG1} ${ARG2} 47
./fetch.sh ${ARG1} ${ARG2} 48

