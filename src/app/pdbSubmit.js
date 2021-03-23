//pdbSubmit SubmitBox with canva
var Core = require('./Core.js').Core;

var blocker = require('./blocker.js');

var sprintf = require("sprintf-js").sprintf,
    vsprintf = require("sprintf-js").vsprintf;

const createPipe = require('./donuts.js').generatePipeAlong;
// Constructor
var pdbSubmit = function(opt) {
    var nArgs = opt ? opt : {};
    Core.call(this, nArgs);
    /*
    this.hollowShape = null;
    this.hollowComp  = null;
    */
    this.masked = true;

    this.pipeElem = [];
}
pdbSubmit.prototype = Object.create(Core.prototype);
pdbSubmit.prototype.constructor = pdbSubmit;

pdbSubmit.prototype.error = function (msg){
    var h = $(this.getNode()).find(".pdbSubmitDiv").outerHeight();
    var w = $(this.getNode()).find(".pdbSubmitDiv").outerWidth();
    console.log(h + ' ' + w);
    $(this.getNode()).find(".pdbSubmitDiv").empty();
    $(this.getNode()).find(".pdbSubmitDiv").outerHeight(h);
    $(this.getNode()).find(".pdbSubmitDiv").outerWidth(w);
    $(this.getNode()).find(".pdbSubmitDiv").append('<div class="alert alert-danger pdbError">'
            + '<span><i class="fa fa-2x fa-exclamation-circle" aria-hidden="true"></i></span> The server was unable to process your structure.'
            + '</div>');
}
pdbSubmit.prototype.drawControlBox = function () {
    //function created checkbox and associated events for turn the protein
    var self = this;
    var turnBoxTag = 'turnBox_' + self.idNum;
    var extrudeTag = 'extrudeBox_' + self.idNum;
  

    $(this.getNode()).find(".pdbSubmitDiv").append('<div class="ctrlBox"></div>');
    var ctrlDiv = $(this.getNode()).find(".pdbSubmitDiv .ctrlBox")[0];
    $(ctrlDiv).append('<div class="checkbox"><label><input type="checkbox" id="' + turnBoxTag + '" >Set molecule spin on/off</label></div>');
   // $(ctrlDiv).append('<div class="checkbox"><label><input type="checkbox" checked=' + self.masked + ' id="' + extrudeTag + '" >Mask protein volume</label></div>');
    $( "#" + turnBoxTag).on('change',function(){
        if(document.getElementById(turnBoxTag).checked){self.stage.setSpin( [ 0, 1, 0 ], 0.01 )}
            else{self.stage.setSpin( [ 0, 1, 0 ], 0 )}
    });
    $( "#" + extrudeTag).on('change', (e) => {
        self.masked = e.target.checked;
        self.toggleHollow();
    });
};

pdbSubmit.prototype.drawResultBox = function () {
    //function created the box containing the result precedently stock in data object
    var self = this;
    $(self.getNode()).find(".pdbSubmitDiv").append('<div class="resultSummary"></div>');
    var resultDiv = $(self.getNode()).find(".pdbSubmitDiv .resultSummary")[0];

    $(resultDiv).append('<table class="table"><thead><tr><th colspan="2">Detergent Belt characteristics</th></tr></thead><tbody>'
        + '<tr>'
        + '<td>Half-height <span class="notEditableResults">' + sprintf("%2.1f", self.data.halfH) + ' &#8491</span></td>'
        + '<td>Volume <span class="editableResults">' + sprintf("%2f", self.data.volumeCorona) + ' &#8491<sup>3</sup></span></td>'
        + '</tr>'
        + '<tr>'
        + '<td>Inner radius <span class="notEditableResults">' + sprintf("%2.1f", self.data.proteinRadius) + ' &#8491</span></td>'
        + '<td>Outer radius <span class="editableResults">' + sprintf("%2.1f", self.data.beltRadius) + ' &#8491</span></td>'
        + '</tr>'
        + '<tr>'
        + '<td colspan="2">AHS <span class="editableResults"> '+ self.data.ahs +' &#8491<sup>2</sup></span></td>'
        + '</tr>'
        + '</tbody></table>');

    // Store Volume and crow radius dom element for further modifications
    var elems = $(resultDiv).find('span.editableResults');
    this.volumeValueElem = elems[0];
    this.crownValueElem = elems[1];


};

