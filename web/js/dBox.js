var Core = require('./Core.js').Core;

var dBox = function(opt) {
    var nArgs = opt ? opt : {};
    Core.call(this, nArgs);
    this.drawn = false;

}
dBox.prototype = Object.create(Core.prototype);
dBox.prototype.constructor = dBox;

dBox.prototype.toggleSubmissionButtonState = function (){
    //this function disable the button edition and request if select doesn't exist in the DOM
    var elems = $(this.getNode()).find('select');
    if ( $(this.getNode()).find('select').length == 0 ) {
        $(this.getNode()).find('.buttonEdition,.buttonRequest').addClass('disabled');
    }
    else {
        $(this.getNode()).find('.buttonEdition,.buttonRequest').removeClass('disabled');
    }
};

dBox.prototype.animationBox = function(){
    self = this;
    console.log("bouge cette boite");
    $(this.getNode()).animate({
        //position: absolute,
        top: "130",
    }, 1500, function() {
        self.emiter.emit('moved');
        $(self.getNode()).offset({ top : 320 });
    });
}

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
            $(this).find(" .dNumber").addClass("error");             
        } else if (! re.test(qt)) {
            validateField = false;
            $(this).find(" .dNumber").addClass("error");
        } else if(parseFloat(qt) < 1){
            $(this).find(" .dNumber").addClass("error");
            validateField = false;
        } 
        var name = $(this).find("option:selected").text();
        self.detList.push({ "detName" : name, "qt" : qt });
    });
    return validateField;
}

dBox.prototype.drawEmptySectionAndButton = function() {
    //create the DOM of deterBox
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
        self.drawSelectDet();
        self.drawButtonRequest();
        self.toggleSubmissionButtonState();
    });    
}

dBox.prototype.drawButtonRequest = function(){
    //draw button request + ppmBox and assign event for click and check 
    var self = this;
    this.PPMBoxTag = 'PPMBox_' + self.idNum;
    if( ($(".buttonRequest").length) || (this.modeEdition===true) ) return;
    $(this.getNode()).find('.DeterSubmitDiv').append('<div class="buttonGo"></div>');
    $(this.getNode()).find(".buttonGo")
        .append('<button type="button" class="btn btn-success buttonRequest">Visualize detergent belt</button>'
                +'<div class="ppmCheckBoxDiv"><input type="checkbox" id="' + self.PPMBoxTag + '">'
                +'<label style="padding-left: 0.5em;" for="' + self.PPMBoxTag + '"> PDB file was processed by <a href="http://opm.phar.umich.edu/server.php">PPM server</a> </label></div>'
                +'<div class=note>(faster as it requires les calculation) </div> '
                );


    $(this.getNode()).find(".buttonRequest").click(function(event){
        if ( $(self.getNode()).find('select').length == 0 ) return;
        var validQt = self.validationAndListDet();
        if (!validQt) return false;

        if(document.getElementById(self.PPMBoxTag).checked){ self.requestPPM = false }
        else { self.requestPPM = true }
        $(self.getNode()).find(".ppmCheckBoxDiv").remove();
        $(self.getNode()).find(".note").remove();
        // Disable submission and click when user send request
        $(this).addClass('disabled');
        $(this).off("click");
        $(self.getNode()).find('.newDet').addClass('disabled');
        self.emiter.emit("submit", self.requestPPM , self.detList);
    });
}

dBox.prototype.dataTransfert = function(data){
    //when the server send the reponse send event result and draw buttonEdition and buttonRefresh
    //data is the var containing the reponse of the server
    var self = this;
    //console.log("donnees fichier PDB transferes : " + data.fileContent);
    console.log("donnees corona transferes : " );
    console.dir(data.data);
    console.log("donnees chemin fichier transferes : " );
    console.dir(data.files);
    var pdbText = data.fileContent;
    this.coronaData = data.data;
    self.modeEdition = true;
    self.emiter.emit("result", pdbText, this.coronaData);
    $(self.getNode()).find(".buttonRequest").remove();
    $(self.getNode()).find('.ppmCheckBoxDiv').remove();
    $(self.getNode()).find(".buttonGo").append('<button type="button" class="btn btn-success btn-sm buttonEdition">Recompute the belt</button>');
    $(self.getNode()).find(".buttonGo").append('<button type="button" class="btn btn-warning btn-sm buttonRefresh">Try another protein</button>');
    $(self.getNode()).find(".newDet").removeClass('disabled = true');
    $(self.getNode()).find(".buttonEdition").click(function(){
        if ( $(self.getNode()).find('select').length == 0 ) {
            return;
        }
        var validQt = self.validationAndListDet();
        if (!validQt) return false;
        self.emiter.emit("edition", self.detList, self.dataDetergentFromJson);
    });
    $(self.getNode()).find(".buttonRefresh").click(function(){
        window.location.reload();
    });
} 


dBox.prototype.display = function(jsonFile) {
    //this function browse the JSONFile and store his data in the variable dataDetergentFromJson.
    //create the variable availableData 
    if (this.drawn) return;
    var self = this;
    this.boxNumber = 0;
    this.availableDet = [];
    this.detergentRefList = [];
    $.getJSON(jsonFile, function (jsonData) {
        self.dataDetergentFromJson = jsonData.data;
        self.detergentRefList = self.dataDetergentFromJson.map(function(e){ return e.name; });
        self.availableDet = self.detergentRefList.slice();
        // Initial component graphical state
        self.drawEmptySectionAndButton();
        self.draw = true;
    });
}


dBox.prototype.addAvailable = function (detName) {
    //this function addAvailable (in the object availableDet) the detergent who is giving in argument
    var detExist = false;
    this.availableDet.forEach(function(e){
        if(e === detName) detExist = true; 
    });
    if(!detExist) this.availableDet.push(detName);

    $(this.getNode()).find('select.selDetName')
        .filter(function(){
            var ok = true;
            $(this).find('option').each(function(){
                if ($(this).attr('value') === detName) ok = false;
            });
            return ok;
        }).append('<option value=' + detName + '>' + detName + '</option>');

}


dBox.prototype.delAvailable = function (detName) {
    // Remove detergent name from buffer and from all displayed selection boxes
    var m = this.availableDet.indexOf(detName);
    if (m === -1) return;
    
    this.availableDet.splice(m, 1); 

    $(this.getNode()).find('select.selDetName option')
        .filter(function(i){
            if($(this).is(':selected')) return false;
            return $(this).attr('value') === detName;
        })
        .remove();
}

dBox.prototype.drawSelectDet = function() {
    //draw an selectDet box from availableDet
    var self = this;
    var boxID = 'divSelectDet_' + this.boxNumber;
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