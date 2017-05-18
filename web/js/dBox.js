var Core = require('./Core.js').Core;

var dBox = function(opt) {
    var nArgs = opt ? opt : {};
    Core.call(this, nArgs);
    this.drawn = false;

}
dBox.prototype = Object.create(Core.prototype);
dBox.prototype.constructor = dBox;

dBox.prototype.toggleSubmissionButtonState = function (){
    console.log("TOGGLING");
    var elems = $(this.getNode()).find('select');
    console.dir(elems);

    if ( $(this.getNode()).find('select').length == 0 ) {
        $(this.getNode()).find('.buttonEdition,.buttonRequest').addClass('disabled');
    }
    else {
        console.log("REMOVINS");
        $(this.getNode()).find('.buttonEdition,.buttonRequest').removeClass('disabled');
    }
};

dBox.prototype.validationAndListDet = function(){
    //this function test the field input.dNumber and save each detname and qt in detListToServer
    var self = this;
    self.detList = []; 
    var validateField = true;
    var re = /^[0-9]+$/; // only integer allowed
    $(self.getNode()).find('select').parent().each(function(){
        var qt = $(this).find('input.dNumber').val();
        if(qt===""){ 
            console.log("empty field"); 
            validateField = false;
            console.log(this.id); 
            $(this).find(" .dNumber").addClass("error");              
        } else if (! re.test(qt)) {
            validateField = false;
            $(this).find(" .dNumber").addClass("error");
        } else if(parseFloat(qt) < 1){
            $(this).find(" .dNumber").addClass("error");
            validateField = false;
        } 
        var name = $(this).find("option:selected").text();
        console.log(name+" "+qt);
        self.detList.push({ "detName" : name, "qt" : qt });
        console.log(self.detList)
    });
    return validateField;
}

dBox.prototype.drawEmptySectionAndButton = function() {
    var self = this;
    $(this.getNode()).
        append(
            '<div class="DeterSubmitDiv">' 
                + '<h3>Choose your detergent set</h3>'
                + '<div class="enterDet"></div>'
                + '<div class="buttonNew"></div>'
            + '</div>');

    $(this.getNode()).find(".buttonNew").append('<button type="button" class="btn btn-primary btn-sm newDet">Add a new detergent</button>'); 
    this.emiter.emit('display');
    $(this.getNode()).find(".newDet").click(function(){
        if (self.availableDet.length === 0) return;
        self.drawDeterBox();
        self.drawButtonRequest();
        self.toggleSubmissionButtonState();
    });    
}

dBox.prototype.drawButtonRequest = function(){
    var self = this;
    this.PPMBoxTag = 'PPMBox_' + self.idNum;
    if( ($(".buttonRequest").length) || (this.modeEdition===true) ) return;
    $(this.getNode()).find('.DeterSubmitDiv').append('<div class="buttonGo"></div>');
    $(this.getNode()).find(".buttonGo")
        .append('<button type="button" class="btn btn-success buttonRequest">Visualize detergent belt</button>'
                +'<div class="ppmCheckBoxDiv"><input type="checkbox" id="' + self.PPMBoxTag + '">'
                +'<label style="padding-left: 0.5em;" for="' + self.PPMBoxTag + '"> PDB file was processed by PPM server </label></div>'
                );

    $(this.getNode()).find(".buttonRequest").click(function(event){
        if ( $(self.getNode()).find('select').length == 0 ) return;
        var validQt = self.validationAndListDet();
        if (!validQt) return false;

        if(document.getElementById(self.PPMBoxTag).checked){ self.requestPPM = false }
        else { self.requestPPM = true }
        $(self.getNode()).find("text").remove();
        console.log("sending-->" + self.detList);
         // Disable submission
        $(this).addClass('disabled');
        $(this).off("click");
        
        self.emiter.emit("submit", {"fileContent" : self.pdbFile, "requestPPM" : self.requestPPM , "deterData" : JSON.stringify(self.detList)});
    });
}

dBox.prototype.dataTransfert = function(data){
    var self = this;
    var pdbText = data.fileContent;
    var data = data.data;
    self.modeEdition = true;
    self.emiter.emit("result", pdbText, data);
    $(self.getNode()).find(".buttonRequest").remove();
    $(self.getNode()).find('.ppmCheckBoxDiv').remove();
    $(self.getNode()).find(".buttonGo").append('<button type="button" class="btn btn-success btn-sm buttonEdition">Recompute the belt</button>');
    $(self.getNode()).find(".buttonEdition").click(function(){
        if ( $(self.getNode()).find('select').length == 0 ) {
            console.log("pas de detergent");
            return;
        }
        var validQt = self.validationAndListDet();
        if (!validQt) return false;
        console.log(self.detList);
        self.emiter.emit("edition", self.detList, self.deterAndVolumeList);
    });
} 


