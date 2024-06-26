const SERVER_DOMAIN = 'https://detbelt.ibcp.fr'; // 3008
var CLIENT_VERSION=0.9;
//description of the client

window.$ = window.jQuery = require("jquery");
var Backbone = require('backbone');
var EventEmitter = require('events');
var io = require('socket.io-client/dist/socket.io.js');
var path = require('path');
var bootStrap = require('bootstrap');
var pdbSubmit = require('./pdbSubmit.js');
var dBox = require('./dBox.js');
var downloadBox = require('./downloadBox.js');

import "../assets/styles/app.css"

// GL WebGL hack
console.log("Startin app");

//var jsonFile = "assets/detergents.json";
const socket = io.connect(SERVER_DOMAIN);
socket.on('connect', function(){
    console.log("socket connected to server domain");
    //socket.emit("pouet")
    //console.log("after pouet emit")

});

let qwest = require('qwest');

var createHeader = function (elem) {

    $(elem).append('<div class="welcomeHead"><img class="icon" src="img/detBelt.png"/>Welcome to the Det.Belt Server </div>'
            + '<div class="tutorial"><a href="gallery" target="_blank"><span>Gallery</span></a></div>'
            + '<div class="gallery"><a href="tutorial" target="_blank"><span>Tutorial</span></a></div>'
            + '<div class="headContent">The Det.Belt server allows you to have a broad idea of the detergent belt around your membrane protein. '
            + 'The detergent is represented as a transparent hollow cylinder around the hydrophobic region of the protein. '
            + 'This approximation is particularly fitted to biochemical studies to give an overall idea of what is expected '
            + 'around your membrane protein of interest. '
            + 'The calculation of the detergent belt is taking place within your web browser, which allows you to test and '
            + 'try the size of the belt with different detergents very rapidly, and to explore different combination of detergents'
            + ' (that will be represented as stacked histograms). Metrics of the detergent belt are output together with Pymol scripts '
            + 'and the output PDB file so that you can perform high quality figures for publication. <br/>'
            /*
            + 'To help gage how your detergent belt matches already published data, a plot of the '
            + 'volume_occupied_by_the_detergent=f(hydrophobic area) is created, and your query dynamically appears on the graph.'
            */
            + 'This tool is under development and we want it to be useful to the community. If you think of a useful feature, '
            + 'please email us and we will do our best to incorporate it into the pipeline. '
            + 'We welcome your feedback and bug reports at <a href="mailto:contact-detbelt@ibcp.fr">contact-detbelt@ibcp.fr</a>.'
            + '<div class="disclaimer"><ul class="fa-ul">'
            + '<li><i class="fa-li fa fa fa-info-circle"></i>Det.Belt server will remove the heteroatoms of your pdb file</li>'
            + '<li><i class="fa-li fa fa fa-info-circle"></i>Please ensure that your PDB file contains the biological unit</li>'
            + '</ul></div>'
            + '</div>'
            + '<div class="upperToggle"><i class="fa-2x fa fa-caret-up"></div>');

    $(elem).find('.upperToggle').on('click', function (){
            var but = this;
            var $divContent = $(elem).find('div.headContent');
            if( $divContent.css("display") == 'none' )
                $divContent.slideDown(400, function(){
                    $(but).find('i').remove();
                    $(but).append('<i class="fa-2x fa fa-caret-up">');
                });
            else
                $divContent.slideUp(400, function(){
                    $(but).find('i').remove();
                    $(but).append('<i class="fa-2x fa fa-caret-down">');
                });

    });
}

var createFooter = function (elem){
    $(elem).find('div p').text('DetBelt Project client v' + CLIENT_VERSION);
    $(elem).append('<img src="img/logo-cnrs.png" style=" width: 6.5em;position: absolute; top: 0.45em; left:0.25em;"/>');
    $(elem).append('<a href="https://mmsb.cnrs.fr/en/" target="_blank">' 
    + '<img src="img/logo_MMSB_200.png" style=" width: 6.5em;position: absolute; top: 0.45em; left:8em;"/>'
    + '</a>');
    $(elem).append('<img src="img/logo-uni-lyon.png" style=" width: 13.5em;position: absolute; top: -18px; right:0.25em;"/>')
}

