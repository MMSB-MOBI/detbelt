################################################
##### PYMOL SCRIPT TO VISUALIZE THE CORONA #####
################################################

def drawCorona (PDBfile, halfThickness = , beltRadius = , lowerError = , upperError = , color = ):
	"""
	PyMOL function to visualize the corona. Usage :
		- in PyMOL, call :
		run /path/to/this/script/pymolScript.py
		- then you can use the function with :
		drawCorona /path/to/the/PDBfile.pdb
		- with eventually one/some parameters (halfThickness, beltRadius, lowerError, upperError) :
		drawCorona /path/PDBfile.pdb, beltRadius = 40.7, upperError = 52.5
	"""
	
	#####################
	##### VARIABLES #####
	#####################
	r1,g1,b1 = color[0],color[1],color[2]

	###############################
	##### PREPARE ENVIRONMENT #####
	###############################
	cmd.reinitialize
	cmd.set("opaque_background", "off")
	cmd.bg_color('white')
	
	cmd.load(PDBfile, "molA") # load PDB file
	util.protein_vacuum_esp("molA",mode=2,quiet=0,_self=cmd)
	cmd.disable('molA_e_pot')
	cmd.enable('molA',1)
	cmd.hide("everything","molA")

	#####################
	##### CYLINDERS #####
	#####################

	# dimensions
	x1, y1, z1 = 0, 0, halfThickness # start point
	x2, y2, z2 = 0, 0, -1 * halfThickness # end point

	# creation (with transparent option)
	cmd.load_cgo( [ 25.0, 0.5, 9.0, x1, y1, z1, x2, y2, z2, beltRadius, r1, g1, b1, r1, g1, b1 ], "cylinder1" )

	#####################
	##### ERROR BAR #####
	#####################
	# WARNING : NOT AVAILABLE FOR NOW
	# x3, y3, z3 = lowerError, 0, halfThickness  # start point
	# x4, y4, z4 = upperError, 0, halfThickness  # end point
	# x3top, y3top, z3top = lowerError, 0, 16.6
	# x3bott, y3bott, z3bott = lowerError, 0, 14.6
	# x4top, y4top, z4top = upperError, 0, 16.6
	# x4bott, y4bott, z4bott = upperError, 0, 14.6
	# r4, g4, b4 = 0, 0, 0  # color (black)
	# linewidth = 0.4

	# cmd.load_cgo( [ 9.0, x3, y3, z3, x4, y4, z4, linewidth, r4, g4, b4, r4, g4, b4 ], "errorbar-horizontal" )
	# cmd.load_cgo( [ 9.0, x4top, y4top, z4top, x4bott, y4bott, z4bott, linewidth, r4, g4, b4, r4, g4, b4 ], "errorbar-vertical-ext" )
	# cmd.load_cgo( [ 9.0, x3top, y3top, z3top, x3bott, y3bott, z3bott, linewidth, r4, g4, b4, r4, g4, b4 ], "errorbar-vertical-int" )

	###################################
	##### ORIENTATION OF THE VIEW #####
	###################################
	view = (-0.997557580, -0.011187348, 0.068922453,
		0.069676004, -0.095293976, 0.993007243,
		-0.004541366, 0.995385945, 0.095841140,
	    0.000000000, 0.000000000, -479.885131836,
	    -0.055984497, 0.386333466, -31.959495544,
	    402.123291016, 557.646972656, -20.000000000)
	cmd.set_view (view)
	cmd.turn("x", 3)
	cmd.ray() # to see the cylinder

cmd.extend("drawCorona", drawCorona) # import the function
