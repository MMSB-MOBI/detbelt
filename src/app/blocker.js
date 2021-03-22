/*

Patching widget to facilitate waiting / error management
Optional arguments:
    type: error|warning

*/

var Core = require('./Core.js').Core;

var Blocker = function(opt) {
    var nArgs = opt ? opt : {};
    Core.call(this, nArgs);
    this.drawn = false;
    this.type = nArgs?.type ? nArgs.type : "error";
    
    this._on = { 'close' : function(){} };

}
Blocker.prototype = Object.create(Core.prototype);
Blocker.prototype.constructor = Blocker;

Blocker.prototype.on = function (event, fn){
    this._on[event] = fn;
};

Blocker.prototype.toggle = function (message){

    $(this.getNode()).html(
    `
    <div id="myModal" class="modal" role="dialog">
    <div class="modal-dialog" style="position: absolute;top: 50%;left: 0;right: 0;">
  
      <!-- Modal content-->
      <div class="modal-content alert alert-danger" 
        style="background-color: #b2222238;">
        <div class="modal-header" style="border-bottom: 1px solid firebrick;">
          <button type="button" class="close" data-dismiss="modal">&times;</button>          
          <h4 class="modal-title">Error</h4>
        </div>
        <div class="modal-body">
          <p>${message}</p>
          <p>Please contact: <a href="mailto:contact-detbelt@ibcp.fr">
          contact-detbelt@ibcp.fr
          </a></p>
        </div>
        <div class="modal-footer"
        style="border-top: 1px solid firebrick;">
          <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>
    `);
    let self = this;
    let ref = $(this.getNode());
    console.log(ref);
    $(this.getNode()).css("display", "block")
    $(this.getNode()).find("#myModal").css("display", "block");
    $(this.getNode()).find("button").on("click", ()=>  {
        self._on.close();
        ref.remove();
    });

};

module.exports = {
    new : function (opt) {
        // opt safety assignment
        var obj = new Blocker(opt);
        return obj;
    }
}