pdbSubmit.prototype.setWait = function(status){
    //staus is loadON when submit a request to server and loadOFF after the canva is refresh in the fct nglRefresh
    //if the request is loaded -> loader + remove prot + hide canva
    //if the request is finish -> canva visible + remove loader
    if(status === "loadON") {
        $(this.getNode()).find(".pdbSubmitDiv").append('<span class="loader">'
            + '<i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i>'
            + '<span>Computation under way...</span>');
        $(this.getNode()).find("div.ngl_canva").css("visibility", "hidden");
        var previousProteinComponent = this.stage.compList[0];
        this.stage.removeComponent(previousProteinComponent);
    }
    else if(status === "loadOFF") {
        $(this.getNode()).find(".pdbSubmitDiv").find('span.loader').remove();
        $(this.getNode()).find("div.ngl_canva").css("visibility", "");
    }
};

pdbSubmit.prototype.display = function(jsonData) {
    //create the DOM
    //send jsonFile in argument to stock his color in object dataDetergentFromJson
    var self = this;
    this.divTag = 'div_'+this.idNum;
    $(this.getNode()).append('<div class="pdbSubmitDiv row" id="'+this.divTag+'">'
            + '<div class="searchBlock col-md-6">'
            + '<h3>Enter a PDB id or a keyword</h3>'
            + '<advanced-searchbar  target_id="id"></advanced-searchbar>'
            + '</div>'
            + '<div class="fileBlock col-md-6">'
            + '<h3>Enter your PDB file</h3>'
            + '<div class="ngl_canva" id="ngl_canva_'+self.idNum+'"> </div>'
            + '<div id="insertFile"> </div>'
            + '</div>'
            + '</div>');
    this.emiter.emit('display'); //event for give at submitBox compenent the size col-xs-12

    self.dataDetergentFromJson = [];
    for (var category in jsonData.data) {
        jsonData.data[category].forEach(function(d){
             self.dataDetergentFromJson.push(d);
        });
    }

    var _drawButton = function (node) {
        //create a button, event for read a pdb file and manage the file error
        var inputTag = 'file_' + self.idNum;

        $(node).append('<input id="' + inputTag + '" type="file" class="file" data-show-preview="false">');

        var fileInput = document.querySelector('#' + inputTag); // recupération du fichier d'entrée

        fileInput.addEventListener('change', function() {

            var reader = new FileReader();
            reader.addEventListener('load', function() {
                var taille=fileInput.files[0].size;

                if (taille==0){
                    console.log("error : empty file");
                    alert("empty file");
                    reader.abort();
                }
                else {
                    self.fileContent=reader.result;
                    let to_show = {"fileObject": fileInput.files[0], "fileContent": reader.result}
                    self.showProt(to_show);
                }
            });

            reader.addEventListener('error', function() {
                console.log("Error in file reader "+ fileInput.files[0].name +": "+ reader.result);
                alert("Error in file reader "+ fileInput.files[0].name +": "+ reader.result);
            });

            reader.readAsText(fileInput.files[0]);
        });
    };

    _drawButton($(this.getNode()).find(".pdbSubmitDiv")[0]);
}

pdbSubmit.prototype.addClass = function(uneClass) {
    $("#w_"+this.idNum).addClass(uneClass);
}

pdbSubmit.prototype.removeClass = function(uneClass) {
    $("#w_"+this.idNum).removeClass(uneClass);
}

pdbSubmit.prototype.nglStart = function() {

    const is_opm = this.checkAndCleanOPMFile();

    if (! is_opm){
        const blockerWidget = blocker.new({root : "#main", type : "error"});
        blockerWidget.on('close', () => {                
            location.reload();
        });
        blockerWidget.toggle('File seems not OPM formated');
        return; 
    }

    console.log("nglStart");
    console.dir(NGL);
    //function to create canva and print the protein containing in fileObject
    let self = this;
    this.stage = new NGL.Stage( "ngl_canva_"+self.idNum, { backgroundColor: "lightgrey" } );    //crer canevas

    //Cecile 15/12/20 not fileObject anymore, just read from self.fileContent string. 
    
    const stringBlob = new Blob( [ self.fileContent ], { type: 'text/plain'} );

    console.log("stringBlob", stringBlob)

    this.stage.loadFile(stringBlob, { defaultRepresentation: true, ext: "pdb" })
        .then(function (o) { // Ajouter des elements, modifier le canvas avant affichage.
            //console.log(stringBlob);
            console.log("loadFile", o);
            o.setDefaultAssembly('');
            o.autoView();
            self.nglStructureView_noBelt = o;
            if(self.nglStructureView_noBelt.structure.atomCount===0){
                console.warn("This file is not a pdb file");
                return Promise.reject("This file is not a pdb file");
            }
            else{
                console.log("emit ngl_ok", self.fileContent); 
                self.emiter.emit('ngl_ok',self.fileContent);
                $('h3').remove();                                               
                $(self.getNode()).find(".ngl_canva").addClass("display");
                self.stage.handleResize();
            }
        }).catch( (err) => {
            console.warn("loadFile error", err);
            var blockerWidget = blocker.new({root : "#main", type : "error"});
            blockerWidget.on('close', () => {                
                location.reload();
            });
            blockerWidget.toggle("An error occur during pdb processing");
        });
}

