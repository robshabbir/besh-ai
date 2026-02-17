#!/bin/bash

# This script will compile data from multiple categories
# Categories: lawyer, dentist, auto repair, restaurant, salon/barber, HVAC

categories=(
  "lawyer+solo+practice+nyc"
  "dentist+small+practice+nyc"
  "auto+repair+nyc"
  "small+restaurant+nyc"
  "salon+nyc"
  "barber+nyc"
  "hvac+nyc"
)

echo "Categories to search:" 
for cat in "${categories[@]}"; do
  echo "- $cat"
done
