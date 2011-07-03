/*
 * UndoManagerDelegate.js
 * 
 * Propagates UndoManager mutations to a UserInterface object.
 * 
 * * */
 
function UndoManagerDelegate(undoManager, ui) {
	UndoManagerDelegate.baseConstructor.call(this, undoManager);
	this.ui = ui;
	
	this.mapMethod("push",        "pushDelegate");
	this.mapMethod("recordStart", "pushDelegate");
	
	this.mapMethod("undo", null, "undoDelegate");
	this.mapMethod("redo", null, "undoDelegate");
}
Util.extend(UndoManagerDelegate, Delegate);

UndoManagerDelegate.prototype.pushDelegate = function() {
	// For efficiency's sake, do not invoke the undo delegate for every push 
	// recorded to a buffered action. Only the first call to recordStart is 
	// significant (and only then will bufferLevel == 0).
	if (this.enabled && this.bufferLevel == 0) {
		this.undoDelegate();
	}
};

UndoManagerDelegate.prototype.undoDelegate = function() {
	Dbug.log("Stack changed.");
};
