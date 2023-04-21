#!/bin/bash

cat parks.json | jq -r '.parks[] | [.state, .city, .name] | join(" - ")' | sort

cat parks.json | jq -c '.parks[] | { "park_id": .parkId, "name": .name, "state": .state, "city": .city } '
