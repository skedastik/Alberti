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
	
	// Hidden layer count
	this.numHiddenLayers = 0;
	
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

// Generate and insert a new layer, optionally providing its name. Returns the
// new layer.
LayerManager.prototype.newLayer = function(name) {
	var newLayer = new Layer(new Group().generate());
	newLayer.setName(name ? name : "Layer "+(this.layers.length + 1));
	
	this.insertLayer(newLayer);
	
	return newLayer;
};

// Generate a new layer from the given Group object and insert it. Returns the
// new layer.
LayerManager.prototype.newLayerFromGroup = function(group) {
	var newLayer = new Layer(group);
	newLayer.setName(group.get("title"));
	
	if (group.get("visibility") == "hidden") {
		this.numHiddenLayers++;
		newLayer.hide();
	}
	
	this.insertLayer(newLayer);
	
	return newLayer;
};

// Inserts the given layer on top of the current layer by default. 
// Automatically sets current layer to inserted layer. Layer insertions are 
// automatically registered with the undo manager. Pass true for before to
// insert below the current layer instead of above.
LayerManager.prototype.insertLayer = function(layer, before) {
	if (this.currentLayer != -1) {
		if (before) {
			this.layerGroup.attachChildBefore(layer.svgGroup, this.layers[this.currentLayer].svgGroup);
		} else {
			this.layerGroup.attachChildAfter(layer.svgGroup, this.layers[this.currentLayer].svgGroup);
		}
	} else {
		this.layerGroup.attachChild(layer.svgGroup);
	}
	
	var layerIndex = before ? this.currentLayer : this.currentLayer + 1;	
	this.layers.splice(layerIndex, 0, layer);
	
	this.undoManager.recordStart();
	
	// Buffer layer switch and insertion undo actions
	this.switchToLayer(layerIndex);
	this.undoManager.push("Insert Layer", this, this.insertLayer, [layer], this.deleteCurrentLayer, null);
	
	this.undoManager.recordStop();
};

// Delete the current layer. If only one layer exists, an exception is thrown. 
// Layer deletions are automatically registered with the undo manager. Current
// layer becomes the layer below the deleted layer, or, if there is nothing
// below, the layer above.
LayerManager.prototype.deleteCurrentLayer = function() {
	Util.assert(this.layers.length > 1, "LayerManager::deleteCurrentLayer attempted to delete only remaining layer.");
	
	var targetLayerIndex = this.currentLayer;
	var targetLayer = this.layers[targetLayerIndex];
	
	// Remove the layer's SVG group node from the SVG tree
	targetLayer.svgGroup.detach();
	
	this.undoManager.recordStart();
	
	// Delete the layer's shapes in bulk.
	while (targetLayer.shapes.length > 0) {
		var shape = targetLayer.shapes.peek();
		
		this.undoManager.push("Delete Shape", this,
			this.deleteShape, [shape, true],
			this.insertShape, [shape, this.shapeIndex[shape.getSid()].layer]
		);
		this.deleteShape(shape, true);
	}
	
	// Flush the bulk deletion
	this.undoManager.push("Flush Intersections", this.intersections, this.intersections.flush, null);
	this.intersections.flush();
	
	// Switch to another layer before deleting current layer, otherwise undo
	// will attempt to switch to the deleted layer before it is re-inserted.
	//
	//
	// TODO: Check for hidden layers !!!!!!!!!!!
	this.switchToLayer(this.currentLayer > 0 ? this.currentLayer - 1 : this.currentLayer);
	
	// Register the layer deletion with the undo manager. If any layer but
	// the topmost layer is being deleted, the redo action must insert 
	// before the current layer rather than after.
	this.undoManager.push("Delete Current Layer", this,
		this.deleteCurrentLayer, null,
		this.insertLayer, [targetLayer, targetLayerIndex == 0]
	);
	
	this.layers.splice(this.currentLayer, 1);
	
	this.undoManager.recordStop();
};

