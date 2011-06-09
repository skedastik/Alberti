/*
 * GuiDropTargetFamily.js
 * 
 * A family of related drop targets.
 * 
 * * */
 
function GuiDropTargetFamily() {
	this.dropTargets = [];
}

GuiDropTargetFamily.prototype.addDropTarget = function(guiDropTarget) {
	Util.assert(this.dropTargets.indexOf(guiDropTarget) < 0,
		"Duplicate drop target passed to GuiDropTargetFamily::addDropTarget"
	);
	
	this.dropTargets.push(guiDropTarget);
};

GuiDropTargetFamily.prototype.removeDropTarget = function(guiDropTarget) {
	var index = this.dropTargets.indexOf(guiDropTarget);
	
	Util.assert(index >= 0, "Unrecognized drop target passed to GuiDropTargetFamily::removeDropTarget");
	
	this.dropTargets.splice(index, 1);
};

// Activate all drop targets belonging to this family
GuiDropTargetFamily.prototype.activate = function() {
	for (var i = 0, len = this.dropTargets.length; i < len; i++) {
		this.dropTargets[i].activate();
	}
};

// Deactivate all drop targets belonging to this family
GuiDropTargetFamily.prototype.deactivate = function() {
	for (var i = 0, len = this.dropTargets.length; i < len; i++) {
		this.dropTargets[i].deactivate();
	}
};
