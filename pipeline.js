// corona server implementation
const { simpleflake } = require('simpleflakes');
var uuid = require('node-uuid');
var fs = require('fs');
var events = require ('events');
var zipper = require('adm-zip');
var JSON = require('JSON');

const { PromiseManager } = require('msjob-aspromise')



// variables
var dictJobManager;
let jobmanagerClient; 
var tagTask = '';

/*
Create inputs/results directory
*/
const getRandomDirFromCache = (id) => {
    const base = dictJobManager.managerSettings.forceCache;

    const dir = base + id;

    fs.mkdirSync(dir, { recursive: true });

    return dir
}

/*
* Create the string containing the parameters of the user (quantity and detergent)
*/
var detergentDumper = function (list) {
    if (! list) console.log('ERROR in detergentDumper : no list specified');
    var string = '';
    for (var i in list) {
        // console.log(i);
        // console.log(list[i]);
        string += list[i].qt + ' ' + list[i].detName + '\n';
    }
    return string;
}


/*
* Create the string containing the volume of each detergent
*/
var deterVolDumper = function (list) {
    if (! list) console.log('ERROR in deterVolDumper : no list specified');
    var string = '';
    for (var i in list) {
        console.log(i);
        console.log(list[i]);
        string += list[i].name + ' ' + list[i].vol + '\n';
    }
    return string;
}


/*
* Initialize the job manager thanks to the settings in @bean
*/
var initBackend = async function(bean) {
    if (! bean) console.log('ERROR in initBackend : no bean specified');
    //console.log("Initializing Job Manager");
    dictJobManager = bean;
    jobmanagerClient = new PromiseManager(bean.managerSettings.tcp, bean.managerSettings.port)
    await jobmanagerClient.start()
    
    //console.dir(dictJobManager);
}


/*
* Access to the result files thanks to the @resultsPath and put them into a same JSON to return it
*/
var readResults = function (resultsPath) {
    if (! resultsPath) console.log('ERROR in readResults : no resultsPath specified');
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
        var volumeCorona = fs.readFileSync(resultsPath + '/Volume_total.txt', 'utf8');
        var ahs = fs.readFileSync(resultsPath + '/ahs.txt', 'utf8');
    } catch (err) { throw err; }
    // format the results
    var protRadius = pdbFile.match(re_protRadius)[0].split(' ');
    var beltRadius = pdbFile.match(re_beltRadius)[0].split(' ');
    var halfThickness = pdbFile.match(re_halfThickness)[0].split(' ');

    volumeCorona = volumeCorona.replace('\n', '');
    ahs = parseInt(ahs.replace('\n', ''));
    protRadius = protRadius[protRadius.length-1];
    beltRadius = beltRadius[beltRadius.length-1];
    halfThickness = halfThickness[halfThickness.length-1];

    // add to the JSON
    jsonRes.fileContent = pdbFile;
    jsonRes.data['volumeCorona'] = volumeCorona;
    jsonRes.data['ahs'] = ahs;
    jsonRes.data['proteinRadius'] = protRadius;
    jsonRes.data['beltRadius'] = beltRadius;
    jsonRes.data['halfH'] = halfThickness;
    //console.log(jsonRes);
    return jsonRes;
}


/*
* Configuring the @jobObt [JSON] for nslurmLegacy.
* WARNING : this version of configJob is adapted to the nslurmeLegacy job manager only !
* INPUTS :
*   @mode [string] : must be 'gpu' or 'cpu'
*   @cluster [string] : must be 'arwen' or 'arwen-dev'
*   @exportVar [JSON] : indicate the variables to export in the sbatch script to be passed to the coreScript
*   @modules [string[]] : indicate the modules to load in the sbatch script
*   @coreScript [string] : path to the coreScript template
*   @idTask [string] : uuid of the task
*/
var configJob = function (mode, cluster, exportVar, modules, coreScript, idTask) {
    if (! mode) console.log('ERROR in configJob : no mode specified');
    if (! cluster) console.log('ERROR in configJob : no cluster specified');
    if (! exportVar) var exportVar = {};
    if (! modules) var modules = [];
    if (! coreScript) console.log('ERROR in configJob : no coreScript specified');
    if (! idTask) console.log('ERROR in configJob : no idTask specified');
    var jobOpt = {
        'script' : coreScript,
        'modules' : modules,
        'exportVar' : exportVar,
        'jobProfile' : dictJobManager.managerSettings.jobProfile,
        'sysSettingsKey' : dictJobManager.managerSettings.sysSettings
    };

    return jobOpt;
}


