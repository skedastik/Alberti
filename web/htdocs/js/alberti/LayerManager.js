/*
 * LayerManager.js
 * 
 * Keeps track of and manages access to data in user-created layers.
 * 
 * * */
 
function LayerManager(layerGroup, undoManager) {
	this.layerGroup = layerGroup;      // contains all user-created layers
	this.undoManager = undoManager;
	this.layers = [];
	this.currentLayer = -1;
	
	// shapeIndex contains shape records of all user-created shapes, mapped to 
	// Alberti sid attributes. Each shape record is an object with two 
	// properties: "shape" being a reference to the Shape object, and "layer" 
	// being a reference to the Layer object that contains the shape.
	this.shapeIndex = {};
	this.shapeCount = 0;
	this.sidCounter = 1;                        // used to generate unique Alberti sid's
	
	// An array of currently selected shapes
	this.selections = [];
	
	// Shape intersections used for auto-snapping
	this.intersections = new Intersection();
}

// Create a new layer on top of the current layer (i.e. with a sequentially
// higher layer number). Automatically sets current layer to new layer.
LayerManager.prototype.newLayer = function(name) {
	this.currentLayer = this.layers.push(new Layer(this.layerGroup, arguments > 0 ? name : "Layer "+(this.layers.length + 1))) - 1;
};

// Create a new layer on top of the current layer from the given Group object.
// Automatically sets current layer to new layer.
LayerManager.prototype.newLayerFromGroup = function(group) {
	this.currentLayer = this.layers.push(Layer.fromGroup(group)) - 1;
};

// Append the given Shape, optionally providing a target layer index number 
// (defaults to the current layer). A Alberti id is automatically assigned to 
// the shape if it doesn't already have one. Returns the shape's Alberti sid.
LayerManager.prototype.insertShape = function(newShape, layerNumber) {
	if (arguments.length < 2) {
		layerNumber = this.currentLayer;
	}
	
	var sid = newShape.getSid();
	
	if (!sid) {
		sid = "s"+this.sidCounter;
		newShape.setSid(sid);
	}
	
	if (!this.shapeIndex[sid]) {
		// Add the shape to the SVG tree
		this.layers[layerNumber].addShape(newShape);
		
		// Calculate new intersection points before the shape is added to the 
		// index, so that it is not tested against itself.
		this.intersections.testShape(newShape, this.getVisibleShapes(), Intersection.insertFlag);
		
		// Create a new shape record
		this.shapeIndex[sid] = {"shape":newShape, "layer":layerNumber};
		this.shapeCount++;
		this.sidCounter++;
	} else {
		throw "Duplicate shape passed to LayerManager::insertShape (sid '"+sid+"').";
	}
	
	return sid;
};

// Delete the given Shape. Pass true for bulk if you are deleting shapes in 
// bulk (keeping in mind that you must later call the Intersection object's 
// "flush" method). Returns the Shape object.
LayerManager.prototype.deleteShape = function(shape, bulk) {
	var sid = shape.getSid();
	
	if (this.shapeIndex[sid]) {
		var layerNumber = this.shapeIndex[sid].layer;
		
		// Remove the shape from the index before checking for intersections, 
		// so that it does not get tested against itself.
		delete this.shapeIndex[sid];
		this.shapeCount--;
		
		// Remove the Shape from the SVG document
		this.layers[layerNumber].removeShape(shape);
		
		// Delete its intersection points
		this.intersections.testShape(shape, this.getVisibleShapes(),
			bulk ? Intersection.bulkDeleteFlag : Intersection.deleteFlag);
	} else {
		throw "Shape with unrecognized sid passed to LayerManager::deleteShape.";
	}
	
	return shape;
};