pdbSubmit.prototype.nglRefresh = function(pdbText, data, detList) {
    console.log("NGL refresh");
    
    //pdbText is the pdb file containing the prot oriented
    //data containing halfH and radius of the crown
    //fct to add the crown after the request to the server
    var self = this;
    //console.log(data);
    this.pdbText = pdbText;
    this.data = data;
    this.detList = detList;
    this.beltRadius = parseFloat(data.beltRadius);
    this.proteinRadius = parseFloat(data.proteinRadius);
    this.halfH = parseFloat(data.halfH);

    var blob = new Blob([this.pdbText],{ type:'text/plain' });
    console.log("detList", detList)
    console.log("data", data)
    self.stage.loadFile(blob, { defaultRepresentation: true, ext: 'pdb' })
        .then(function(o){
            o.setDefaultAssembly('');
            o.autoView();
            //self.halfH = parseFloat(self.data.halfH);
            var basis = new NGL.Matrix4();
            self.stage.viewerControls.align(basis);
            self.nglStructureView_belt = o;
            //self.beltRadius = parseFloat(self.data.beltRadius);
            //self.proteinRadius = parseFloat(self.data.proteinRadius);
            console.log("radius(i/o) : "+ self.proteinRadius + '/'+self.beltRadius+" halfH : "+self.halfH);
            self.nglEditionData(self.detList);
            self.setWait("loadOFF");
            self.drawControlBox();
            self.drawResultBox();
        });
};

pdbSubmit.prototype.nglCorona = function() {
    self = this;
    this.oldPoint = this.halfH;
    this.detList.forEach(function(e){
        self.dataDetergentFromJson.forEach(function(i){
            if(e.detName===i.name){
                var ni = parseFloat(e.qt);
                var vi = parseFloat(i.vol);
                var v1= ni * vi;
                console.log("BRIII", self.beltRadius)
                self.createCylinder(self.volumeTOT,v1,i.color);
            }
        });
    });
}

// NGL based version
pdbSubmit.prototype._createCylinder = function(volumeTOT,volumeDet,color) {
    var shape = new NGL.Shape("shape", { disableImpostor: true } );
    var cylH = ((2*this.halfH)*volumeDet)/volumeTOT;
    var pointY = this.oldPoint - cylH;
    shape.addCylinder([0, this.oldPoint, 0], [0, pointY, 0], color, this.beltRadius);
    var shapeComp = this.stage.addComponentFromObject(shape);
    shapeComp.addRepresentation( "belt", { "opacity" : 0.5 } );
    console.log("Color", color);
    this.oldPoint = pointY;
    this.nglStructureView_belt.autoView();
   
}

/**
   * Add a donut cylinder to the scene
   * @param {!number} volumeTOT Total detergents pipe volume.
   * @param {!number} volumeDet Current detergent pipe volume.
   * @return {} Whether something occurred.
   */
pdbSubmit.prototype.createCylinder = function(volumeTOT,volumeDet,color) {
    console.log("Draw a pipe:", volumeTOT,volumeDet,color);
    const cylH = ((2*this.halfH)*volumeDet)/volumeTOT;
    const pointY = this.oldPoint - cylH;
    
   const { geometry, material, mesh, scene } = createPipe(
        [0, this.oldPoint, 0],
        this.proteinRadius, 
        this.beltRadius,
        [0, pointY, 0], 
        color, 
        undefined);
    window.dev.geometry = geometry;
    window.dev.material = material;
    window.dev.mesh     = mesh;

    const pipeVertex = geometry.attributes.position.array;
    const nVertex    = geometry.attributes.position.count;
    const pipeColor  = [].concat(...Array(nVertex).fill(color))
                         .map((e)=> e == 0 ? e : e /255 );
    const pipeShape = new NGL.Shape("pipeShape");
    pipeShape.addMesh(
	  pipeVertex,
      pipeColor
    );
    const pipeShapeComp = this.stage.addComponentFromObject(pipeShape);
    pipeShapeComp.addRepresentation("buffer");
    pipeShapeComp.autoView();

    this.pipeElem.push({pipeShapeComp, geometry, material, mesh})
    this.oldPoint = pointY;
}

