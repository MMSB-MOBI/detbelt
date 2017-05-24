//pdbSubmit SubmitBox with canva
var Core = require('./Core.js').Core;
var sprintf = require("sprintf-js").sprintf,
    vsprintf = require("sprintf-js").vsprintf;

// Constructor
var pdbSubmit = function(opt) {
    var nArgs = opt ? opt : {};
    Core.call(this, nArgs);
}
pdbSubmit.prototype = Object.create(Core.prototype);
pdbSubmit.prototype.constructor = pdbSubmit;

pdbSubmit.prototype.drawControlBox = function () {
    //function created checkbox and associated events for turn the protein  
    var self = this;
    var turnBoxTag = 'turnBox_' + self.idNum;
    $(this.getNode()).find(".pdbSubmitDiv").append('<div class="ctrlBox"></div>');
    var ctrlDiv = $(this.getNode()).find(".pdbSubmitDiv .ctrlBox")[0];
    $(ctrlDiv).append('<div class="checkbox"><label><input type="checkbox" id="' + turnBoxTag + '" >Set molecule spin on/off</label></div>');

    $( "#" + turnBoxTag).on('change',function(){
        if(document.getElementById(turnBoxTag).checked){self.stage.setSpin( [ 0, 1, 0 ], 0.01 )}
            else{self.stage.setSpin( [ 0, 1, 0 ], 0 )}
    });

};

