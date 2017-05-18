/*
----------------------------------
Création d'un serveur sans Express
----------------------------------

const http = require('http');
const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer(function(req, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.end('<h1> Serveur mel Hello World\n</h1>');
});

server.listen(port, hostname, function () {
  console.log(`Server running at http://${hostname}:${port}/`);
});
*/


var pipeline = require('./pipeline.js');
var HTTP_lib = require('./HTTP_lib.js');
var jsonfile = require('jsonfile');


var worker;
var bean, pdbFile, deterFile;
var port = 3001;
var bFront = false, bBack = false, bPPM = false;


/*
* Parsing a JSON file
*/
var parseConfig = function (fileName){
    try { var obj = jsonfile.readFileSync(fileName); }
    catch (err) { throw err; }
    return obj;
};


// COMMAND LINE ARGUMENT PROCESSING
process.argv.forEach(function (val, index, array){
    if (val === '--front') bFront = true; // test for front-end
    if (val === '--back') bBack = true; // test for back-end
    if (val === '--ppm') bPPM = true; // with PPM or not

    if (val === '--conf') { // conf file : obligatory in every mode !!
        if (! array[index + 1]) throw "usage : ";
        bean = parseConfig(array[index + 1]);
    }
    if (val === '-pdb') { // pdb file
        if (! array[index + 1]) throw "usage : ";
        pdbFile = array[index + 1];
    }
    if (val === '-deter') { // detergent file
        if (! array[index + 1]) throw 'usage : ';
        deterFile = array[index + 1];
    }
});


/********
FOR FRONT
********/
if (bFront) {
    worker = pipeline.mimicCompute;

/***********************
FOR BACK OR NORMAL MODES
***********************/
} else {
    pipeline.start(bean);
    worker = pipeline.corona;
}

/*******
FOR BACK
*******/
if (bBack) {
    HTTP_lib.backCompute(worker, pdbFile, deterFile, bPPM);

/************************
FOR FRONT OR NORMAL MODES
************************/
} else {
    HTTP_lib.httpStart(worker);
}