/*
* Configure a corona job using the @configJob() method
* INPUTS :
*   @cacheDir [string] : cache directory where user files will be written
*   @requestPPM [boolean] : indicate if we need to run PPM (true) or not (false)
*/
var configJobCorona = function (cacheDir, id, requestPPM) {
    if (! cacheDir) console.log('ERROR in configJobCorona : no cacheDir specified');
    if (! requestPPM) console.log('ERROR in configJobCorona : no requestPPM specified');
    var idTask = id
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
    exportVar['detergentVolumes'] = cacheDir + '/' + idTask + '_inputs/' + idTask + '_det_volume.json';
    exportVar['orientForDisplay'] = dictJobManager.scriptVariables.BIN_DIR + '/rotateDirty.py';
    exportVar['calculateVolTot'] = dictJobManager.scriptVariables.BIN_DIR + '/calculateVolTot.py';
    exportVar['calculateRadius'] = dictJobManager.scriptVariables.BIN_DIR + '/calculateRadius.R';
    modules.push('naccess_ws3');
    modules.push('R_ws3');

    var jobOpt = configJob('cpu', 'arwen-dev', exportVar, modules, coreScript, idTask);
    //console.log(jobOpt);
    return jobOpt;
}




/*
* Corona project computation
* @data [JSON] = contains :
*    - pdbFile [string] = PDB file of the user
*    - requestPPM [boolean] = indicate if we need to run with PPM or not
*    - deterData [list of JSON OR string] = informations about the detergents. JSON must be like :
*    {'detName' : 'DDM', 'qt' : 461} so it must be dumpered
    - deterVolumes : json with detergents volumes (database snapshot)
*/
var compute = function (data) {
    if (! data) throw 'ERROR in compute() function : no data specified';
    var emitter = new events.EventEmitter();
    const id = simpleflake().toString()
    const cacheDir = getRandomDirFromCache(id)

    var deterData;

    // configure the job
    var jobOpt = configJobCorona(cacheDir, id, data.requestPPM);

    // write the pdbFile and the detergent file in the cacheDir
    if (typeof data.deterData === 'object') { deterData = detergentDumper(data.deterData); }
    else { deterData = data.deterData; }
    try {
        fs.mkdirSync(cacheDir + '/' + id + '_inputs/');
        fs.writeFileSync(jobOpt.exportVar.pdbFile, data.fileContent);
        fs.writeFileSync(jobOpt.exportVar.detergentFile, deterData);
        fs.writeFileSync(jobOpt.exportVar.detergentVolumes, JSON.stringify(data.deterVol))
    } catch (err) { throw err; }

    // run
    jobmanagerClient.push(jobOpt)
        .then(res => {
            try {
                const path = JSON.parse(res).resultsPath
                console.log("JOB DONE", path)
                const jsonRes = readResults(path)
                emitter.emit('jobCompletion', jsonRes)
            } catch(e) {
                console.error(e)
                emitter.emit('stderrContent', "error while parsing results")
            }
            
            
        })
        .catch(e => {
            console.error("JOB ERROR", e)
            emitter.emit('stderrContent', "detbelt was unable to proceed your molecule")
        })
    return emitter;
}


/*
* For front-end tests : simulate a computation
*/
var mimicCompute = function (data) {
    var emitter = new events.EventEmitter();
    // false results
    var proteinRadius = 23.26;
    var beltRadius = 51.86;
    var halfH = 15.9;
    var volumeCorona = 214681.0;
    var ahs = 69.00;
    var fileContent = fs.readFileSync("./data/resultSample/out_orientedForDisplay.pdb", "utf8");
    var results = {
        "fileContent" : fileContent,
        "data" : {
            "beltRadius" : beltRadius,
            "halfH" : halfH,
            "volumeCorona" : volumeCorona,
            "proteinRadius" : proteinRadius,
            "ahs" : ahs
        }
    };
    console.log("answering w/ " + results);
    async(function () { /* nothing */ }).on('end', () => {
        emitter.emit('jobCompletion', results)
    });
    return emitter;
}