/*const getSnapshot = async function(){
    const snapshot_url = SERVER_DOMAIN + "/apiDet/dbSnapshot"
    qwest.get(snapshot_url).then((xhr, response) => {
        console.log("qwest get snapshot")
        const det_volume = JSON.parse(response)
        return det_volume
    })
    
}*/

function getSnapshot(){
    return new Promise(resolve => {
        const snapshot_url = SERVER_DOMAIN + "/apiDet/dbSnapshot"
        qwest.get(snapshot_url).then((xhr, response) => {           
            const det_volume = JSON.parse(response)
            resolve(det_volume)
        })
    })
}

$(async function(){
    var self = this;
/*
        var listHelp = '<div class="downloadTooltip"><ul class="fa-ul">'
                    +    '<li><span style="color:steelblue;margin-left: -1.5em;font-weight:500;padding-right:1.5em;">PDB</span><span class="helpLiSpan"> coordinates file</span></li>'
                    +    '<li><span style="color:steelblue;margin-left: -1.5em;font-weight:500">PyMOL</span><span class="helpLiSpan"> visualization PYMOL script</span></li>'
                    +    '<li><i class="fa fa-li fa-file-text-o" style="color:steelblue"></i> <span class="helpLiSpan" style="padding-left:2.2em;">File containing the belt caracteristics</span></li>'
                    +    '<li><i class="fa fa-li fa-file-archive-o" style="color:steelblue"></i><span class="helpLiSpan" style="padding-left:2.2em;">PDB and PYMOL files ZIP archive</span></li>'
                    +    '</ul>'
                    + '</div>';

            $("body").append(listHelp);
            return;


//--DVL DET BOX
    cpDetBox = dBox.new({root : "#main",idNum : 2});
    cpDetBox.display(jsonFile);
    console.log("early exit");
    return;
*/
//-----
//
    const cpSubmitBox = pdbSubmit.new({root : "#main", idNum : 1 });
    const cpDetBox = dBox.new({root : "#main",idNum : 2});
    const cpDownloadBox = downloadBox.new({root : "#main", idNum : 3})
window.dev = {
	'pdbSubmit' : cpSubmitBox,
	'dBox'      : cpDetBox,
	'download'  : cpDownloadBox,
    'THREE'  : window.THREE
};


    createHeader("body .page-header");
    createFooter("body div.footer");
    const detergents_json_snapshot = await getSnapshot()
    //console.log("detergent_json_snapshot", detergents_json_snapshot)

    socket.on("results", function (data) {
       // console.log("results");
        cpDetBox.dataTransfert(data);
    });

    socket.on("fileAvailable", function (data) {
        cpDownloadBox.downloadFile(data);
    });

    socket.on('stderrContent', function (data) {
        // failed to run correctly : it is mostly due to a wrong PDB file (not from PPM for example)
        cpSubmitBox.error();
    });

    cpSubmitBox.display(detergents_json_snapshot);

    cpSubmitBox.on("ngl_ok",function(fileContent){
        self.pdbFile = fileContent;
        //cpSubmitBox.removeClass("ngl-only");
        cpSubmitBox.removeClass("col-xs-12");
        cpSubmitBox.addClass("col-xs-7");
        /* Here lines to know what detergents are available inside database */
        let url = SERVER_DOMAIN + "/apiDet/getallid/"
        qwest.get(url).get(SERVER_DOMAIN + "/apiDet/sortByCategory").then( values => {
            const infos = JSON.parse(values[0][1])
            const sortByCat = JSON.parse(values[1][1])
            cpDetBox.display(infos.data, sortByCat.data);
        })
        
    });

    cpSubmitBox.on("display",function(){
        cpSubmitBox.addClass("col-xs-12");
        //cpSubmitBox.addClass("ngl-only");
    });

    cpDownloadBox.on("display",function(){
        cpDownloadBox.addClass("col-xs-5");
    });

    cpDetBox.on("display",function(){
        cpDetBox.addClass("col-xs-5");
    });

    cpDetBox.on("submit", function(requestPPM, detList){
      console.log("detBox submit")
      //  console.log(detergents_json_snapshot)
        var data = {"fileContent" : self.pdbFile, "requestPPM" : requestPPM , "deterData" : detList, "deterVol" : detergents_json_snapshot};
      //  console.log(data); 
        cpSubmitBox.setWait("loadON");
        socket.emit("submission", data);    
    });

    cpDetBox.on("result",function(pdbText, data, detList){
        console.log("result"); 
      //  console.dir(data);
        cpSubmitBox.nglRefresh(pdbText, data, detList);
        cpDetBox.animationBox();
    });

    cpDetBox.on("moved",function(){
       // console.log("event moved");
        cpDownloadBox.display();
    });

    cpDetBox.on("edition",function(detList){
     //   console.log("lance Edition");
        cpSubmitBox.removeOldCorona(detList);
    });

    cpDownloadBox.on("clickDL", function(type){
      //  console.log("passe par app.js");
         var data = cpSubmitBox.getCoronaData();
      //   console.log(data);
         socket.emit(type, data);
    });

// added by Sébastien Delolme-Sabatier 

    cpDetBox.on("askInfos",function(request){
        let url = SERVER_DOMAIN + "/apiDet/getOne/"+request
        let to_send = {};
        if(document.getElementsByTagName("advanced-sheet-handler").length===0){
            document.addEventListener('sheetLoaded',function(){
                let sheet = document.getElementsByTagName('advanced-sheet')[0];
                qwest.get(url).then(function(xhr,response){
                    let infos = JSON.parse(response)
                    for (let i of Object.keys(infos.data[0])){
                        if (i!=="image" && i!=="PDB_file"){
                            if(i === "volume"){
                                
                                to_send[i]=infos.data[0][i]+" Å\u00B3";
                            }
                            else if(i === "CMC"){
                                to_send[i] = infos.data[0][i] + " mM"
                            }
                            else if(i === "color"){
                                
                                to_send[i] = "rgb("+infos.data[0][i].toString()+")"
                            }
                            else{
                             to_send[i]=infos.data[0][i]  
                            }
                        }
                    }
                    sheet.data={"data":[to_send]}
                    sheet.pdbFile = "/pdb/"+request+".pdb"
                })
            })
        }
        else{
            let sheet = document.getElementsByTagName('advanced-sheet')[0];
            qwest.get(url).then(function(xhr,response){
                let infos = JSON.parse(response)
                for (let i of Object.keys(infos.data[0])){
                    if (i!=="image" && i!=="PDB_file"){
                        if(i === "volume"){        
                            to_send[i]=infos.data[0][i]+" Å\u00B3";
                        }
                        else if(i === "CMC"){
                            to_send[i] = infos.data[0][i] + " mM"
                        }
                        else if(i === "color"){
                            to_send[i] = "rgb("+infos.data[0][i].toString()+")"
                        }
                        else{
                            to_send[i]=infos.data[0][i]  
                            }
                    }
                }
                sheet.data={"data":[to_send]}
                sheet.pdbFile = "/pdb/"+request+".pdb"
            })
        }
    })



     document.addEventListener('askResults',function(to_find){
        let url = SERVER_DOMAIN + "/apiWhite/results/"+to_find.detail;
        let sb = document.getElementsByTagName('advanced-searchbar')[0];
        qwest.get(url).then(function(xhr,response){
            let to_send = []
            const JSONres = JSON.parse(response)
            for (let i of JSONres){
                to_send.push({"id":i.pdbCode,"text":i[i.matchFields[0]],"pill":i.matchFields[0]})
            }
            sb.data = to_send;
        })
        //sb.data = [{"id":"2HYD","text":"test","pill":"test"}]

    })

    let alreadyClicked = false;
    document.addEventListener('clickedOnResult',function(result){
        if (alreadyClicked)
            return;
        alreadyClicked = true;
        const url = SERVER_DOMAIN + "/apiWhite/pdb/" + result.detail; 
        qwest.get(url).then(function(xhr,response){
          const JSONres = JSON.parse(response); 
          //JSONres.url = "/pdb/1a0t.pdb"; 
          if ("error" in JSONres){
            console.error(JSONres.error.message)
              if (JSONres.error.code === "ENNOENT") alert(`Can't access to ${result.detail} pdb file`)
              else alert("Can't load pdb, an error occurs")
          }
          else {
            cpSubmitBox.showProt(JSONres)
          }
        })
      })
    
     
/*      console.log(result.detail)
    sb.addEventListener('clickedOnResult',function(result){
        console.log(result.detail)
        // What do we do next ? -> show it inside the input (means we have to add a method to modify the content of it)? delete the component ? Depend on the user but need to add Methods
        // User choice : here we decide to hide the component to the user after we send the selected item.

    }) 
    */
});

