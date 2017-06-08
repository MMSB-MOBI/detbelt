var SERVER_DOMAIN = ('http://127.0.0.1:3001'); // 3001
var CLIENT_VERSION=0.1;
//description of the client

window.$ = window.jQuery = require("jquery");
var Backbone = require('backbone');
var EventEmitter = require('events');
var io = require('socket.io-client/dist/socket.io.js');
var path = require('path');
var bootStrap = require('bootstrap');
var pdbSubmit = require('./web/js/pdbSubmit.js');
var dBox = require('./web/js/dBox.js');
var downloadBox = require('./web/js/downloadBox.js');
require("./app.css");

var jsonFile = SERVER_DOMAIN+"/assets/detergents.json";
var socket = io.connect(SERVER_DOMAIN);
socket.on('connect', function(){
    console.log("connecté");
});


var createHeader = function (elem) {
    $(elem).append('<h1>Welcome to the Corona Project </h1>'
            +' <h4>A web server for the modeling of detergent belts around a membrane protein </h4>'
            + '<div class="disclaimer"><ul class="fa-ul">'
            + '<li><i class="fa-li fa-2x fa fa-exclamation-triangle"></i>Corana will remove the heteroatoms of your pdb file</li>'
            + '<li><i class="fa-li fa-2x fa fa-exclamation-triangle"></i>Please ensure that your PDB file contains the biological unit</li>'
            + '</ul></div>');
}

var createFooter = function (elem){
    $(elem).find('div p').text('Corona Project client v' + CLIENT_VERSION);
}

$(function(){
    var self = this;
    var cpSubmitBox = pdbSubmit.new({root : "#main", idNum : 1 });
    var cpDetBox = dBox.new({root : "#main",idNum : 2}); 
    var cpDownloadBox = downloadBox.new({root : "#main", idNum : 3})
    createHeader("body .page-header");
    createFooter("body footer");

    socket.on("results", function (data) {
        cpDetBox.dataTransfert(data);
    });

    socket.on("fileAvailable", function (data) {
        cpDownloadBox.downloadFile(data);
    });

    cpSubmitBox.display(jsonFile);
    

    cpSubmitBox.on("ngl_ok",function(fileContent){
        self.pdbFile = fileContent;
        cpSubmitBox.removeClass("col-xs-12");
        cpSubmitBox.addClass("col-xs-8");
        cpDetBox.display(jsonFile);
    });
/*
    cpSubmitBox.on("giveCoronaData",function(halfH, proteinRadius, ahs, volume, beltRadius){
        self.halfH = halfH;
        self.proteinRadius = proteinRadius;
        self.ahs = ahs;
        self.volume = volume;
        self.beltRadius = beltRadius;       
    });
*/
    cpSubmitBox.on("display",function(){
        cpSubmitBox.addClass("col-xs-12");
    });

    cpDownloadBox.on("display",function(){
        cpDownloadBox.addClass("col-xs-4");
    });

    cpDetBox.on("display",function(){
        cpDetBox.addClass("col-xs-4");
    });

    cpDetBox.on("submit", function(requestPPM, detList){
        var data = {"fileContent" : self.pdbFile, "requestPPM" : requestPPM , "deterData" : detList};
        cpSubmitBox.setWait("loadON");
        cpSubmitBox.chooseColor(data.deterData);
        console.log("submit : "+data);
        socket.emit("submission", data);
    });

    cpDetBox.on("result",function(pdbText, data){
        cpSubmitBox.nglRefresh(pdbText, data);
        cpDetBox.animationBox();
    });

    cpDetBox.on("moved",function(){
        cpDownloadBox.display();
    });

    cpDetBox.on("edition",function(detList){
        cpSubmitBox.editionColor(detList);
    });
    

    
    cpDownloadBox.on("clickDL", function(type){
        console.log("passe par app.js");
         var data = cpSubmitBox.getCoronaData();
         console.log(data);
         socket.emit(type, data);
    });
});

  /* DELETE THESE
    cpDownloadBox.on("clickDownloadPymol", function(){
        console.log("passe par app.js");
        var data = {"halfH" : self.halfH, "beltRadius" : self.belt_radius};
        socket.emit("downloadPymol", data);
    });

    cpDownloadBox.on("clickDownloadPdb", function(){
        console.log("passe par app.js");
        socket.emit("downloadPdb");
    });

    cpDownloadBox.on("clickDownloadZip", function(){
        console.log("passe par app.js");
        var data = {"halfH" : self.halfH, "beltRadius" : self.belt_radius};
        socket.emit("downloadZip", data);
    });

    cpDownloadBox.on("clickDownloadData", function(){
        console.log("passe par app.js");
        var data = {"halfH" : self.halfH, "proteinRadius" : self.proteinRadius, "ahs" : self.ahs, "volumeCorona" : self.volume, "beltRadius" : self.beltRadius};
        socket.emit("downloadData", data);
    });

*/

