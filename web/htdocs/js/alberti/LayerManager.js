/*  
 *  Copyright (C) 2011, Alaric Holloway <alaric.holloway@gmail.com>
 *  
 *  This file is part of Alberti.
 *
 *  Alberti is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  Alberti is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with Alberti.  If not, see <http://www.gnu.org/licenses/>.
 *  
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * LayerManager.js
 * 
 * Keeps track of and manages access to data in user-created layers.
 * 
 * * */
 
function LayerManager(layerGroup, undoManager) {
	this.layerGroup = layerGroup;      // Contains all user-created layers
	this.undoManager = undoManager;
	this.layers = [];
	this.currentLayer = null;
	
	Layer.resetCounter();              // Reset the layer name counter
	
	// Hidden layer count
	this.numHiddenLayers = 0;
	
	// shapeIndex contains shape records of all user-created shapes, mapped to 
	// Shape sid properties. Each shape record is an object with two 
	// properties: "shape" being a reference to the Shape object, and "layer" 
	// being a reference to the Layer object that contains the shape.
	this.shapeIndex = {};
	this.shapeCount = 0;
	
	// An array of currently selected shapes
	this.selectedShapes = [];
	
	this.snapPoints = new SnapPoints();
}

// Generate and insert a new layer, optionally providing its name. Returns the new layer.
LayerManager.prototype.newLayer = function(name) {
	var newLayer = new Layer().generate();
	newLayer.setName(name ? name : "Layer "+Layer.counter);
	this.insertLayer(newLayer);
	
	return newLayer;
};

// Inserts Layer object 'newLayer' above current layer by default. You may
// optionally supply a reference Layer object. The new layer will be inserted 
// after this layer. Finally, you may optionally pass 'true' for 'before' in 
// order to insert before the reference layer rather than after. Automatically 
// sets current layer to inserted layer. Layer insertions are automatically 
// registered with the undo manager.
LayerManager.prototype.insertLayer = function(newLayer, refLayer, before) {
	// Increment the hidden layer counter if new layer is hidden
	if (newLayer.isHidden()) {
		this.numHiddenLayers++;
	}
	
	refLayer = refLayer ? refLayer : this.currentLayer;
	
	if (this.layers.length > 0) {
		if (before) {
			this.layerGroup.attachChildBefore(newLayer, refLayer);
		} else {
			this.layerGroup.attachChildAfter(newLayer, refLayer);
		}
	} else {
		this.layerGroup.attachChild(newLayer);
	}
	
	var insertIndex = this.layers.indexOf(refLayer);
	insertIndex = before ? insertIndex : insertIndex + 1;	
	this.layers.splice(insertIndex, 0, newLayer);
	
	// Register undo action for insertion
	this.undoManager.push("Insert Layer", this,
		this.insertLayer, [newLayer, refLayer, before],
		this.deleteLayer, [newLayer, true]                    // invert deleteLayer method's switch-direction on undo
	);
	
	// Layer-switch undo will cascade automatically
	this.switchToLayer(newLayer);
};

