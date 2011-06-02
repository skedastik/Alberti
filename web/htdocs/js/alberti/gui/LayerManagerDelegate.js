/*
 * LayerManagerDelegate.js
 * 
 * Propagates LayerManager mutations to LayerPanelController.
 * 
 * * */

function LayerManagerDelegate(layerManager, lpController) {
	LayerManagerDelegate.baseConstructor.call(this, layerManager);
	this.lpController = lpController;
	
	this.mapMethod("insertLayer", "insertLayerPreDelegate", "insertLayerPostDelegate");
	this.mapMethod("deleteLayer", null, "deleteLayerDelegate");
	this.mapMethod("switchToLayer", "switchToLayerDelegate");
	this.mapMethod("setLayerVisibility", null, "setLayerVisibilityDelegate");
	this.mapMethod("setLayerName", "setLayerNameDelegate");
}
Util.extend(LayerManagerDelegate, Delegate);

LayerManagerDelegate.prototype.insertLayerPreDelegate = function(newLayer, refLayer, before) {
	refLayer = refLayer ? refLayer : this.delegatedObject.currentLayer;
	
	if (before) {
		// Layer is being inserted before reference layer, so use reference layer as 'beforeRow' arg
		this.lpController.insertNewRow(newLayer, refLayer);
	} else {
		if (newLayer == this.delegatedObject.getTopmostLayer()) {
			// Layer is being inserted above topmost layer, so 'beforeRow' arg is not needed
			this.lpController.insertNewRow(newLayer);
		} else {
			// Layer is being inserted above non-topmost layer, so use layer above reference layer as 'beforeLayer' arg
			this.lpController.insertNewRow(newLayer, this.layers[this.layers.indexOf(refLayer) + 1]);
		}
	}
};

LayerManagerDelegate.prototype.insertLayerPostDelegate = function(newLayer, refLayer, before) {
	// TODO: Update visibility toggle after layer insertions
};

LayerManagerDelegate.prototype.deleteLayerDelegate = function(targetLayer, invertSwitch) {
	this.lpController.deleteRow(targetLayer);
	// TODO: Update visibility toggle after layer deletions
};

LayerManagerDelegate.prototype.switchToLayerDelegate = function(targetLayer) {
	this.lpController.selectRow(targetLayer);
};

LayerManagerDelegate.prototype.setLayerVisibilityDelegate = function(targetLayer, makeVisible) {
	this.lpController.updateVisibilityToggle(targetLayer, makeVisible);
};

LayerManagerDelegate.prototype.setLayerNameDelegate = function(targetLayer, newLayerName) {
	this.lpController.updateRowLayerName(targetLayer, newLayerName);
};
