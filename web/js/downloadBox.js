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
                    +    '<li> <i class="fa fa-2x fa-li fa-pinterest-p">   </i> PDB coordinates file</li>'
                    +    '<li> <i class="fa fa-2x fa-li fa-file-code-o">   </i> PYMOL script</li>'
                    +    '<li> <i class="fa fa-2x fa-li fa-file-archive-o"></i> Zip archive containing PDB and PYMOL files</li>'
                +"</ul></div>";
    var pdbHelp = "pdb file";
    var scriptHelp = "pymol script";
    var zipHelp = "zip dossier";

    this.divTag = 'div_'+this.idNum;

    $(this.getNode()).append(
            '<div class="downloadDiv" id="'+this.divTag+'">'
                +'<div class="headerDownloadDiv">'
                    +'<span class="titleH3">Download </span>'
                    +'<span class="pull-right help-icon" data-toggle="tooltip"><i class="fa fa-question fa-2x" aria-hidden="true"></i></span>'
                +'</div>'
                +'<div class="buttonDownloadDiv">'
                    +'<a href="download/file.pdb" > <button type="button" data-toggle="tooltip" data-placement="bottom" title="'+pdbHelp+'" class="btn btn-info btn-sm btnLink"> <i class="fa fa-2x fa-pinterest-p" aria-hidden="true"></i> </button> </a>'
                    +'<a href="download/script.js" > <button type="button" data-toggle="tooltip" data-placement="bottom" title="'+scriptHelp+'" class="btn btn-info btn-sm btnLink"> <i class="fa fa-2x fa-file-code-o" aria-hidden="true"></i> </button> </a>'
                    +'<a href="download/dossier.zip" > <button type="button" data-toggle="tooltip" data-placement="bottom" title="'+zipHelp+'" class="btn btn-info btn-sm btnLink"> <i class="fa fa-2x fa-file-archive-o" aria-hidden="true"></i> </button> </a>'
                +'</div>'
            + '</div>');

    $('#w_3').insertBefore('#w_2');

    this.emiter.emit('display');

    $('.help-icon').tooltip({ "html" : true, "title" : listHelp });
    $('.btnLink').tooltip();

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