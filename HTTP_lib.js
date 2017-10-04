var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var events = require ('events');
var fs = require('fs');
var bodyParser = require('body-parser');


var port = 3001;


/*
* Parsing a JSON file thanks to a @path [string] and returns a JSON [object]
*/
var parseConfig = function (path){
    if (! path) console.log('ERROR in parseConfig : no path specified');
    try { var obj = jsonfile.readFileSync(path); }
    catch (err) { throw err; }
    return obj;
};


/*
* Read a file thanks to a @path [string] and return its @content [string]
*/
var readFileContent = function (path){
    if (! path) console.log('ERROR in readFileContent : no path specified');
    try { var content = fs.readFileSync(path, 'utf8'); }
    catch (err) { throw err; }
    return content;
};


/*
* For back-end tests
* @worker [function] : to run
* @pdbFile [string] : path to the PDB of the user
* @deterFile [string] : path to the detergent file of the user (contains the quantities of each detergent)
* @requestPPM [boolean] : define if we need to run PPM (true) or not (false)
*/
var backCompute = function (worker, pdbFile, deterFile, requestPPM) {
    if (! worker) throw 'No worker function detected';
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
var setClientRoute = function(app, downloadRoute) {
    app.use(bodyParser.json({limit : '5mb'})); // for parsing application/json
    app.use(bodyParser.urlencoded({limit : '5mb', extended : false}));
    app.use('/bundle', express.static(__dirname + '/js'));
    app.use('/assets', express.static(__dirname + '/static'));
    app.use('/ngl', express.static(__dirname + '/web/js/ngl-master/dist'));
    app.use('/resultSample', express.static(__dirname + '/data/resultSample/'));
    app.use('/download', express.static(downloadRoute));
}


/*
* Connect the server to the client : for front-end tests and normal modes.
* @worker [function] : to run (for front-end tests = a "pipo" function,
*   for normal mode = a function performing the computations)
* @downloader [function] : to download files (for front-end tests = same pipo function,
*   for normal mode = a function creating the files and returning their path)
* @downloadRoute [string] : path to the cache directory where download files will be saved
*/
var httpStart = function (worker, downloader, downloadRoute) {
    if (! worker) throw 'No worker function detected';
    if (! downloader) throw 'No downloader function detected';
    if (! downloadRoute) throw 'No downloadRoute function detected';

    setClientRoute(app, downloadRoute);
	app.get('/', function(req, res) {
        res.sendFile(__dirname+'/web/html/template.html');
    });

    // listening the server
    server.listen(port, function () {
        console.log('Server listening on port ' + port + ' !');
    });

    // connection via socket
    io.on("connection", function (socket) {
        var results; // keep the results in case user wants to download or else
        socket
        .on("submission", function (data) {
            //console.log(data);
            worker(data)
            .on('jobCompletion', function (jsonRes, jobObject) {
                results = jsonRes;
                socket.emit('results', results);
            });
        })
        .on("downloadPymol", function (newData) {
            var mode = "pymolScript";
            downloader(mode, newData).on('pymolAvailable', function (pathFile) {
                socket.emit('fileAvailable', {"mode" : mode, "path" : pathFile});
            });
        })
        .on("downloadPdb", function (newData) {
            var mode = 'pdbFile';
            downloader(mode, newData, results).on('pdbAvailable', function (pathFile) {
                socket.emit('fileAvailable', {"mode" : mode, "path" : pathFile});
            });
        })
        .on("downloadData", function (newData) {
            var mode = 'dataFile';
            downloader(mode, newData).on('dataAvailable', function (pathFile) {
                socket.emit('fileAvailable', {"mode" : mode, "path" : pathFile});
            });
        })
        .on("downloadZip", function (newData) {
            var mode = 'zip';
            downloader(mode, newData, results).on('zipAvailable', function (pathFile) {
                socket.emit('fileAvailable', {"mode" : mode, "path" : pathFile});
            });
        });
    });
}


module.exports = {
    httpStart : httpStart,
    backCompute : backCompute
};

