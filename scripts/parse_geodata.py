# -*- coding: utf-8 -*-

# Description: generates a json file of addresses from http://library.sc.edu/digital/collections/greenbookmap.html
# Example usage:
#   python parse_geodata.py "data/library_sc_edu_greenbookmap_%d.json" 1500 500 ../data/greenbook_1956.json 1956

import json
import re
import sys

if len(sys.argv) < 5:
    print "Usage: %s <inputfile json> <max rows> <rows per file> <outputfile json> <year>" % sys.argv[0]
    sys.exit(1)
INPUT_FILE = sys.argv[1]
MAX_ROWS = int(sys.argv[2])
ROWS_PER_FILE = int(sys.argv[3])
OUTPUT_FILE = sys.argv[4]
YEAR = int(sys.argv[5])

cols = ['name','address','type','year','latlng']
rows = []
replace_strings = [
    ['46#8211;', ' '],
    ['74br076', ''],
    ['74br76', ' '],
    ['74span dir7542ltr427674span76', ''],
    ['74span style7542font-style:italic4276', ''],
    ['74/span7674', ''],
    ['74/span076', ''],
    ['74/span76', ''],
    ['74br /76',''],
    ['74span76',''],
    ['/span76',''],
    ['br076', ''],
    ['46#8212;', ' '],
    ['#189;', ''],
    ['46#233;', 'e'],
    ['46amp;', '&'],
    ['br /076', ''],
    ['47s', "'s"],
    [']74', "]"],
    ['O47', "O'"],
    [r' [0-9]{5}\]?(74)$', ''],
    [r'(42)([^\,]+,)(42)', r'\2']
]

def isRegex(s):
    try:
        re.compile(s)
        return True
    except AttributeError:
        return False
    else:
        return False

def cleanString(s):
    global replace_strings
    cleaned_string = s

    for p in replace_strings:
        f = p[0]
        r = p[1]
        if isRegex(f):
            cleaned_string = re.sub(f, r, cleaned_string)
        else:
            cleaned_string = cleaned_string.replace(f, r)

    return cleaned_string

def addressExists(name, address, latlng):
    global rows
    matches = [r for r in rows if r[0]==name and r[1]==address and r[4][0]==latlng[0] and r[4][1]==latlng[1]]
    return len(matches) > 0

offset = 0
for i in range(MAX_ROWS / ROWS_PER_FILE + 1):
    filename = INPUT_FILE % offset

    with open(filename) as data_file:
        data = json.load(data_file)
        data = data['table']['rows']

        for r in data:
            c = r['c']
            name = cleanString(c[0]['v'])
            address = cleanString(c[1]['v'])
            address_type = c[2]['v']
            address_year = YEAR
            latlng_string = c[3]['v'].replace('74Point7674coordinates76','').replace(',0.074/coordinates7674/Point076','')
            latlng = latlng_string.split(',')
            latlng = [float(latlng[1]), float(latlng[0])]
            if not addressExists(name, address, latlng):
                rows.append([
                    name,
                    address,
                    address_type,
                    address_year,
                    latlng
                ])
    offset += ROWS_PER_FILE

# Write out data
with open(OUTPUT_FILE, 'w') as outfile:
    data = {
        'cols': cols,
        'rows': rows,
        'totalrows': len(rows),
        'year': str(YEAR)
    }
    json.dump(data, outfile)
print "Wrote " + str(len(rows)) + " rows to " + OUTPUT_FILE
