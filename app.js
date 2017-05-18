/*
	All browserifed demo
 Simple client application which displays a table w/ bootstrap2 styling 
*/

//var bootstrap = require('bootstrap');

/* Intitial function called on page load/startup */

window.$ = window.jQuery = require("jquery");
var Backbone = require('backbone');
var EventEmitter = require('events');
require("./app.css");
var path = require('path');
var pdbSubmit = require('./web/js/pdbSubmit.js');
var dBox = require('./web/js/dBox.js');
var CLIENT_VERSION=0.1;
var io = require('socket.io-client/dist/socket.io.js');
var serverDomain = ('http://127.0.0.1:3001'); // 3001
var socket = io.connect(serverDomain);



socket.on('connect', function(){
    console.log("connecté");
});

socket.on("results", function (data) {
    console.log("reception des donnees dans app.js");
    cp2.dataTransfert(data);
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
    self = this;
    cp1 = pdbSubmit.new({root : "#main", idNum : 1 });
    cp2 = dBox.new({root : "#main",idNum : 2}); 
    createHeader("body .page-header");
    createFooter("body footer");
    cp1.display();
    cp1.on("ngl_ok",function(fileContent){
        console.log("Affichage de dBox");
        cp1.removeClass("col-xs-12");
        cp1.addClass("col-xs-8");
        cp2.display(fileContent);
    });

    cp1.on("display",function(){
        console.log("display cp1");
        cp1.addClass("col-xs-12");
    })

    cp2.on("display",function(){
        console.log("display cp2");
        cp2.addClass("col-xs-4");
    })
    cp2.on("submit", function(data){
        cp1.setWait("loadON");
        socket.emit("submission", data);
    });

    cp2.on("result",function(pdbText,data){
       
        cp1.nglRefresh(pdbText,data);
    });

    cp2.on("edition",function(detList,deterAndVolumeList){
        cp1.nglEditionBelt(detList,deterAndVolumeList);
    });
});