// Delete the layer with the given index. If only one layer exists, an 
// exception is thrown. Current layer becomes the next visible layer above the 
// specified layer, or, if there is nothing above, the next visible layer 
// below. You may invert this behavior by passing 'true' for 'invertSwitch'. 
// Layer deletions are automatically registered with the undo manager.
LayerManager.prototype.deleteLayer = function(targetLayer, invertSwitch) {
	Util.assert(this.layers.length > 1, "LayerManager::deleteLayer attempted to delete only remaining layer.");
	
	// Remove the layer from the SVG tree
	targetLayer.detach();
	
	this.undoManager.recordStart();
	
	// Delete the layer's shapes in bulk.
	while (targetLayer.shapes.length > 0) {
		this.removeShape(targetLayer.shapes.peek(), true);
	}
	
	// Flush the bulk deletion
	this.undoManager.push("Flush Snap Points", this.snapPoints, this.snapPoints.flush, null);
	this.snapPoints.flush();
	
	var targetIndex = this.layers.indexOf(targetLayer);
	
	if (targetLayer == this.currentLayer) {
		// Current layer is being deleted; determine which layer to switch to
		var nextLowest = this.getNextLowestVisibleLayer(targetLayer);
		var nextHighest = this.getNextHighestVisibleLayer(targetLayer);
		var fallback = invertSwitch ? (targetIndex > 0 ? (nextLowest ? nextLowest : nextHighest) : nextHighest)
			: (targetIndex < this.layers.length - 1 ? (nextHighest ? nextHighest : nextLowest) : nextLowest);
		
		// Switch to fallback layer _before_ deleting current layer, otherwise 
		// undo will attempt to switch to the deleted layer before it is re-
		// inserted.
		this.switchToLayer(fallback);
	}
	
	// Register the layer deletion with the undo manager. If the bottommost
	// layer is being deleted, the redo action must insert before rather than 
	// after.
	this.undoManager.push("Delete Current Layer", this,
		this.deleteLayer, [targetLayer],
		this.insertLayer, [targetLayer, targetIndex == 0 ? this.layers[1] : this.layers[targetIndex - 1], targetIndex == 0]
	);
	
	this.layers.splice(targetIndex, 1);
	
	this.undoManager.recordStop();
};

LayerManager.prototype.deleteCurrentLayer = function() {
	this.deleteLayer(this.currentLayer);
};

// Move target layer below 'beforeLayer', or on top of all other layers if
// 'beforeLayer' not specified. Undo-able.
LayerManager.prototype.moveLayer = function(targetLayer, beforeLayer) {
	var targetIndex = this.layers.indexOf(targetLayer);
	
	// Make it undo-able
	this.undoManager.push("Move Layer", this,
		this.moveLayer, [targetLayer, beforeLayer],
		this.moveLayer, [targetLayer, targetIndex < this.layers.length - 1 ? this.layers[targetIndex + 1] : undefined]
	);
	
	this.layers.splice(targetIndex, 1);
	targetLayer.detach();
	
	if (beforeLayer) {
		this.layers.splice(this.layers.indexOf(beforeLayer), 0, targetLayer);
		this.layerGroup.attachChildBefore(targetLayer, beforeLayer);
	} else {
		this.layers.push(targetLayer);
		this.layerGroup.attachChild(targetLayer);
	}
};

// Switch to the specified Layer object. Automatically registers an undo 
// action. An exception is raised if attempting to switch to hidden layer.
LayerManager.prototype.switchToLayer = function(targetLayer) {
	Util.assert(this.layers.indexOf(targetLayer) >= 0, "Invalid layer passed to LayerManager::switchToLayer.");
	
	// Register the layer switch with the undo manager. This is a cascading undo.
	this.undoManager.push("Change Current Layer", this,
		this.switchToLayer, [targetLayer],
		this.switchToLayer, [this.currentLayer],
		true
	);
	
	this.currentLayer = targetLayer;
};

LayerManager.prototype.switchToHighestVisibleLayer = function() {
	this.switchToLayer(this.getNextLowestVisibleLayer());
};

// Switch to next visible layer above current layer, wrapping around if necessary
LayerManager.prototype.switchToVisibleLayerAboveCurrentLayer = function() {
	if (this.layers.length > 1) {
		var nextLayer = this.getNextHighestVisibleLayer(this.currentLayer);
		this.switchToLayer(nextLayer ? nextLayer : this.getNextHighestVisibleLayer());
	}
};

// Switch to next visible layer below current layer, wrapping around if necessary
LayerManager.prototype.switchToVisibleLayerBelowCurrentLayer = function() {
	if (this.layers.length > 1) {
		var prevLayer = this.getNextLowestVisibleLayer(this.currentLayer);
		this.switchToLayer(prevLayer ? prevLayer : this.getNextLowestVisibleLayer());
	}
};

