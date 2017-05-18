#!/bin/bash
#
# first tests of the corona coreScript
#

# defined in the sbatch :
# - pdbFile = PDB file to orient
# - detergentFile = quantities and detergent molecules
# - detergentVolumes = volumes of each detergent molecules
# - orientForDisplay = perl script to re-orient the PDB (the protein need to be align with the Z axis)
# - calculateVolTot = python script to determinate the total volume of the corona
# - calculateRadius = R script to determinate the radius of the protein and the belt


# Definition of the variables
pdbName="1PDB" # arbitrary name
pdbUserOriented="${pdbName}out.pdb"

SOURCEDIR=`pwd`
mkdir $SOURCEDIR/results/
cd $WORKDIR
cp $pdbFile ./$pdbUserOriented # save the PDB file in the workdir


##### VOLUME #####
# compute total detergent volume
cp $detergentFile ./det_file.txt
$calculateVolTot ./det_file.txt $detergentVolumes > Volume_total.txt


##### NACCESS #####
# run naccess and extract exposed atoms
naccess $pdbUserOriented > /dev/null
half_thickness=`grep "1/2 of bilayer thickness" $pdbUserOriented | awk '{print $6}' | head -n 1`
echo $half_thickness > ./half_thickness.txt
awk -v L=$half_thickness 'BEGIN{FS=""}{Z=substr($0,47,8)+0; X=substr($0,30,8)+0; Y=substr($0,39,8)+0; ACC=substr($0,56,8)+0; if(Z>-L&& Z<L && ACC>3.0){print X*X+Y*Y}}' ${pdbName}out.asa > squared_radii.txt


##### RADIUS #####
# compute radius
echo $half_thickness | awk '{print $1*2}' > Thickness.txt
R CMD BATCH $calculateRadius #> /dev/null


##### RESULTS #####
awk '{printf "%s %s %6.2f\n", "REMARK",$1,$2}' radius.txt > out.pdb
cat ./$pdbUserOriented >> out.pdb

perl $orientForDisplay ./out.pdb > forDisplay.pdb

resultsPath=$SOURCEDIR/results/
echo "{\"resultsPath\" : \"$resultsPath\"}"
cp ./* $SOURCEDIR/results/