// Switch to the layer with the given index. Automatically registers an undo 
// action. An exception is raised if attempting to switch to hidden layer.
LayerManager.prototype.switchToLayer = function(layerNumber) {
	if (layerNumber != this.currentLayer) {
		Util.assert(
			layerNumber >= 0 && layerNumber < this.layers.length,
			"Invalid layer passed to LayerManager::switchToLayer."
		);
		
		// TODO: Automatically show hidden layer if no visible layer is available.
		Util.assert(!this.layers[layerNumber].hidden, "LayerManager::switchToLayer attempted to switch to a hidden layer.");
		
		// Register the layer switch with the undo manager. This is a cascading undo.
		this.undoManager.push("Change Current Layer", this,
			this.switchToLayer, [layerNumber],
			this.switchToLayer, [this.currentLayer],
			true
		);
		
		this.currentLayer = layerNumber;
	}
};

// Switch to next visible layer above current layer, wrapping around if necessary
LayerManager.prototype.switchToLayerAbove = function(arguments) {
	var nextLayer = this.getNextHighestVisibleLayer();
	this.switchToLayer(nextLayer >= 0 ? nextLayer : this.getNextHighestVisibleLayer(-1));
};

// Switch to next visible layer below current layer, wrapping around if necessary
LayerManager.prototype.switchToLayerBelow = function(arguments) {
	var prevLayer = this.getNextLowestVisibleLayer();
	this.switchToLayer(prevLayer >= 0 ? prevLayer : this.getNextLowestVisibleLayer(this.layers.length));
};

// Set the visibility of the layer with the given index. Pass true for 
// 'makeVisible' to show the layer, false to hide it. If the current layer is 
// hidden, current layer is switched to the next highest visible layer, or 
// next lowest if next highest does not exist. At least one layer must remain 
// visible at all times. Automatically registers an undo action.
LayerManager.prototype.setLayerVisibility = function(layerNumber, makeVisible) {
	var targetLayer = this.layers[layerNumber];
	
	Util.assert(targetLayer, "Invalid layer passed to LayerManager::setLayerVisibility.");
	
	if (makeVisible) {
		if (targetLayer.hidden) {
			this.numHiddenLayers--;
		
			// Add intersection points of all shapes in the layer
			for (var i = 0, sLen = targetLayer.shapes.length; i < sLen; i++) {
				var shape = targetLayer.shapes[i];
				this.intersections.testShape(shape, this.getVisibleShapes(), Intersection.insertFlag);
			}
		
			// Make it undoable
			this.undoManager.push("Show Layer", this,
				this.setLayerVisibility, [layerNumber, true],
				this.setLayerVisibility, [layerNumber, false]
			);
			targetLayer.show();
		}
	} else if (!targetLayer.hidden) {
		Util.assert(
			this.layers.length - this.numHiddenLayers > 1,
			"LayerManager::setLayerVisibility attempted to hide only visible layer."
		);
		
		this.numHiddenLayers++;
		
		// Delete intersection points of all shapes in the layer
		for (var i = 0, sLen = targetLayer.shapes.length; i < sLen; i++) {
			var shape = targetLayer.shapes[i];
			this.intersections.testShape(shape, this.getVisibleShapes(), Intersection.bulkDeleteFlag);
		}
		
		// Flush bulk deletions
		this.intersections.flush();
		
		this.undoManager.recordStart();
		
		// If current layer is being hidden, switch current layer to next
		// highest visible layer, or next lowest if next highest does not 
		// exist.
		if (this.layers.indexOf(targetLayer) == this.currentLayer) {
			var nextLayer = this.getNextHighestVisibleLayer();
			var prevLayer = this.getNextLowestVisibleLayer();
			this.switchToLayer(nextLayer >= 0 ? nextLayer : (prevLayer >= 0 ? prevLayer : this.currentLayer));
		}
		
		// Make it undoable
		this.undoManager.push("Hide Layer", this,
			this.setLayerVisibility, [layerNumber, false],
			this.setLayerVisibility, [layerNumber, true]
		);
		targetLayer.hide();
		
		this.undoManager.recordStop();
	}
};

