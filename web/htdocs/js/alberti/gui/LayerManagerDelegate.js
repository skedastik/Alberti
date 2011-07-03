/*
 * LayerManagerDelegate.js
 * 
 * Propagates LayerManager mutations to a LayerPanelController and 
 * UserInterface object.
 * 
 * * */

function LayerManagerDelegate(layerManager, lpController, ui) {
	LayerManagerDelegate.baseConstructor.call(this, layerManager);
	this.lpController = lpController;
	this.ui = ui;
	
	// Layer-related delegation
	this.mapMethod("insertLayer", "insertLayerPreDelegate", "insertLayerPostDelegate");
	this.mapMethod("deleteLayer", null, "deleteLayerDelegate");
	this.mapMethod("moveLayer", "moveLayerDelegate");
	this.mapMethod("switchToLayer", "switchToLayerDelegate");
	this.mapMethod("setLayerVisibility", null, "setLayerVisibilityDelegate");
	this.mapMethod("setLayerName", "setLayerNameDelegate");
	this.mapMethod("setLayerColor", "setLayerColorDelegate");
	
	// Shape selection delegation
	this.mapMethod("setSelection", null, "shapeSelectionDelegate");
	this.mapMethod("xorSelection", null, "shapeSelectionDelegate");
}
Util.extend(LayerManagerDelegate, Delegate);

/* * * * * * * * * * * Layer-related delegate methods * * * * * * * * * * * */

LayerManagerDelegate.prototype.insertLayerPreDelegate = function(newLayer, refLayer, before) {
	refLayer = refLayer ? refLayer : this.currentLayer;
	
	if (before) {
		// Layer is being inserted before reference layer, so use reference layer as 'beforeRow' arg
		this.lpController.insertNewRow(newLayer, refLayer);
	} else {
		if (newLayer == this.getTopmostLayer()) {
			// Layer is being inserted above topmost layer, so 'beforeRow' arg is not needed
			this.lpController.insertNewRow(newLayer);
		} else {
			// Layer is being inserted above non-topmost layer, so use layer above reference layer as 'beforeLayer' arg
			this.lpController.insertNewRow(newLayer, this.layers[this.layers.indexOf(refLayer) + 1]);
		}
	}
};

LayerManagerDelegate.prototype.insertLayerPostDelegate = function(newLayer, refLayer, before) {
	this.lpController.updateButtons();
};

LayerManagerDelegate.prototype.deleteLayerDelegate = function(targetLayer, invertSwitch) {
	this.lpController.deleteRow(targetLayer);
	this.lpController.updateButtons();
};

LayerManagerDelegate.prototype.moveLayerDelegate = function(targetLayer, beforeLayer) {
	this.lpController.moveRow(targetLayer, beforeLayer);
};

LayerManagerDelegate.prototype.switchToLayerDelegate = function(targetLayer) {
	this.lpController.selectRow(targetLayer);
};

LayerManagerDelegate.prototype.setLayerVisibilityDelegate = function(targetLayer, makeVisible) {
	this.lpController.updateButtons();
};

LayerManagerDelegate.prototype.setLayerNameDelegate = function(targetLayer, newLayerName) {
	this.lpController.updateRowLayerName(targetLayer, newLayerName);
};

LayerManagerDelegate.prototype.setLayerColorDelegate = function(targetLayer, newColor) {
	this.lpController.updateRowColor(targetLayer, newColor);
};

/* * * * * * * * * * Shape-selection delegate methods * * * * * * * * * * * */

LayerManagerDelegate.prototype.shapeSelectionDelegate = function(shapes) {
	this.ui.updateClippingMenuItems(this.getSelectedShapes().length > 0);
};
