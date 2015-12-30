# -*- coding: utf-8 -*-

# Description: generates a json file of addresses from a geojson file
# Example usage:
#   python parse_geojson.py data/1947.geojson ../data/greenbook_1947.json 1947

import json
import sys

if len(sys.argv) < 3:
    print "Usage: %s <inputfile json> <outputfile json> <year>" % sys.argv[0]
    sys.exit(1)
INPUT_FILE = sys.argv[1]
OUTPUT_FILE = sys.argv[2]
YEAR = sys.argv[3]

cols = ['name','address','type','year','latlng','url','image_id','image_region']
rows = []

types_map = {
    'tourist ho': 'tourist home',
    'tourists ho': 'tourist home',
    'hotel': 'hotel',
    'motel': 'motel',
    'restaurant': 'restaurant',
    'tavern': 'tavern',
    'service station': 'service station',
    'liquor store': 'liquor store',
    'night club': 'night club',
    'road house': 'road house'
}

def isValid(item):
    return item and 'geomotry' in item and 'properties' in item

def getType(t):
    global types_map

    t = t.lower()

    for m in types_map:
        if m in t:
            t = types_map[m]
            break

    return t.capitalize()

with open(INPUT_FILE) as data_file:
    data = json.load(data_file)
    data = data['features']

    for r in data:
        if isValid(r):
            rows.append([
                r['properties']['name'],
                r['properties']['address'],
                getType(r['properties']['category']),
                r['properties']['year'],
                [r['geomotry']['coordinates'][1], r['geomotry']['coordinates'][0]],
                r['properties']['dc_url'],
                r['properties']['image_id'],
                r['properties']['image_region']
            ])

# Write out data
with open(OUTPUT_FILE, 'w') as outfile:
    data = {
        'cols': cols,
        'rows': rows,
        'totalrows': len(rows),
        'year': YEAR
    }
    json.dump(data, outfile)
print "Wrote " + str(len(rows)) + " rows to " + OUTPUT_FILE
