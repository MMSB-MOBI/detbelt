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
    var listHelp = '<div class="downloadTooltip"><ul class="fa-ul">'
                    +    '<li class="pdbLi"> PDB coordinates file</li>'
                    +    '<li> <i class="fa fa-2x fa-li fa-file-code-o">   </i> PYMOL script</li>'
                    +    '<li> <i class="fa fa-2x fa-li fa-file-text-o"></i> File containing the corona caracteristics</li>'
                    +    '<li> <i class="fa fa-2x fa-li fa-file-archive-o"></i> Zip archive containing PDB and PYMOL files</li>'
                +"</ul></div>";
    listHelp = '<div class="downloadTooltip"><ul class="fa-ul">'
                    +    '<li><span style="color:steelblue;margin-left: -1.5em;font-weight:500;padding-right:1.5em;">PDB</span><span class="helpLiSpan"> coordinates file</span></li>'
                    +    '<li><span style="color:steelblue;margin-left: -1.5em;font-weight:500">PyMOL</span><span class="helpLiSpan"> visualization PYMOL script</span></li>'
                    +    '<li><i class="fa fa-li fa-file-text-o" style="color:steelblue"></i> <span class="helpLiSpan" style="padding-left:2.2em;">File containing the belt caracteristics</span></li>'
                    +    '<li><i class="fa fa-li fa-file-archive-o" style="color:steelblue"></i><span class="helpLiSpan" style="padding-left:2.2em;">PDB and PYMOL files ZIP archive</span></li>'
                    +    '</ul>'
                    + '</div>';

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
                +'<div class="buttonDownloadDiv btn-group">'
                +'<div class="btn btn-primary btnLink btnPdb" style="height: 3em;padding-top: 0.7em;"> <img width="45px" src="img/pdb_alt.png"></div>'
                +'<div class="btn btn-primary btnLink btnScript" style="height: 3em;padding-top: 0.7em;">PyMOL</div>'
                +'<div class="btn btn-primary btnLink btnData" style="width: 5.5em;"> <i class="fa fa-2x fa-file-o"></i></div>'
                +'<div class="btn btn-primary btnLink btnZip" style="width: 5.5em;"> <i class="fa fa-2x fa-folder-open-o"></i></div>'

                +'</div>'
                +'<div class="liensDownload">'
                +'</div>'
            + '</div>');

    $('#w_3').insertBefore('#w_2');

    this.emiter.emit('display');

    $(this.getNode()).find(".btnPdb").click(function(){
        $(this).attr("disabled",true);
        self.emiter.emit("clickDL", "downloadPdb");
    });

    $(this.getNode()).find(".btnScript").click(function(){
        $(this).attr("disabled",true);
        self.emiter.emit("clickDL","downloadPymol");
    });

    $(this.getNode()).find(".btnData").click(function(){
        $(this).attr("disabled",true);
        self.emiter.emit("clickDL","downloadData");
    });

    $(this.getNode()).find(".btnZip").click(function(){
        $(this).attr("disabled",true);
        self.emiter.emit("clickDL","downloadZip");
    });

    $('.help-icon').tooltip({ "html" : true, "title" : listHelp });
    $('.btnLink').tooltip();
}

downloadBox.prototype.downloadFile = function(data) {
    $(".liensDownload").append('<a type="text/plain" href='+ data.path +'>.</a>');
    $(".liensDownload > a:last").get(0).click();
    $(".liensDownload > a:last").remove();
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