/*
pdbSubmit.prototype.toggleHollow = function() {
    return;
    if(this.hollowShape != null) {
        this.hollowComp.removeAllRepresentations();        
        this.stage.removeComponent(this.hollowShape);
        this.hollowComp = null;
        this.hollowShape = null; // Could be Memory leak need to dispose materials/mesh
        return;
    };
    this.createHollow();
}

pdbSubmit.prototype.createHollow = function() {
   
    const hollowHeight = this.halfH + 0.25;
	const hollowHeightOffset = hollowHeight * (-1);
	const hollowRadius = this.proteinRadius;
	this.hollowShape = new NGL.Shape("hollowShape", { disableImpostor: true } );
    this.hollowShape.addCylinder( [0, hollowHeightOffset, 0], 
				 [0, hollowHeight      , 0], 
				 [0,0,0], hollowRadius);
	this.hollowComp = this.stage.addComponentFromObject(this.hollowShape) 
	this.hollowComp.addRepresentation( "hollow", { "opacity" : 0.6 } );
}
*/
pdbSubmit.prototype.nglEditionData = function(detList) {
    //fct to calculate the new volume and edit the crown after the change of the detergents stored in detList
    self = this;
    this.detList = detList;
    this.volumeTOT = 0;
    var pi = 3.1415;
    //this.proteinRadius = parseFloat(this.data.proteinRadius);
    this.detList.forEach(function(e){
        var name = e.detName;
        self.dataDetergentFromJson.forEach(function(i){
            if(name===i.name){
                var ni = parseFloat(e.qt);
                console.log("ni", ni)
                var vi = parseFloat(i.vol);
                console.log("vi", vi)
                self.volumeTOT += ni * vi;
            }
        });
    });
    console.log("BR: " + this.beltRadius);
    this.beltRadius=Math.sqrt( this.volumeTOT / (pi * (this.halfH * 2)) + Math.pow(this.proteinRadius,2) );
    console.log("BRII: " + this.beltRadius);
    
    $(this.volumeValueElem).html( sprintf("%2.1f", this.volumeTOT) + ' &#8491<sup>3</sup>' );
    $(this.crownValueElem).html( sprintf("%2.1f", this.beltRadius) + ' &#8491');
    this.nglCorona();
};

pdbSubmit.prototype.removeOldCorona = function(detList) {
    self = this;
    var iToDel = [];
    this.stage.compList.forEach(function(e, i){
        if(i === 0) return;
        iToDel.unshift(i);
    });

    iToDel.forEach(function(e){
        self.stage.removeComponent(self.stage.compList[e]);
    });
    this.nglEditionData(detList);
}

pdbSubmit.prototype.getCoronaData = function() {
    return {
            "halfH" : this.halfH,
            "proteinRadius" : this.proteinRadius,
            "ahs" : this.data.ahs,
            "volumeCorona" : this.volumeTOT,
            "beltRadius" : this.beltRadius,
            "detColor" : this.colorBelt
        };
};

pdbSubmit.prototype.showProt = function(opt){

    console.warn(opt);
    if (opt.hasOwnProperty('fileContent')){
        this.fileContent = opt.fileContent;
        this.nglStart();
        $(this.getNode()).find('input.file').remove()
        $(this.getNode()).find('div.searchBlock').remove()
        $(this.getNode()).find('div.fileBlock').removeClass('col-md-6')
    }
    else{
        alert("error while loading prot")
        console.error("pdbSubmit.js fileContent key not in object")
    }
}

pdbSubmit.prototype.checkAndCleanOPMFile = function(){
    const header = this.fileContent.split("\n")[0]
    const opm_regex = /^REMARK\s+1\/2 of bilayer thickness/g
    const found = header.match(opm_regex)
    if (! found) return false

    //Cleaning part
    const keep_regex = /^(ATOM|HETATM)/g
    const kept_lines = this.fileContent.split("\n").filter(line => line.match(keep_regex))
    this.fileContent = header + "\n" + kept_lines.join('\n')
    return true; 
}


module.exports = {
    new : function (opt) {
        // opt safety assignment
        var obj = new pdbSubmit(opt);
        return obj;
    }
}
