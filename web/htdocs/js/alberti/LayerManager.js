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

// Generate and insert a new layer, optionally providing its name.
LayerManager.prototype.newLayer = function(name) {
	var newLayer = new Layer(new Group().generate());
	newLayer.setName(name ? name : "Layer "+(this.layers.length + 1));
	
	this.insertLayer(newLayer);
};

// Generate a new layer from the given Group object and insert it.
LayerManager.prototype.newLayerFromGroup = function(group) {
	var newLayer = new Layer(group);
	newLayer.setName(group.get("title"));
	
	if (group.get("visibility") == "hidden") {
		newLayer.hideLayer();
	}
	
	this.insertLayer(newLayer);
};

// Inserts the given layer on top of the current layer by default. 
// Automatically sets current layer to inserted layer. Layer insertions are 
// automatically registered with the undo manager. Pass true for before to
// insert below the current layer instead of above.
LayerManager.prototype.insertLayer = function(layer, before) {
	Dbug.log("LayerManager::insertLayer > "+layer);
	
	if (this.currentLayer != -1) {
		if (before) {
			this.layerGroup.attachChildBefore(layer.svgGroup, this.layers[this.currentLayer].svgGroup);
		} else {
			this.layerGroup.attachChildAfter(layer.svgGroup, this.layers[this.currentLayer].svgGroup);
		}
	} else {
		this.layerGroup.attachChild(layer.svgGroup);
	}
	
	if (before) {
		this.layers.splice(this.currentLayer, 0, layer);
	} else {
		this.layers.splice(this.currentLayer + 1, 0, layer);
		this.currentLayer++;
	}
	
	// Register the layer insertion with the undo manager
	this.undoManager.push("Insert Layer", this, this.insertLayer, [layer], this.deleteCurrentLayer, null);
};

// Delete the current layer. If only one layer exists, it will not be deleted. 
// Layer deletions are automatically registered with the undo manager. Current
// layer becomes the layer above the deleted layer, or, if there is nothing
// above, the layer below.
LayerManager.prototype.deleteCurrentLayer = function() {
	Dbug.log("LayerManager::deleteCurrentLayer");
	
	// BUG! To reproduce ('>' means enter in console):
	// 
	// 1. Reload page
	// 2. > albertiApp.doc.layerManager.switchToLayer(0);
	// 3. > albertiApp.doc.layerManager.deleteCurrentLayer();
	// 4. Undo
	// 9. Redo
	//
	// Shapes from both layers are deleted! Fix this.
	// 
	
	if (this.layers.length > 1) {
		var targetLayer = this.layers[this.currentLayer];
		
		// Remove the layer's SVG group node from the SVG tree
		targetLayer.svgGroup.detach();
		
		this.undoManager.recordStart();
		
		// Delete the layer's shapes in bulk.
		while (targetLayer.shapes.length > 0) {
			var shape = targetLayer.shapes.peek();
			
			this.undoManager.push("Delete Shape (sid="+shape.getSid()+")", this,
				this.deleteShape, [shape, true],
				this.insertShape, [shape, this.shapeIndex[shape.getSid()].layer]);
			this.deleteShape(shape, true);
		}
		
		// Flush the bulk deletion
		this.undoManager.push("Flush Intersections", this.intersections, this.intersections.flush, null);
		this.intersections.flush();
		
		// Register the layer deletion with the undo manager. If any layer but
		// the topmost layer is being deleted, the redo action must insert 
		// before the current layer rather than after.
		this.undoManager.push("Delete Current Layer", this,
			this.deleteCurrentLayer, null,
			this.insertLayer, [targetLayer, this.currentLayer < this.layers.length - 1]);
		
		this.undoManager.recordStop();
		
		this.layers.splice(this.currentLayer, 1);
		
		if (this.currentLayer == this.layers.length) {
			this.currentLayer--;
		}
	}
};

// Switch to the given layer (expects either a reference to an existing Layer 
// object, or an array index). Automatically registers an undo action.
LayerManager.prototype.switchToLayer = function(layer) {
	Dbug.log("LayerManager::switchToLayer > "+layer);
	
	if (layerIndex != this.currentLayer) {
		var layerIndex = (typeof layer == "number") ? layer : this.layers.indexOf(layer);
		
		if (layerIndex < 0 || layerIndex >= this.layers.length) {
			throw "Invalid layer passed to LayerManager::switchToLayer.";
		}
	
		// Register the layer switch with the undo manager
		this.undoManager.push("Change Current Layer", this, this.switchToLayer, [layerIndex], this.switchToLayer, [this.currentLayer]);
	
		this.currentLayer = layerIndex;
	}
};

// Append the given Shape, optionally providing a target layer object 
// (defaults to the current layer). An Alberti sid is automatically assigned 
// to the shape if it doesn't already have one. Returns the shape's Alberti 
// sid.
LayerManager.prototype.insertShape = function(newShape, layer) {	
	var sid = newShape.getSid();
	
	if (!sid) {
		sid = "s"+this.sidCounter;
		newShape.setSid(sid);
	}
	
	Dbug.log("LayerManager::insertShape > "+newShape+" (sid="+sid+") into layer object "+layer);
	
	if (!this.shapeIndex[sid]) {
		var targetLayer = layer ? layer : this.layers[this.currentLayer];
		
		targetLayer.addShape(newShape);
		
		// Calculate new intersection points before the shape is added to the 
		// index, so that it is not tested against itself.
		this.intersections.testShape(newShape, this.getVisibleShapes(), Intersection.insertFlag);
		
		// Create a new shape record
		this.shapeIndex[sid] = {"shape":newShape, "layer":targetLayer};
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
	
	Dbug.log("LayerManager::deleteShape > "+shape+" (sid="+sid+")");
	
	if (this.shapeIndex[sid]) {
		var layer = this.shapeIndex[sid].layer;
		
		// Remove the shape from the index before checking for intersections, 
		// so that it does not get tested against itself.
		delete this.shapeIndex[sid];
		this.shapeCount--;
		
		// Remove the Shape from the SVG document
		layer.removeShape(shape);
		
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
		this.undoManager.push("Delete Shape", this,
			this.deleteShape, [shape, true],
			this.insertShape, [shape, this.shapeIndex[shape.getSid()].layer]);
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
