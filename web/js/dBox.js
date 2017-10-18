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
    var self = this;
    console.log("bouge cette boite");
    $(this.getNode()).animate({
        //position: absolute,
        top: "100",
    }, 1500, function() {
        //console.dir(self);
        self.emiter.emit("moved");
        console.log("boite a terminé de bouger");
        $(self.getNode()).css('top', 0);
       // $(self.getNode()).offset({ top : 320 });
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

    $(this.getNode()).find(".buttonNew").append('<button type="button" class="btn btn-primary btn-sm newDet">Add a new detergent</button><span class="abbreviations pull-right"><a href="assets/abbreviations.pdf" target="_blank">abbreviations</a></span>');
    this.emiter.emit('display');
    $(this.getNode()).find(".newDet").click(function(){
        if (self.availableDetNumber() == 0) return;

        self.drawSelectDet();
        self.drawButtonRequest();
        self.toggleSubmissionButtonState();
    });
}

dBox.prototype.availableDetNumber = function () {
    var l = 0;
    for (var k in this.availableDet) {
        l += this.availableDet[k].length;
    }
    return l;
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
                +'<div class=note>(faster as it requires less calculation) </div> '
                );
    $(this.getNode()).find("div.ppmCheckBoxDiv input").prop('checked', true);
    $(this.getNode()).find("div.ppmCheckBoxDiv input").attr("disabled", true);


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
    console.log("donnees corona transferes : " );
    console.dir(data.data);
    var pdbText = data.fileContent;
    this.coronaData = data.data;
    self.modeEdition = true;
    self.emiter.emit("result", pdbText, this.coronaData, self.detList);
    console.log("a émis result");
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
        self.emiter.emit("edition", self.detList);
        console.log("a émis edition");
    });
    $(self.getNode()).find(".buttonRefresh").click(function(){
        window.location.reload();
    });
}

dBox.prototype.mapper = function(opt) {
    if (opt.hasOwnProperty('detergent')) {
        for (var category in this.detergentRefLitt)
            for (var deterDatum in this.detergentRefDict[category])
                if (deterDatum.name === opt.detergent) return category;
    }

};

dBox.prototype.display = function(jsonFile) {
    //this function browse the JSONFile and store his data in the variable dataDetergentFromJson.
    //create the variable availableData
    if (this.drawn) return;
    var self = this;
    this.boxNumber = 0;
    this.availableDet = [];
    this.detergentRefLitt = {};
    $.getJSON(jsonFile, function (jsonData) {


        self.dataDetergentFromJson = jsonData.data;
        for (var detCategory in self.dataDetergentFromJson) {
            self.detergentRefLitt[detCategory] = self.dataDetergentFromJson[detCategory].map(function(i){return i.name;});
        }
       /*
        self.detergentRefList = self.dataDetergentFromJson.map(function(e){
            var list = e.map(function(i){return i.name;});
            return { "categoy" : e.name , "detergents" : list };
        });
        */
        self.availableDet = JSON.parse(JSON.stringify(self.detergentRefLitt));

       // return;
        // Initial component graphical state
        self.drawEmptySectionAndButton();
        self.draw = true;
    })
    .fail(function() {
        console.log( "error loading detergent file at " + jsonFile );
  });
}


dBox.prototype.addAvailable = function (detLitt) {
    console.log("addAvailable");
    console.log(detLitt);

    //this function addAvailable (in the object availableDet) the detergent who is giving in argument
    var detExist = false;

    this.availableDet[detLitt.category].forEach(function(e){
        if(e === detLitt.name) detExist = true;
    });
    if(!detExist) this.availableDet[detLitt.category].push(detLitt.name);



    $(this.getNode()).find('select.selDetName')
        .filter(function(){ // Filter selectboxes which lack the added det
            var ok = true;
            $(this).find('option').each(function(){
                if ($(this).attr('value') === detLitt.name) ok = false;
            });
            return ok;
        }).each(function(){
            console.log('Reinjecting in a select');
            if( $(this).find('option').filter(function(){return $(this).text() == detLitt.category; }).length  == 0 ) {
                console.log("writing " + detLitt.category);
                 $(this).append('<option disabled>' + detLitt.category + '</option>'
                              + '<option category="' + detLitt.category + '" value=' + detLitt.name + '>' + detLitt.name + '</option>');
                 return;
            }
            console.log("Appending");
            $(this).find('option').filter(function(){ return $(this).text() == detLitt.category; })
                    .after('<option category=' + detLitt.category + ' value=' + detLitt.name + '>' + detLitt.name + '</option>');
        });
}