// Delete currently selected Shapes
LayerManager.prototype.deleteSelectedShapes = function() {
	this.undoManager.recordStart();
	
	for (i = 0, sLen = this.selections.length; i < sLen; i++) {
		var shape = this.selections[i];
		LayerManager.removeShapeSelection(shape);
		
		// Delete the shape, passing its layer number to the redo action so
		// that it is added to the correct layer in case of a "redo"
		this.undoManager.push(this,
			this.deleteShape, [shape, true],
			this.insertShape, [shape, this.shapeIndex[shape.getSid()].layer]);
	}
	
	// Flush the Intersection object after bulk deletions
	this.undoManager.push(this.intersections, this.intersections.flush, null);
	
	this.undoManager.recordStop();
	
	this.selections = [];
};

// Returns all visible Shapes intersecting with or enclosed by the given 
// Rect2D. Sadly, SVG's getIntersectionsList and getEnclosureList are 
// implemented only in Opera, so we need to perform our own calculations.
LayerManager.prototype.getShapesInRect = function(rect) {
	var enclosures = [];
	var visibleShapes = this.getVisibleShapes();
	
	for (var i = 0, vsLen = visibleShapes.length; i < vsLen; i++) {
		if (rect.enclosesRect(visibleShapes[i].getBoundingBox())) {
			enclosures.push(visibleShapes[i]);
		}
	}
	
	// Return the array of intersecting shapes concatenated to the enclosure array
	return enclosures.concat(
		this.intersections.testShape(Rectangle.fromRect2D(rect), visibleShapes, Intersection.nopFlag));
};

// "Pick" shapes near the given coord (max distance determined by radius) and 
// return them as an array, or empty array if none found. If 'true' is passed
// for the 'single' argument, a single Shape object will be returned, or null
// if none found.
LayerManager.prototype.pickShapes = function(coord, radius, single) {
	var pickRect = new Rect2D(coord.x - radius, coord.y - radius, coord.x + radius, coord.y + radius);
	var shapes = this.getShapesInRect(pickRect);
	
	if (single) {
		shapes = shapes.length > 0 ? shapes[0] : null;
	}
	
	return shapes;
};

LayerManager.prototype.clearSelections = function() {
	// Remove selection visuals on previously selected shapes
	for (var i = 0, sLen = this.selections.length; i < sLen; i++) {
		LayerManager.removeShapeSelection(this.selections[i]);
	}
	
	this.selections = [];
};

// Sets the current selection to a single Shape, or an array of Shapes. Note 
// that if an array is passed in, it will not be copied. Passing an empty
// array or null will clear the current selection.
LayerManager.prototype.setSelection = function(shapes) {
	this.clearSelections();
	this.selections = Array.isArray(shapes) ? shapes : (shapes !== null ? [shapes] : []);
	
	// Add selection visuals to newly selected shapes
	for (var i = 0, sLen = this.selections.length; i < sLen; i++) {
		LayerManager.displayShapeSelection(this.selections[i]);
	}
};

// Inverts the selection status of a single Shape, or an array of Shapes. That
// is, if a shape is already selected, it is unselected. If it is not 
// currently selected, it is added to current selection.
LayerManager.prototype.xorSelection = function(shapes) {
	shapes = Array.isArray(shapes) ? shapes : (shapes !== null ? [shapes] : []);
	
	for (var i = 0, sLen = shapes.length; i < sLen; i++) {
		var existingIndex = this.selections.indexOf(shapes[i]);
		
		if (existingIndex == -1) {
			this.selections.push(shapes[i]);
			LayerManager.displayShapeSelection(shapes[i]);
		} else {
			this.selections.splice(existingIndex, 1);
			LayerManager.removeShapeSelection(shapes[i]);
		}
	}
};

// Returns an array of all visible user-created Shapes.
LayerManager.prototype.getVisibleShapes = function() {
	var shapes = [];
	
	for (var sid in this.shapeIndex) {
		var shapeRecord = this.shapeIndex[sid];
		
		if (!this.layers[shapeRecord.layer].isHidden()) {
			shapes.push(shapeRecord.shape);
		}
	}
	
	return shapes;
};

LayerManager.displayShapeSelection = function(shape) {
	shape.set("class", "selected");
};

LayerManager.removeShapeSelection = function(shape) {
	shape.set("class", "");
};
