var Core = require('./Core.js').Core;

var downloadBox = function(opt) {
    var nArgs = opt ? opt : {};
    Core.call(this, nArgs);
}

downloadBox.prototype = Object.create(Core.prototype);
downloadBox.prototype.constructor = downloadBox;

downloadBox.prototype.display = function() {
    //display of downloadBox and the download button
    var self = this;
    console.log("display download box");
    var listHelp = '<div class="downloadTooltip"><ul class="fa-ul">'
                    +    '<li> <i class="fa fa-2x fa-li fa-pinterest-p">   </i> PDB coordinates file</li>'
                    +    '<li> <i class="fa fa-2x fa-li fa-file-code-o">   </i> PYMOL script</li>'
                    +    '<li> <i class="fa fa-2x fa-li fa-file-text-o"></i> File containing the corona caracteristics</li>'
                    +    '<li> <i class="fa fa-2x fa-li fa-file-archive-o"></i> Zip archive containing PDB and PYMOL files</li>'
                +"</ul></div>";
    var pdbHelp = "pdb file";
    var scriptHelp = "pymol script";
    var zipHelp = "zip dossier";
    var resultHelp = "result file"

    this.divTag = 'div_'+this.idNum;

    $(this.getNode()).append(
            '<div class="downloadDiv" id="'+this.divTag+'">'
                +'<div class="headerDownloadDiv">'
                    +'<span class="titleH3">Download </span>'
                    +'<span class="pull-right help-icon" data-toggle="tooltip"><i class="fa fa-question fa-2x" aria-hidden="true"></i></span>'
                +'</div>'
                +'<div class="buttonDownloadDiv">'
                    +'<span><button type="button" data-toggle="tooltip" data-placement="bottom" title="'+pdbHelp+'" class="btn btn-info btn-sm btnLink btnPdb"> <i class="fa fa-2x fa-pinterest-p" aria-hidden="true"></i> </button> </span>'
                    +'<span><button type="button" data-toggle="tooltip" data-placement="bottom" title="'+scriptHelp+'" class="btn btn-info btn-sm btnLink btnScript"> <i class="fa fa-2x fa-file-code-o" aria-hidden="true"></i> </button></span>'
                    +'<span><button type="button" data-toggle="tooltip" data-placement="bottom" title="'+resultHelp+'" class="btn btn-info btn-sm btnLink btnData"> <i class="fa fa-2x fa-file-text-o" aria-hidden="true"></i> </button> </span>'
                    +'<span><button type="button" data-toggle="tooltip" data-placement="bottom" title="'+zipHelp+'" class="btn btn-info btn-sm btnLink btnZip"> <i class="fa fa-2x fa-file-archive-o" aria-hidden="true"></i> </button> </span>'
                +'</div>'
                +'<div class="liensDownload">'
                +'</div>'
            + '</div>');

    $('#w_3').insertBefore('#w_2');

    this.emiter.emit('display');

    $(this.getNode()).find(".btnPdb").click(function(){
        console.log("clic sur btnZip");
        $(this).attr("disabled",true);
        self.emiter.emit("clickDL", "downloadPdb");
    }); 

    $(this.getNode()).find(".btnScript").click(function(){
        console.log("clic sur btnScript");
        $(this).attr("disabled",true);
        self.emiter.emit("clickDL","downloadPymol");
    });    

    $(this.getNode()).find(".btnData").click(function(){
        console.log("clic sur btnData");
        $(this).attr("disabled",true);
        self.emiter.emit("clickDL","downloadData");
    }); 

    $(this.getNode()).find(".btnZip").click(function(){
        console.log("clic sur btnZip");
        $(this).attr("disabled",true);
        self.emiter.emit("clickDL","downloadZip");
    }); 

    $('.help-icon').tooltip({ "html" : true, "title" : listHelp });
    $('.btnLink').tooltip();
}

downloadBox.prototype.downloadFile = function(data) {
    console.log(data); 
    $(".liensDownload").append('<a href='+ data.path +'>.</a>');
    //console.log($(".liensDownload > a:last"));
    $(".liensDownload > a:last").get(0).click();
    $(".liensDownload > a:last").remove();
    console.log(data.mode);
    switch(data.mode) {
        case "pymolScript":
            $(".btnScript").attr("disabled",false);
            break;
        case "pdbFile":
            $(".btnPdb").attr("disabled",false);
            break;
        case "zip":
            $(".btnZip").attr("disabled",false);
            break;
        case "dataFile":
            $(".btnData").attr("disabled",false);
            break;
    }
}

downloadBox.prototype.addClass = function(uneClass) {
    $("#w_"+this.idNum).addClass(uneClass);
}

module.exports = {
    new : function (opt) {
        // opt safety assignment
        var obj = new downloadBox(opt);
        return obj;
    }
}