// Set name of given Layer object. Undoable.
LayerManager.prototype.setLayerName = function(targetLayer, newLayerName) {
	var oldName = targetLayer.name;
	targetLayer.setName(newLayerName);
	
	// Make it undoable
	this.undoManager.push("Change Layer Name", this,
		this.setLayerName, [targetLayer, newLayerName],
		this.setLayerName, [targetLayer, oldName]
	);
};

// Set the color of the given Layer object. Undo-able.
LayerManager.prototype.setLayerColor = function(targetLayer, newColor) {
	var oldColor = targetLayer.color;
	targetLayer.setColor(newColor);
	
	// Make it undo-able
	this.undoManager.push("Change Layer Color", this,
		this.setLayerColor, [targetLayer, newColor],
		this.setLayerColor, [targetLayer, oldColor]
	);
};

// Set the visibility of given Layer object. Pass true for 'makeVisible' to 
// show the layer, false to hide it. If the current layer is hidden, current 
// layer is switched to the next highest visible layer, or next lowest if next 
// highest does not exist. At least one layer must remain visible at all 
// times. Automatically registers an undo action.
LayerManager.prototype.setLayerVisibility = function(targetLayer, makeVisible) {	
	Util.assert(targetLayer, "Invalid layer passed to LayerManager::setLayerVisibility.");
	
	if (makeVisible) {
		if (targetLayer.isHidden()) {
			this.numHiddenLayers--;
			
			var visibleShapes = this.getVisibleShapes();
		
			// Add intersection points of all shapes in the layer
			for (var i = 0, sLen = targetLayer.shapes.length; i < sLen; i++) {
				var shape = targetLayer.shapes[i];
				this.snapPoints.testIntersections(shape, visibleShapes, SnapPoints.insertFlag);
				
				// Each shape being tested is to be shown, so add it to the
				// visible shapes array as it is tested.
				visibleShapes.push(shape);
			}
			
			targetLayer.show();
		
			// Make it undoable
			this.undoManager.push("Show Layer", this,
				this.setLayerVisibility, [targetLayer, true],
				this.setLayerVisibility, [targetLayer, false]
			);
		}
	} else if (!targetLayer.isHidden()) {
		Util.assert(
			this.getNumberOfVisibleLayers() > 1,
			"LayerManager::setLayerVisibility attempted to hide only visible layer."
		);
		
		this.numHiddenLayers++;
		
		var visibleShapes = this.getVisibleShapes();
		
		// Delete intersection points of all shapes in the layer. Do so in
		// reverse order so that intersections are tested in the same order
		// as when they were inserted. The reason for this is that, 
		// due to floating point rounding errors, testing shape A against 
		// shape B may yield different results than testing shape B against 
		// shape A. Normally this would be corrected by rounding, but 
		// javascript's Math.round() is asymmetric--it always rounds up rather
		// than away from 0. The rounding errors caused by this are rare, but 
		// it's already happened at least once (as of 7/1/2011).
		for (var i = targetLayer.shapes.length - 1; i >= 0; i--) {
			var shape = targetLayer.shapes[i];
			this.snapPoints.testIntersections(shape, visibleShapes, SnapPoints.bulkDeleteFlag);
			
			// Each shape being tested is to be hidden, so remove it from the
			// visible shapes array as it is tested.
			visibleShapes[visibleShapes.indexOf(shape)] = null;
		}
		
		// Flush bulk deletions
		this.snapPoints.flush();
		
		this.undoManager.recordStart();
		
		// Clear selections before hiding layer
		this.setSelection([]);
		
		// If current layer is being hidden, switch current layer to next
		// highest visible layer, or next lowest if next highest does not 
		// exist.
		if (targetLayer == this.currentLayer) {
			var nextLayer = this.getNextHighestVisibleLayer(targetLayer);
			var prevLayer = this.getNextLowestVisibleLayer(targetLayer);
			this.switchToLayer(nextLayer ? nextLayer : prevLayer);
		}
		
		// Make it undoable
		this.undoManager.push("Hide Layer", this,
			this.setLayerVisibility, [targetLayer, false],
			this.setLayerVisibility, [targetLayer, true]
		);
		
		targetLayer.hide();
		
		this.undoManager.recordStop();
	}
};

