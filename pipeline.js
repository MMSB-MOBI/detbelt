// corona server implementation

var jsonfile = require('jsonfile');
var jobManager = require('nslurmardocklegacy');
var uuid = require('node-uuid');
var fs = require('fs');
var events = require ('events');


// variables
var dictJobManager;
var tagTask = 'corona';

var jobManagerIsStarted = false;


/*
* Create the string containing the parameters of the user (quantity and detergent)
*/
var detergentDumper = function (list) {
    var string = '';
    for (var i in list) {
        // console.log(i);
        // console.log(list[i]);
        string += list[i].qt + ' ' + list[i].detName + '\n';
    }
    return string;
}


/*
* Initialize the job manager
*/
var initBackend = function(bean) {
    //console.log("Initializing Job Manager");
    jobManager.start(bean.managerSettings);
    dictJobManager = bean;
    //console.dir(dictJobManager);
}


/*
* Access to the result files and put them into a same JSON
*/
var readResults = function (resultsPath) {
    var re_protRadius = /REMARK protein_radius {1,4}[\.0-9]{1,6}/;
    var re_beltRadius = /REMARK belt_radius {1,4}[0-9.]{1,6}/;
    var re_halfThickness = /REMARK {1,9}1\/2 of bilayer thickness: {1,5}[0-9.]{1,6}/;
    var jsonRes = {
        'fileContent' : '',
        'data' : {}
    };
    // open the files
    try {
        var pdbFile = fs.readFileSync(resultsPath + '/forDisplay.pdb', 'utf8');
        var vol = fs.readFileSync(resultsPath + '/Volume_total.txt', 'utf8');
    } catch (err) { throw err; }
    // format the results
    var protRadius = pdbFile.match(re_protRadius)[0].split(' ');
    var beltRadius = pdbFile.match(re_beltRadius)[0].split(' ');
    var halfThickness = pdbFile.match(re_halfThickness)[0].split(' ');

    vol = vol.replace('\n', '');
    protRadius = protRadius[protRadius.length-1];
    beltRadius = beltRadius[beltRadius.length-1];
    halfThickness = halfThickness[halfThickness.length-1];

    // add to the JSON
    jsonRes.fileContent = pdbFile;
    jsonRes.data['volTot'] = vol;
    jsonRes.data['proteinRadius'] = protRadius;
    jsonRes.data['radius'] = beltRadius;
    jsonRes.data['halfH'] = halfThickness;
    //console.log(jsonRes);
    return jsonRes;
}


/*
* Configuring the jobObt for nslurmLegacy.
* WARNING : this version of configJob is adapted to the nslurmeLegacy job manager only !
*/
var configJob = function (mode, cluster, exportVar, modules, coreScript, idTask) {
    var jobOpt = {
        'id' : idTask,
        'tWall' : '0-00:15',
        'script' : coreScript,
        'modules' : modules,
        'exportVar' : exportVar
    };
    // parameters depending to the mode and the cluster
    if (mode === 'gpu') {
        jobOpt['nCores'] = 1;
        jobOpt['gres'] = 'gpu:1';
        if (cluster === 'arwen') {
            jobOpt['partition'] = 'gpu_dp';
            jobOpt['qos'] = 'gpu';
        } else if (cluster === 'arwen-dev') {
            jobOpt['partition'] = 'gpu';
            jobOpt['qos'] = 'gpu';
            jobOpt['gid'] = 'ws_users';
            jobOpt['uid'] = 'ws_corona';
        } else {
            console.log("ERROR in configJob : cluster not recognized. It must be \"arwen\" or \"arwen-dev\" !");
        }
    } else if (mode === 'cpu') {
        jobOpt['nCores'] = 1;
        // no gres option on CPU
        if (cluster === 'arwen') {
            jobOpt['partition'] = 'mpi-mobi';
            jobOpt['qos'] = 'mpi-mobi';
        } else if (cluster === 'arwen-dev') {
            jobOpt['partition'] = 'ws-dev';
            jobOpt['qos'] = 'ws-dev';
            jobOpt['gid'] = 'ws_users';
            jobOpt['uid'] = 'ws_corona';
        } else {
            console.log("ERROR in configJob : cluster not recognized. It must be \"arwen\" or \"arwen-dev\" !");
        }
    } else {
        console.log("ERROR in configJob : mode not recognized. It must be \"cpu\" or \"gpu\" !");
    }
    return jobOpt;
}


