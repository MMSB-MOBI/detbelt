var SERVER_DOMAIN = ('http://127.0.0.1:3001'); // 3001
var CLIENT_VERSION=0.1;
//description of the client

window.$ = window.jQuery = require("jquery");
var Backbone = require('backbone');
var EventEmitter = require('events');
var io = require('socket.io-client/dist/socket.io.js');
var path = require('path');

var pdbSubmit = require('./web/js/pdbSubmit.js');
var dBox = require('./web/js/dBox.js');
require("./app.css");

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
    self = this;
    var cp1 = pdbSubmit.new({root : "#main", idNum : 1 });
    var cp2 = dBox.new({root : "#main",idNum : 2}); 
    createHeader("body .page-header");
    createFooter("body footer");

    socket.on("results", function (data) {
        console.log("data result in app.js : ");
        console.dir(data);
        cp2.dataTransfert(data);
    });

    cp1.display();
    cp1.on("ngl_ok",function(fileContent){
        cp1.removeClass("col-xs-12");
        cp1.addClass("col-xs-8");
        cp2.display(fileContent);
    });

    cp1.on("display",function(){
        cp1.addClass("col-xs-12");
    })

    cp2.on("display",function(){
        cp2.addClass("col-xs-4");
    })
    cp2.on("submit", function(data){
        cp1.setWait("loadON");
        socket.emit("submission", data);
    });

    cp2.on("result",function(pdbText, data, detList){
        cp1.nglRefresh(pdbText, data, detList);
    });

    cp2.on("edition",function(detList,deterAndVolumeList){
        cp1.nglEditionBelt(detList,deterAndVolumeList);
    });
});
