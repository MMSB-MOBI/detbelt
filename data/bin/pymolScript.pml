################################################
##### PYMOL SCRIPT TO VISUALIZE THE CORONA #####
################################################

#     ******************
#     ***** README *****
#     ******************
#     * HOW TO USE IT :
#     * Drag and drop this file into your PyMOL window.
#     * You can modify the values in the "VARIABLES" section of this script.

#####################
##### VARIABLES #####
#####################
PDBfile = """/path/to/your/file.pdb"""
halfThickness = 
beltRadius = 
color = 

###############################
##### PREPARE ENVIRONMENT #####
###############################
reinitialize
set opaque_background, off
bg_color white

cmd.load(PDBfile, "molA") # load PDB file

util.protein_vacuum_esp("molA", mode=2, quiet=0, _self=cmd)
disable molA_e_pot
enable molA, 1
hide everything, molA

#####################
##### CYLINDERS #####
#####################

# dimensions
x1, y1, z1 = 0, 0, halfThickness # start point
x2, y2, z2 = 0, 0, -1 * halfThickness # end point
# colors
r1,g1,b1 = color[0],color[1],color[2]

# creation (with transparent option)
cmd.load_cgo( [ 25.0, 0.5, 9.0, x1, y1, z1, x2, y2, z2, beltRadius, r1, g1, b1, r1, g1, b1 ], "cylinder1" )

###################################
##### ORIENTATION OF THE VIEW #####
###################################
set_view (-0.997557580, -0.011187348, 0.068922453, \
	0.069676004, -0.095293976, 0.993007243, \
	-0.004541366, 0.995385945, 0.095841140, \
    0.000000000, 0.000000000, -479.885131836, \
    -0.055984497, 0.386333466, -31.959495544, \
    402.123291016, 557.646972656, -20.000000000)
