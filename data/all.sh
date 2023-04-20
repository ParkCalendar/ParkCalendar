#!/bin/bash

cat parks.json | jq -r '.parks[] | [.state, .city, .name] | join(" - ")' | sort