/*
*
*/
var configJobCorona = function (cacheDir, requestPPM) {
    var idTask = tagTask + 'Task_' + uuid.v4();
    var exportVar = {}, modules = [], coreScript;

    if (requestPPM) { // with PPM
        exportVar['ppmResidueLib'] = dictJobManager.scriptVariables.BIN_DIR + '/res.lib';
        modules.push('ppm');
        coreScript = dictJobManager.scriptVariables.BIN_DIR + '/withPPM.sh';
    } else { // without PPM
        coreScript = dictJobManager.scriptVariables.BIN_DIR + '/withoutPPM.sh';
    }

    exportVar['pdbFile'] = cacheDir + '/' + idTask + '_inputs/' + idTask + '.pdb';
    exportVar['detergentFile'] = cacheDir + '/' + idTask + '_inputs/' + idTask + '.detergent';
    exportVar['orientForDisplay'] = dictJobManager.scriptVariables.BIN_DIR + '/rotateDirty.pl';
    exportVar['detergentVolumes'] = dictJobManager.scriptVariables.BIN_DIR + '/detergentVolumes.txt';
    exportVar['calculateVolTot'] = dictJobManager.scriptVariables.BIN_DIR + '/calculateVolTot.py';
    exportVar['calculateRadius'] = dictJobManager.scriptVariables.BIN_DIR + '/calculateRadius.R';
    modules.push('naccess');
    modules.push('R');

    var jobOpt = configJob('cpu', 'arwen-dev', exportVar, modules, coreScript, idTask);
    //console.log(jobOpt);
    return jobOpt;
}



/*
* Coronna project computation
* @data [JSON] = contains :
*    - pdbFile [string] = PDB file of the user
*    - requestPPM [boolean] = indicate if we need to run with PPM or not
*    - deterData [list of JSON OR string] = informations about the detergents. JSON must be like :
*    {'detName' : 'DDM', 'qt' : 461} so it must be dumpered
*/
var corona = function (data) {
    var emitter = new events.EventEmitter();
    var cacheDir = jobManager.cacheDir();
    var deterData;

    // configure the job
    var jobOpt = configJobCorona(cacheDir, data.requestPPM);

    // write the pdbFile and the detergent file in the cacheDir
    if (typeof data.deterData === 'object') { deterData = detergentDumper(deterData); }
    else { deterData = data.deterData; }
    try {
        fs.mkdirSync(cacheDir + '/' + jobOpt.id + '_inputs/');
        fs.writeFileSync(jobOpt.exportVar.pdbFile, data.fileContent);
        fs.writeFileSync(jobOpt.exportVar.detergentFile, deterData);
    } catch (err) { throw err; }

    // run
    var j = jobManager.push(jobOpt);
    j.on('completed', function (stdout, stderr, jobObject){
        if (stderr) {
            stderr.on('data', function (buf){
                console.log("stderr content:");
                console.log(buf.toString());
            });
        }
        var results = '';
        stdout
        .on('data', function (buf){
            results += buf.toString();
        })
        .on('end', function (){
            var jsonRes = JSON.parse(results);
            jsonRes = readResults(jsonRes.resultsPath);
            console.log('jobCompletion');
            emitter.emit('jobCompletion', jsonRes, jobObject);
        });
    })
    .on('error',function (err, j){
        console.log("job " + j.id + " : " + err);
        emitter.emit('error', err, j.id);
    })
    .on('lostJob', function (err, j) {
        console.log("job " + j.id + " : " + err);
    });
    return emitter;
}


/*
* For front-end tests
*/
var mimicCompute = function (data) {
    var emitter = new events.EventEmitter();
    // false results
    var proteinRadius = 23.26;
    var beltRadius = 51.86;
    var halfH = 15.9 ;
    var volTot = 214681.0;
    var fileContent = fs.readFileSync("./data/resultSample/out_orientedForDisplay.pdb", "utf8");
    var results = {
        "fileContent" : fileContent,
        "data": {
            "radius" : beltRadius,
            "halfH" : halfH,
            "volTot" : volTot,
            "proteinRadius" : proteinRadius
        },
        "inputs" : data
    };
    console.log("answering w/ " + results);
    setTimeout(function () {
        emitter.emit('jobCompletion', results);
    }, 10);
    return emitter;
}


module.exports = {
    start : initBackend,
    mimicCompute : mimicCompute,
    corona : corona
};


