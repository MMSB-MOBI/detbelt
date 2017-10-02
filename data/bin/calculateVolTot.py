#!/usr/bin/python

# to run :
# calculateVolTot.py /path/to/detFile.txt /path/to/newDet.json > /path/to/results/volumeTotal.txt
# where :
#	- detFile.txt describes quantities and detergent molecules given by the client
#	- newDet.json describes our database of detergents and volumes but in JSON format

import sys
import json
#from pprint import pprint # module to print JSONs


det_file = open(sys.argv[1])
dataDet = json.load(open(sys.argv[2]))
dataDet = dataDet['data']


def iterateToString(listOfDet) :
	"""
	Take a list of detergents (in JSON format) and give them to the following format :
	DDM 453
	FC12 344
	"""
	for e in listOfDet:
		s = e['name'] + ' ' + str(e['vol'])
		yield s


VOL = 0.0

unitary_vol = {}

for dic in iterateToString(dataDet):
	words = dic.strip().split()
	unitary_vol[words[0]] = words[1]


for line in det_file:
	words = line.strip().split()
	VOL += float(words[0]) * float(unitary_vol[words[1]])

print VOL