/*
* Convert an @array into a string : @str
*/
var tabToString = function (array) {
    if (! array) return '';
    var str = '[';
    for (var i = 0; i < array.length; i ++) {
        str += array[i];
        if (i !== array.length-1) str += ',';
    }
    str += ']';
    return str;
}


/*
* Create the content of the PyMOL script and return a JSON containing its name and its @content
*/
var create_pymolScript = function (halfH, beltRadius, colorBelt = [0.3,0.3,0.3], lowerError = 0, upperError = 0) {
    if (! halfH) console.log('ERROR in create_pymolScript : no halfThickness specified');
    if (! beltRadius) console.log('ERROR in create_pymolScript : no beltRadius specified');
    
    /* VERSION FOR THE "DRAWCORONA" FUNCTION
    var re_line = "def drawCorona (PDBfile, halfThickness = , beltRadius = , lowerError = , upperError = , color = ):";
    var new_line = "def drawCorona (PDBfile, halfThickness = "+ halfH +", beltRadius = "+ beltRadius.toFixed(2) +", lowerError = "+ lowerError +", upperError = "+ upperError +", color = "+ tabToString(colorBelt) +"):";
    // replace all the values of the function
    content = readFileContent(dictJobManager.scriptVariables.BIN_DIR + '/pymolScript.pml')
    .replace(re_line, new_line);
    */

    var re_values = "halfThickness = \nbeltRadius = \ncolor = ";
    var new_values = "halfThickness = "+ halfH + "\nbeltRadius = " + beltRadius.toFixed(2) + "\ncolor = " + tabToString(colorBelt);
    content = readFileContent(dictJobManager.scriptVariables.BIN_DIR + '/pymolScript.pml')
    .replace(re_values, new_values);

    return {"pymolScript.pml" : content};
}


/*
* Create the content of the PDB file and return a JSON containing its name and its @content
*/
var create_pdb = function (pdb, beltRadius) {
    if (! pdb) console.log('ERROR in create_pdb : no pdb specified');
    if (! beltRadius) console.log('ERROR in create_pdb : no beltRadius specified');
    var re_beltRadius = /REMARK belt_radius {1,4}[0-9.]{1,6}/;
    var content = pdb.replace(re_beltRadius, 'REMARK belt_radius  ' + beltRadius.toFixed(2));
    return {"file.pdb" : content};
}


/*
* Create the content of the data file and return a JSON containing its name and its @content
*/
var create_dataFile = function (halfThickness, beltRadius, protRadius, ahs, volumeCorona) {
    if (! halfThickness) console.log('ERROR in create_dataFile : no halfThickness specified');
    if (! beltRadius) console.log('ERROR in create_dataFile : no beltRadius specified');
    if (! protRadius) console.log('ERROR in create_dataFile : no protRadius specified');
    if (! ahs) console.log('ERROR in create_dataFile : no ahs specified');
    if (! volumeCorona) console.log('ERROR in create_dataFile : no volumeCorona specified');
    var content = '';
    content += 'half_thickness;' + halfThickness + '\n';
    content += 'belt_radius;' + beltRadius.toFixed(2) + '\n';
    content += 'protein_radius;' + protRadius + '\n';
    content += 'ahs;' + ahs + '\n';
    content += 'volume_belt;' + volumeCorona + '\n';
    return {"resultsFile.csv" : content};
}


/*
* Create a zip file and its content according to the @data and return the @path
* @data [JSON] : each couple {key : value} are associated to a file. The key represents the file name
*   and the "value" represents the content of the file
*/
var create_zip = function (data) {
    if (! data) console.log('ERROR in create_zip : no data specified');
    if (typeof data === 'object') {
        var id = uuid.v4(); // id of the zip
        var zipPath_server = dictJobManager.scriptVariables.DOWNLOAD_DIR + '/' + id + ".zip";
        var zipPath_client = '/download/' + id + ".zip";
        var zip = new zipper();

        for (var key in data) {
            zip.addFile(key, new Buffer(data[key]));
        }

        zip.writeZip(zipPath_server);
        return zipPath_client;
    } else {
        console.log('ERROR in create_zip : data must be a JSON');
        return null;
    }
}


