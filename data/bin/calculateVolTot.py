#!/usr/bin/python

# to run :
# python calculateVolTot.py /path/to/detUser.txt /path/to/dataDet.json > /path/to/results/volumeTotal.txt
# where :
#	- detFile.txt describes quantities and detergent molecules given by the client
#	- newDet.json describes our database of detergents and volumes but in JSON format

import sys
import json
#from pprint import pprint # module to print JSONs


detUser = open(sys.argv[1])
dataDet = json.load(open(sys.argv[2]))
dataDet = dataDet['data']

def browseCategories(data) :
	"""
	From @data, browse the list of detergents in each category, one by one.
	"""
	for e in data:
		yield data[e] # one by one

def iterateToString(listOfDet) :
	"""
	From a list of detergents (@listOfDeyt in JSON format) return them to the following format (one by one) :
	DDM 453
	FC12 344
	"""
	for e in listOfDet:
		s = e['name'] + ' ' + str(e['vol'])
		yield s # one by one


VOL = 0.0

unitary_vol = {}

for category in browseCategories(dataDet): # for each category
	for l in iterateToString(category): # for each detergent in the category
		words = l.strip().split()
		unitary_vol[words[0]] = words[1]


for line in detUser:
	words = line.strip().split()
	VOL += float(words[0]) * float(unitary_vol[words[1]])

print VOL