LayerManager.prototype.getCurrentLayer = function() {
	return this.currentLayer;
};

LayerManager.prototype.getTopmostLayer = function() {
	return this.layers[this.layers.length - 1];
};

// Returns the next highest visible Layer from the specified Layer object, or 
// from the lowest layer if none specified. Returns null if none found.
LayerManager.prototype.getNextHighestVisibleLayer = function(fromLayer) {
	var fromIndex = fromLayer ? this.layers.indexOf(fromLayer) : -1;
	
	for (var i = fromIndex + 1, len = this.layers.length; i < len; i++) {
		if (!this.layers[i].isHidden()) {
			return this.layers[i];
		}
	}
	
	return null;
};

// Returns the next lowest visible Layer from the specified Layer object, or 
// from the highest layer if none specified. Returns null if none found.
LayerManager.prototype.getNextLowestVisibleLayer = function(fromLayer) {
	var fromIndex = fromLayer ? this.layers.indexOf(fromLayer) : this.layers.length;
	
	for (var i = fromIndex - 1; i >= 0; i--) {
		if (!this.layers[i].isHidden()) {
			return this.layers[i];
		}
	}
	
	return null;
};

LayerManager.prototype.getNumberOfVisibleLayers = function() {
	return this.layers.length - this.numHiddenLayers;
};

// Append the given Shape, optionally providing a target layer object 
// (defaults to the current layer). Returns the shape's sid. Undo-able.
LayerManager.prototype.insertShape = function(newShape, targetLayer) {	
	var sid = newShape.sid;
	Util.assert(!this.shapeIndex[sid], "Duplicate shape passed to LayerManager::insertShape (sid '"+sid+"').");
	
	targetLayer = targetLayer ? targetLayer : this.currentLayer;
	targetLayer.addShape(newShape);
	
	// Do not test for intersections if target layer is hidden
	if (!targetLayer.isHidden()) {
		// Calculate new intersection points before the shape is added to the 
		// index, so that it is not tested against itself.
		this.snapPoints.testIntersections(newShape, this.getVisibleShapes(), SnapPoints.insertFlag);
	}
	
	// Create a new shape record
	this.shapeIndex[sid] = {"shape":newShape, "layer":targetLayer};
	this.shapeCount++;
	
	// Make it undo-able
	this.undoManager.push("Insert Shape", this,
		this.insertShape, [newShape, targetLayer],
		this.removeShape, [newShape]
	);
	
	return sid;
};

// Delete the given Shape. Pass true for bulk if you are deleting shapes in 
// bulk (keeping in mind that you must later call the "flush" method of 
// LayerManager's "intersections" ivar). Returns the Shape object.  Undo-able.
LayerManager.prototype.removeShape = function(shape, bulk) {
	var sid = shape.sid;
	var layer = this.shapeIndex[sid].layer;
	
	Util.assert(this.shapeIndex[sid], "Shape with unrecognized sid passed to LayerManager::removeShape.");
	
	// Remove the shape from the index before checking for intersections, 
	// so that it does not get tested against itself.
	delete this.shapeIndex[sid];
	this.shapeCount--;
	
	// Remove the Shape from the SVG document
	layer.removeShape(shape);
	
	// Delete its intersection points
	this.snapPoints.testIntersections(
		shape, this.getVisibleShapes(), bulk ? SnapPoints.bulkDeleteFlag : SnapPoints.deleteFlag
	);
	
	// Make it undo-able
	this.undoManager.push("Delete Shape", this,
		this.removeShape, [shape, bulk],
		this.insertShape, [shape, layer]
	);
	
	return shape;
};

