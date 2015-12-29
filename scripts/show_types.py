# -*- coding: utf-8 -*-

# Description: lists all the types
# Example usage:
#   python show_types.py ../data/greenbook_1947.json

import json
from pprint import pprint
import sys

if len(sys.argv) < 1:
    print "Usage: %s <inputfile json>" % sys.argv[0]
    sys.exit(1)
INPUT_FILE = sys.argv[1]

with open(INPUT_FILE) as data_file:
    data = json.load(data_file)

    rows = data['rows']
    cols = data['cols']

    i = cols.index("type")

    types = set([r[i] for r in rows])

    pprint(types)
