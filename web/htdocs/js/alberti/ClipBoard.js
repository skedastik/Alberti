/*
 * ClipBoard.js
 * 
 * Copy/paste facilities for Alberti.
 * 
 * * */
 
function ClipBoard() {
	this.shapes = [];
}

// Copy Shape objects in given array to clip board
ClipBoard.prototype.copy = function(shapeArray) {
	if (shapeArray.length > 0) {
		this.shapes = [];
	
		for (var i = 0, len = shapeArray.length; i < len; i++) {
			this.shapes.push(shapeArray[i].clone());
		}
	}
};

// Paste shapes from clip board into current layer of given LayerManager
ClipBoard.prototype.paste = function(layerManager) {
	for (var i = 0, len = this.shapes.length; i < len; i++) {
		layerManager.insertShape(this.shapes[i].clone().generate());
	}
};

// Clear the clip board
ClipBoard.prototype.clear = function() {
	this.shapes = [];
};
