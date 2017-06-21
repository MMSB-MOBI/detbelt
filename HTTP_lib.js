var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var events = require ('events');
var fs = require('fs');
var bodyParser = require('body-parser');


var port = 3001;


/*
* Parsing a JSON file thanks a path [string] and returns a JSON [object]
*/
var parseConfig = function (fileName){
    try { var obj = jsonfile.readFileSync(fileName); }
    catch (err) { throw err; }
    return obj;
};


/*
* Read a file thanks a path [string] and return its content [string]
*/
var readFileContent = function (fileName){
    try { var obj = fs.readFileSync(fileName, 'utf8'); }
    catch (err) { throw err; }
    return obj;
};


/*
* For back-end tests
* @worker [function] : to run
* @pdbFile [string] : path to the PDB of the user
* @deterFile [string] : path to the detergent file of the user (contains the quantities of each detergent)
* @requestPPM [boolean] : define if we need to run PPM (true) or not (false)
*/
var backCompute = function (worker, pdbFile, deterFile, requestPPM) {
    if (! worker) throw 'No worker function detected'
    if (! pdbFile) throw 'No PDB file detected';
    if (! deterFile) throw 'No detergent file detected';
    var data_input = {
        'fileContent' : readFileContent(pdbFile),
        'deterData' : readFileContent(deterFile),
        'requestPPM' : requestPPM
    };
    worker(data_input)
    .on('jobCompletion', function (jsonRes, jobObject) {
        console.log('end of back-end tests : ');
        console.log(jsonRes);
    });
}


/*
* Define routes for the client
*/
var setClientRoute = function(app) {
    app.use(bodyParser.json({limit: '5mb'})); // for parsing application/json
    app.use(bodyParser.urlencoded({limit: '5mb',extended: false}));
    app.use('/bundle', express.static(__dirname + '/js'));
    app.use('/assets',express.static(__dirname+'/data/bin'));
    app.use('/ngl',express.static(__dirname+'/web/js/ngl-master/dist'));
    app.use('/download',express.static(__dirname+'/data/download'));
}


/*
* Connect the server to the client : for front-end tests and normal mode
* @worker [function] : to run (for front-end tests = a "pipo" function,
* for normal mode = a function performing the computations)
*/
var httpStart = function (worker) {
	setClientRoute(app);

	app.get('/', function(req, res) {
        res.sendFile(__dirname+'/web/html/template.html');
    });
    
    // listening the server
    server.listen(port, function () {
        console.log('Server listening on port ' + port + ' !');
    });
    
    // connection via socket
    io.on("connection", function(socket) {
        socket.on("submission", function (data) {
            //console.log(data);
            worker(data)
            .on('jobCompletion', function (jsonRes, jobObject) {
                //console.log(jsonRes);
                    socket.emit('results', jsonRes);
            });;
        });
    });
}


module.exports = {
    httpStart : httpStart,
    backCompute : backCompute
};