// Returns array of selected shapes, or empty array if none selected
LayerManager.prototype.getSelectedShapes = function() {
	return this.selectedShapes.clone();
};

// Delete currently selected Shapes
LayerManager.prototype.deleteSelectedShapes = function() {
	this.undoManager.recordStart();
	
	for (i = this.selectedShapes.length - 1; i >= 0; i--) {
		this.removeShape(this.selectedShapes[i], true);
	}
	
	this.setSelection([]);
	
	// Flush the SnapPoints object after bulk deletions
	this.undoManager.push("Flush Snap Points", this.snapPoints, this.snapPoints.flush, null);
	this.snapPoints.flush();
	
	this.undoManager.recordStop();
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
		this.snapPoints.testIntersections(Rectangle.fromRect2D(rect), visibleShapes, SnapPoints.nopFlag)[0]
	);
};

// "Pick" shapes near the given coord (max distance determined by radius) and 
// return them as an array, or empty array if none found. If 'true' is passed
// for the 'single' argument, a single Shape object will be returned, or null
// if none found.
LayerManager.prototype.pickShapes = function(coord, radius, single) {
	var pickRect = new Rect2D(coord.x - radius, coord.y - radius, coord.x + radius, coord.y + radius);
	var shapes = this.getShapesInRect(pickRect);
	
	if (single) {
		// If picking a single shape, pick the one with the highest z-index
		shapes = shapes.length > 0 ? shapes.peek() : null;
	}
	
	return shapes;
};

// Select the given shape
LayerManager.prototype.selectShape = function(shape) {
	if (this.selectedShapes.indexOf(shape) == -1) {
		this.selectedShapes.push(shape);
		shape.displaySelected();
	}
};

// Deselect the given shape
LayerManager.prototype.deselectShape = function(shape) {
	var index = this.selectedShapes.indexOf(shape);
	
	if (index >= 0) {
		this.selectedShapes.splice(index, 1);
		shape.displayDeselected();
	}
};

// Sets the current selection to a single Shape, or an array of Shapes. Note 
// that if an array is passed in, it will not be copied. Passing an empty
// array or null will clear the current selection. Undo-able.
LayerManager.prototype.setSelection = function(shapes) {
	var originalSelection = this.getSelectedShapes();
	shapes = Array.isArray(shapes) ? shapes : (shapes !== null ? [shapes] : []);
	
	for (var i = this.selectedShapes.length - 1; i >= 0; i--) {
		this.deselectShape(this.selectedShapes[i]);
	}
	
	for (var i = 0, sLen = shapes.length; i < sLen; i++) {
		this.selectShape(shapes[i]);
	}
	
	var newSelection = this.getSelectedShapes();
	
	if (!newSelection.equals(originalSelection)) {
		this.undoManager.push("Select Shapes", this,
			this.setSelection, [newSelection],
			this.setSelection, [originalSelection]
		);
	}
};

// Invert the selected state of a single Shape, or an array of Shapes. Undo-able.
LayerManager.prototype.xorSelection = function(shapes) {
	var originalSelection = this.getSelectedShapes();
	shapes = Array.isArray(shapes) ? shapes : (shapes !== null ? [shapes] : []);
	
	for (var i = 0, sLen = shapes.length; i < sLen; i++) {
		this[(this.selectedShapes.indexOf(shapes[i]) == -1) ? "selectShape" : "deselectShape"](shapes[i]);
	}
	
	var newSelection = this.getSelectedShapes();
	
	if (!newSelection.equals(originalSelection)) {
		this.undoManager.push("Modify Selection", this,
			this.setSelection, [newSelection],
			this.setSelection, [originalSelection]
		);
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

// Calls serialize() on all shapes
LayerManager.prototype.serializeAll = function() {
	for (var sid in this.shapeIndex) {
		this.shapeIndex[sid].shape.serialize();
	}
};