dBox.prototype.display = function(pdbFile) {
    // ~ Core.call(display)
    if (this.drawn) return;
    var self = this;
    this.pdbFile = pdbFile;
    this.boxNumber = 0;
    this.availableDet = [];
    this.detergentRefList = [];
    $.getJSON("mesAssets/detergents.json", function (jsonData) {
        self.deterAndVolumeList = jsonData.data;
        self.detergentRefList = self.deterAndVolumeList.map(function(e){ return e.name; });
        self.availableDet = self.detergentRefList.slice();
        // Initial component graphical state
        self.drawEmptySectionAndButton();
        self.draw = true;
    });
}


dBox.prototype.addAvailable = function (detName) {
    var detExist = false;
    this.availableDet.forEach(function(e){
        if(e === detName) detExist = true; 
    });
    if(!detExist) this.availableDet.push(detName);

    console.log("Brwosing select boxes for addition");

    $(this.getNode()).find('select.selDetName')
        .filter(function(){
            console.log("Tsting select " + this);
            var ok = true;
            $(this).find('option').each(function(){
                if ($(this).attr('value') === detName) ok = false;
            });
            return ok;
            console.log("Ok :: " + ok);
        }).append('<option value=' + detName + '>' + detName + '</option>');

}

// Remove detergant name from buffer and from all displyed selection boxes
dBox.prototype.delAvailable = function (detName) {
    var m = this.availableDet.indexOf(detName);
    if (m === -1) return;
    
    this.availableDet.splice(m, 1); 

    $(this.getNode()).find('select.selDetName option')
        .filter(function(i){
          /*  console.log("--->" + this);
            console.log("->" + $(this).attr('value') );*/
            if($(this).is(':selected')) return false;
            return $(this).attr('value') === detName;
        })
        .remove();
}

dBox.prototype.drawDeterBox = function() {
    var self = this;

    var boxID = 'divSelectDet_' + this.boxNumber;
  //  var boxNum = this.boxNumber;
    this.boxNumber++;

    $(self.getNode()).find(".enterDet")
            .append(
            '<div id="' + boxID + '" class="input-group my-group">'
                + '<div class="errordNumber">'
                    + '<select class="selDetName selectpicker form-control" data-live-search="true"></select>'       
                    +' <input type="number" class="form-control dNumber" placeholder="quantity">'
                    
                    + '<span class="input-group-btn deleteDet">'
                        + '<button class="btn btn-default" type="submit">'
                        + '<span class="fa-stack"><i class="fa fa-circle-o fa-stack-2x"></i>'
                            + '<i class="fa fa-remove fa-stack-1x"></i>'
                        + '</span>'
                        + '</button>'
                    +'</span>'
                +'</div>'
            +'</div>'
            )
            .find('.deleteDet').click(function(){
                var detName = $(this).siblings('select').find('option:selected').text();
                self.addAvailable(detName);
                $(this).parent().remove();
                self.toggleSubmissionButtonState();
            });

    $(self.getNode()).find('#' + boxID + ' .selDetName').each(function(){
        var elem = this;
        self.availableDet.forEach(function(e, i){
            $(elem).append('<option value=' + e+'>' + e + '</option>');
        }); 
        self.delAvailable(self.availableDet[0]);
        var prevDetSelected;
        $(elem).on('click',function(){
            prevDetSelected = $(this).find('option:selected').text();
            console.log("too old --> " + prevDetSelected);            
        })


        $(elem).on('change',function(){
            var detSelected = $(this).find('option:selected').text();
            self.delAvailable(detSelected);
            self.addAvailable(prevDetSelected);
        });
    });

    $(self.getNode()).find("input.dNumber").on('click', 
        function() {
            $(this).removeClass("error");
        });
}

dBox.prototype.addClass = function(uneClass) {
    $("#w_"+this.idNum).addClass(uneClass);
}

dBox.prototype.removeClass = function(uneClass) {
    $("#w_"+this.idNum).removeClass(uneClass);
}

module.exports = {
    new : function (opt) {
        // opt safety assignment
        var obj = new dBox(opt);
        return obj;
    }
}