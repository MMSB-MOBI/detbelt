#!/bin/bash
#
# first tests of the corona coreScript
#

# defined in the sbatch :
# - pdbFile = PDB file to orient
# - detergentFile = quantities and detergent molecules given by the client
# - detergentVolumes = JSON of detergents and their characteristics
# - orientForDisplay = perl script to re-orient the PDB (the protein need to be align with the Z axis)
# - calculateVolTot = python script to determinate the total volume of the corona
# - calculateRadius = R script to determinate the radius of the protein and the belt


# Definition of the variables
pdbName="1PDB" # arbitrary name
pdbUserOriented="${pdbName}out.pdb"

SOURCEDIR=`pwd`
mkdir $SOURCEDIR/results/
cd $WORKDIR
perl -ne 'if (!($_ =~ /^HETATM/ && $_ !~ /DUM/)) {print;}' $pdbFile > ./$pdbUserOriented # save the PDB file in the workdir, gettin rid of HETATM records


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
awk -v L=$half_thickness 'BEGIN{FS=""}{Z=substr($0,47,8)+0; X=substr($0,30,8)+0; Y=substr($0,39,8)+0; ACC=substr($0,56,8)+0; if(Z>-L&& Z<L){AHS = AHS + ACC}} END{print AHS}' ${pdbName}out.asa > ahs.txt


##### RADIUS #####
# compute radius
echo $half_thickness | awk '{print $1*2}' > Thickness.txt
R CMD BATCH $calculateRadius #> /dev/null


##### RESULTS #####
awk '{printf "%s %s %6.2f\n", "REMARK",$1,$2}' radius.txt > out.pdb
cat ./$pdbUserOriented >> out.pdb

python3 $orientForDisplay ./out.pdb > forDisplay.pdb

resultsPath=$SOURCEDIR/results/
echo "{\"resultsPath\" : \"$resultsPath\"}"
cp ./* $SOURCEDIR/results/