pdbSubmit.prototype.drawResultBox = function () {
    //function created the box containing the result precedently stock in data object
    var self = this;
    $(self.getNode()).find(".pdbSubmitDiv").append('<div class="resultSummary"></div>');
    var resultDiv = $(self.getNode()).find(".pdbSubmitDiv .resultSummary")[0];

    $(resultDiv).append('<table class="table"><thead><tr><th colspan="2">Detergent Belt characteristics</th></tr></thead><tbody>'
        + '<tr>' 
        + '<td>Half-height <span class="notEditableResults">' + self.data.halfH + ' &#8491</span></td>'
        + '<td>Volume <span class="editableResults">' + sprintf("%2.1f", self.data.volTot) + ' &#8491<sup>3</sup></span></td>'
        + '</tr>'
        + '<tr>'
        + '<td>Inner radius <span class="notEditableResults">' + self.data.proteinRadius + ' &#8491</span></td>'
        + '<td>Outer radius <span class="editableResults">' + sprintf("%2.1f", self.data.radius) + ' &#8491</span></td>'
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

pdbSubmit.prototype.display = function(jsonFile) {
    //create the DOM 
    //send jsonFile in argument to stock his color in object dataDetergentFromJson
    var self = this;
    this.divTag = 'div_'+this.idNum;
    $(this.getNode()).append('<div class="pdbSubmitDiv" id="'+this.divTag+'">'
            + '<h3>Enter your PDB file</h3>'
            + '<div class="ngl_canva" id="ngl_canva_'+self.idNum+'"> </div>'
            + '<div id="insertFile"> </div>'
            + '</div>');
    this.emiter.emit('display'); //event for give at submitBox compenent the size col-xs-12

    $.getJSON(jsonFile, function (jsonData) {
        self.dataDetergentFromJson = jsonData.data;
    });

    var _drawButton = function (node) {
        //create a button, event for read a pdb file and manage the file error
        var inputTag = 'file_' + self.idNum;
        
        $(node).append('<input id="' + inputTag + '" type="file" class="file" data-show-preview="false">'); 

        var fileInput = document.querySelector('#' + inputTag); // recupération du fichier d'entrée

        fileInput.addEventListener('change', function() {
            var reader = new FileReader();      
            //var re = /^REMARK +1\/2 of bilayer thickness/;

            reader.addEventListener('load', function() {
                var taille=fileInput.files[0].size;
            
                if (taille==0){
                    console.log("error : empty file");
                    alert("empty file");
                    reader.abort();
                }
                /*else if (! re.test(reader.result)) {
                    alert("Corona need a pdb file");
                    console.log("le fichier pdb doit commencer par une ligne REMARK 1/2 of bilayer thickness")
                }*/
                else{
                    self.fileContent=reader.result;
                    self.nglStart(fileInput.files[0]); 
                    $("#"+inputTag).remove();
                    $("#"+self.divTag+" h1").remove();
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

pdbSubmit.prototype.nglStart = function(fileObject) {
    //function to create canva and print the protein containing in fileObject
    var self = this;
    this.stage = new NGL.Stage( "ngl_canva_"+self.idNum, { backgroundColor: "lightgrey" } );    //crer canevas
    this.stage.loadFile(fileObject, { defaultRepresentation: true }) 
        .then(function (o) { // Ajouter des elements, modifier le canvas avant affichage.
            self.nglStructureView_noBelt = o;
            if(self.nglStructureView_noBelt.structure.atomCount===0){
                console.log("Le fichier n'est pas au format pdb");
            }
            else{
                self.emiter.emit('ngl_ok',self.fileContent);
                $('h3').remove();
                $(self.getNode()).find(".ngl_canva").addClass("display");
                self.stage.handleResize();
            }
    });
}

pdbSubmit.prototype.nglCorona = function(belt_radius) {
    //nglCorona destroy the old wrown and create the new with belt_radius argument
    var comp = this.stage.compList[1];
    this.stage.removeComponent(comp); //destroy old crown
    var shape = new NGL.Shape("shape", { disableImpostor: true } );
    shape.addCylinder([0, -1 * this.halfH, 0], [0, this.halfH, 0 ], this.colorBelt, belt_radius); //create new crown with colorBelt who is define in fct choose color
    var shapeComp = this.stage.addComponentFromObject( shape );
    shapeComp.addRepresentation( "belt", { "opacity" : 0.5 } );
    this.nglStructureView_belt.autoView();
}

pdbSubmit.prototype.nglRefresh = function(pdbText, data) {
    //pdbText is the pdb file containing the prot oriented
    //data containing halfH and radius of the crown
    //fct to add the crown after the request to the server
    var self = this;
    this.pdbText = pdbText;
    this.data = data;
    var blob = new Blob([pdbText],{ type:'text/plain' });
    
    self.stage.loadFile(blob, { defaultRepresentation: true, ext: 'pdb' })
        .then(function(o){
            self.halfH = parseFloat(self.data.halfH);
            var basis = new NGL.Matrix4();
            self.stage.viewerControls.align(basis);
            self.nglStructureView_belt = o;
            var shape = new NGL.Shape("shape", { disableImpostor: true } );
            var radius = parseFloat(self.data.radius);
            shape.addCylinder([0, -1 * self.halfH, 0], [0, self.halfH, 0 ], self.colorBelt, radius);
            var shapeComp = self.stage.addComponentFromObject( shape );
            shapeComp.addRepresentation( "belt", { "opacity" : 0.5 } );
            self.nglStructureView_belt.autoView();
            self.setWait("loadOFF");
            self.drawControlBox();
            self.drawResultBox();
        });
};

pdbSubmit.prototype.nglEditionBelt = function(detList) {
    //fct to calculate the new volume and edit the crown after the change of the detergents stored in detList
    var volume = 0;
    var pi = 3.1415;
    var protein_radius = parseFloat(this.data.proteinRadius);
    detList.forEach(function(e){
        var name = e.detName;
        self.dataDetergentFromJson.forEach(function(i){
            if(name===i.name){
                var ni = parseFloat(e.qt);
                var vi = parseFloat(i.vol);
                volume += ni * vi;
            } 
        });
    });

    var belt_radius=Math.sqrt( volume / (pi * (this.halfH * 2)) + Math.pow(protein_radius,2) );
    $(this.volumeValueElem).html( sprintf("%2.1f", volume) + ' &#8491<sup>3</sup>' );
    $(this.crownValueElem).html( sprintf("%2.1f", belt_radius) + ' &#8491');
    this.nglCorona(belt_radius);
};

pdbSubmit.prototype.chooseColor = function(detList) {
    //this function browse detList and dataDetergentFromJson and if find an equality between the detergents, he increase the RGB and save the color
    var self = this;
    var r = 0,
        g = 0,
        b = 0;
    this.colorBelt;
    detList.forEach(function(e){
        self.dataDetergentFromJson.forEach(function(f){
            if(e.detName === f.name){
                r += f.color[0];
                g += f.color[1];
                b += f.color[2];
                if (r > 255) { r = 255 }
                if (g > 255) { g = 255 }
                if (b > 255) { b = 255 }
            }
        });
    });
    self.colorBelt = [r,g,b];  
}

pdbSubmit.prototype.editionColor = function(detList){
    self = this;
    this.chooseColor(detList);
    this.nglEditionBelt(detList, self.dataDetergentFromJson);
};

module.exports = {
    new : function (opt) {
        // opt safety assignment
        var obj = new pdbSubmit(opt);
        return obj;
    }
}