// Returns the index of the next highest visible layer from the layer with the
// given index (defaults to current layer), or -1 if none found.
LayerManager.prototype.getNextHighestVisibleLayer = function(fromLayerNumber) {
	for (var i = (fromLayerNumber ? fromLayerNumber : this.currentLayer) + 1, len = this.layers.length; i < len; i++) {
		if (!this.layers[i].hidden) {
			return i;
		}
	}
	
	return -1;
};

// Returns the index of the next lowest visible layer from the layer with the
// given index (defaults to current layer), or -1 if none found.
LayerManager.prototype.getNextLowestVisibleLayer = function(fromLayerNumber) {
	for (var i = (fromLayerNumber ? fromLayerNumber : this.currentLayer) - 1; i >= 0; i--) {
		if (!this.layers[i].hidden) {
			return i;
		}
	}
	
	return -1;
};

// Expects a reference to an existing Layer object, or the layer's index and 
// returns the Layer object.
LayerManager.prototype.getLayerObject = function(layer) {
	return (typeof layer == "number") ? this.layers[layer] : layer;
};

// Expects a reference to an existing Layer object, or the layer's index and 
// returns the layer's index.
LayerManager.prototype.getLayerIndex = function(layer) {
	return (typeof layer == "number") ? layer : this.layers.indexOf(layer);
};

// Append the given Shape, optionally providing a target layer object 
// (defaults to the current layer). An Alberti sid is automatically assigned 
// to the shape if it doesn't already have one. Returns the shape's Alberti 
// sid.
LayerManager.prototype.insertShape = function(newShape, layer) {	
	var sid = newShape.getSid();
	
	// Assign an Alberti sid if the shape does not already have one
	if (!sid) {
		sid = "s"+this.sidCounter;
		newShape.setSid(sid);
	}
	
	Util.assert(!this.shapeIndex[sid], "Duplicate shape passed to LayerManager::insertShape (sid '"+sid+"').");
	
	var targetLayer = layer ? layer : this.layers[this.currentLayer];
	targetLayer.addShape(newShape);
	
	// Calculate new intersection points before the shape is added to the 
	// index, so that it is not tested against itself.
	this.intersections.testShape(newShape, this.getVisibleShapes(), Intersection.insertFlag);
	
	// Create a new shape record
	this.shapeIndex[sid] = {"shape":newShape, "layer":targetLayer};
	this.shapeCount++;
	this.sidCounter++;
	
	return sid;
};

// Delete the given Shape. Pass true for bulk if you are deleting shapes in 
// bulk (keeping in mind that you must later call the Intersection object's 
// "flush" method). Returns the Shape object.
LayerManager.prototype.deleteShape = function(shape, bulk) {
	var sid = shape.getSid();
	var layer = this.shapeIndex[sid].layer;
	
	Util.assert(this.shapeIndex[sid], "Shape with unrecognized sid passed to LayerManager::deleteShape.");
	
	// Remove the shape from the index before checking for intersections, 
	// so that it does not get tested against itself.
	delete this.shapeIndex[sid];
	this.shapeCount--;
	
	// Remove the Shape from the SVG document
	layer.removeShape(shape);
	
	// Delete its intersection points
	this.intersections.testShape(shape, this.getVisibleShapes(),
		bulk ? Intersection.bulkDeleteFlag : Intersection.deleteFlag);
	
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
		this.undoManager.push("Delete Shape", this,
			this.deleteShape, [shape, true],
			this.insertShape, [shape, this.shapeIndex[shape.getSid()].layer]
		);
		this.deleteShape(shape, true);
	}
	
	// Flush the Intersection object after bulk deletions
	this.undoManager.push("Flush Intersections", this.intersections, this.intersections.flush, null);
	this.intersections.flush();
	
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
		
		if (!shapeRecord.layer.isHidden()) {
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