dBox.prototype.delAvailable = function (detLitt, sCategoryPrev) {
    var self = this;
    console.log("delAvailable");
    console.log(detLitt);

    // Remove detergent name from buffer
    var m = this.availableDet[detLitt.category].indexOf(detLitt.name);
    if (m === -1) return;
    this.availableDet[detLitt.category].splice(m, 1);

    // List all category of currently selected detergents
    var currSelCatList = $(this.getNode()).find('select.selDetName option:selected').map(function(){
        return $(this).attr("category"); })
            .get()
            .filter( function(value, index, self) {return self.indexOf(value) === index;});

        console.log("-->");  console.dir(currSelCatList);

     var currSelCatName = detLitt.category;


// detLitt.name .category
// Foreach box remove detergeant mention
//             Also removes its category mention if the category is empty
//             AND if one of its detergent is not selected in current box
    $(this.getNode()).find('select.selDetName')
                     .each(function(){
                        var sCategory = $(this).find('option:selected').attr("category");
                        // Treating "category" options
                        $(this).find('option:disabled').filter( function(i){
                            var catName = $(this).text();
                            if (sCategoryPrev)
                                return self.availableDet[catName].length == 0 && catName !== sCategory && catName !== sCategoryPrev;
                            return self.availableDet[catName].length == 0 && catName !== sCategory;
                        }).remove();

                        // Treating "detergent" options
                        $(this).find('option:not(:disabled)').filter(function(i){
                                if($(this).is(':selected')) return false;
                            /*console.log($(this));
                            console.log($(this).attr('value') + " === " + detLitt.name);
                            console.log($(this).attr('value') === detLitt.name);*/
                             return $(this).attr('value') === detLitt.name;
                        }).remove();
                     });

/*
    console.log("Trying to remove " + detLitt.name);
    $(this.getNode()).find('select.selDetName option')
        .filter(function(i){
            if($(this).is(':selected')) return false;
            return $(this).attr('value') === detLitt.name;
        })
        .remove();
    var self = this;
    //var currSelCatName = $(this.getNode()).find('select.selDetName option:selected').attr("category");


    $(this.getNode()).find('select.selDetName option:disabled').filter(function(i) {
        var catName = $(this).text();
        return self.availableDet[catName].length == 0 && catName !== currSelCatName;}
        ).remove();
        */
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
                var detCat = $(this).siblings('select').find('option:selected').attr('category');
                console.log("Adding " + detName + ' , ' + detCat);
                self.addAvailable({name : detName, category : detCat });
                $(this).parents().eq(1).remove();
                self.toggleSubmissionButtonState();
            });

    var defaultDet = null;
    $(self.getNode()).find('#' + boxID + ' .selDetName').each(function(){
        var elem = this;
        for (var category in self.availableDet) {
            //$(elem).append('<option disabled>Choose a ligand</option>');
            if (self.availableDet[category].length == 0) continue;
            $(elem).append('<option disabled>' + category + '</option>');

            self.availableDet[category].forEach(function(e, i){
                defaultDet = !defaultDet ? { 'name' : e, 'category' : category } : defaultDet;
                $(elem).append('<option value=' + e +' category="' + category + '">' + e + '</option>');
            });
        }
/*
        self.availableDet.forEach(function(e, i){
            $(elem).append('<option disabled> titit toto tata</option>');
            $(elem).append('<option value=' + e+'>' + e + '</option>');
        });
*/
        self.delAvailable(defaultDet, null);
        var prevDetSelected, prevCatSelected;
        $(elem).on('click',function(){
            prevDetSelected = $(this).find('option:selected').text();
            prevCatSelected = $(this).find('option:selected').attr('category');
    })


        $(elem).on('change',function(){
            var detSelected = $(this).find('option:selected').text();
            var catSelected = $(this).find('option:selected').attr('category');

            console.log("Changing From");
            console.log(prevDetSelected + " " + prevCatSelected);
            console.log("To");
            console.log(detSelected + " " + catSelected);

            self.delAvailable({ name : detSelected, category : catSelected }, prevCatSelected);
            //return;
            //return;
            self.addAvailable({ name : prevDetSelected, category : prevCatSelected});
            console.log("fixed");
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