/*
* Concatenate the JSON from the @list and return the final JSON
*/
var concatJson = function (listJson) {
    if (! listJson) console.log('ERROR in concatJson : no listJson specified');
    var str = '';
    for (var i = 0; i < listJson.length; i ++) {
        var dict = JSON.stringify(listJson[i]);
        if (i === 0) { // first JSON
            dict = dict.substring(0, dict.length-1); // not the '}' of the end
            str += dict + ', ';
        } else if (i === listJson.length-1) { // last JSON
            dict = dict.substring(1, dict.length); // not the '{' of the beginning
            str += dict; // no ','
        } else { // other JSON
            dict = dict.substring(1, dict.length-1); // not the '{' and '}'
            str += dict + ', ';
        }
    }
    return JSON.parse(str);
}


/*
* Control the downloadings depending on the @mode
*/
var download = function (mode, newData, oldData) {
    console.log("pipeline.js download")
    console.log("mode", mode)
    console.log("newData", newData)
    console.log("oldData", oldData)
    if (! mode) console.log('ERROR in download() method : no mode specified');
    if (! newData) console.log('ERROR in download() method : no newData specified');
    var emitter = new events.EventEmitter();
    // console.dir(oldData);
    // console.dir(mode);
    // console.log(newData);
    if (mode === 'pymolScript') {
        async(function () {
            var dict = create_pymolScript(newData.halfH, newData.beltRadius, newData.colorBelt, newData.lowerError, newData.upperError);
            return create_zip(dict);
        }).on('end', function(func) {
            var path = func();
            emitter.emit('pymolAvailable', path);
        });
    } else if (mode === 'pdbFile') {
        if (! oldData) console.log('ERROR in download() method : no oldData specified');
        async(function () {
            var dict = create_pdb(oldData.fileContent, newData.beltRadius);
            return create_zip(dict);
        }).on('end', function(func) {
            var path = func();
            emitter.emit('pdbAvailable', path);
        });
    } else if (mode === 'dataFile') {
        async(function () {
            var dict = create_dataFile(newData.halfH, newData.beltRadius, newData.proteinRadius, newData.ahs, newData.volumeCorona);
            return create_zip(dict);
        }).on('end', function(func) {
            var path = func();
            emitter.emit('dataAvailable', path);
        });
    } else if (mode === 'zip') {
        if (! oldData) console.log('ERROR in download() method : no oldData specified');
        async(function () {
            var dict_pymol = create_pymolScript(newData.halfH, newData.beltRadius, newData.colorBelt, newData.lowerError, newData.upperError);
            var dict_pdb = create_pdb(oldData.fileContent, newData.beltRadius);
            var dict_data = create_dataFile(newData.halfH, newData.beltRadius, newData.proteinRadius, newData.ahs, newData.volumeCorona);
            var dict = concatJson([dict_pymol, dict_pdb, dict_data]);
            return create_zip(dict);
        }).on('end', function(func) {
            var path = func();
            emitter.emit('zipAvailable', path);
        });
    } else {
        console.log('not the right mode');
    }
    return emitter;
}


/*
* For front-end tests : simulate downloadings
*/
var mimicDownload = function (mode) {
    if (! mode) console.log('ERROR in mimicDownload() method : no mode specified');
    var emitter = new events.EventEmitter();

    if (mode === 'pymolScript') {
        async(function() { /* nothing */ }).on('end', function() {
            emitter.emit('pymolAvailable', "./resultSample/pymolScript.zip");
        });
    } else if (mode === 'pdbFile') {
        async(function() { /* nothing */ }).on('end', function() {
            emitter.emit('pdbAvailable', "./resultSample/pdbFile.zip");
        });
    } else if (mode === 'dataFile') {
        async(function() { /* nothing */ }).on('end', function() {
            emitter.emit('dataAvailable', "./resultSample/resultsFile.zip");
        });
    } else if (mode === 'zip') {
        async(function() { /* nothing */ }).on('end', function() {
            emitter.emit('zipAvailable', "./resultSample/coronaResults.zip");
        });
    } else {
        console.log('not the right mode');
    }
    return emitter;
}


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
* To asynchronize functions
*/
var async = function (callback) {
    var emitter = new events.EventEmitter();
    setTimeout(function () {
        emitter.emit('end', callback);
    }, 10);
    return emitter;
};



module.exports = {
    start : initBackend,
    compute : compute,
    mimicCompute : mimicCompute,
    download : download,
    mimicDownload : mimicDownload
};


