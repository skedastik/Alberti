/*
 * LayerManagerDelegate.js
 * 
 * Delegation between LayerManager and LayerPanel.
 * 
 * * */

function LayerManagerDelegate(layerManager, layerPanel) {
	LayerManagerDelegate.baseConstructor.call(this, layerManager);
	this.layerPanel = layerPanel;
	
	this.lastVisibleRow = -1;        // For storing the last exclusively visible row
	
	this.mapMethod("insertLayer", "insertLayerPreDelegate", "insertLayerPostDelegate");
	this.mapMethod("deleteLayer", "deleteLayerPreDelegate", "deleteLayerPostDelegate");
	this.mapMethod("switchToLayer", "switchToLayerDelegate");
	this.mapMethod("setLayerVisibility", null, "setLayerVisibilityDelegate");
	this.mapMethod("setLayerName", "setLayerNameDelegate");
}
Util.extend(LayerManagerDelegate, Delegate);

LayerManagerDelegate.prototype.insertLayerPreDelegate = function(newLayer, layerNumber, before) {
	if (layerNumber === undefined) {
		layerNumber = this.delegatedObject.currentLayer;
	}
	
	if (before) {
		// Layer is being inserted before target layer, so use target layer as 'beforeRow' arg
		this.layerPanel.insertNewRow(newLayer.name, layerNumber);
	} else {
		if (layerNumber == this.delegatedObject.layers.length - 1) {
			// Layer is being inserted above topmost layer, so 'beforeRow' arg is not needed
			this.layerPanel.insertNewRow(newLayer.name);
		} else {
			// Layer is being inserted above non-topmost layer, so use row above target row as 'beforeRow' arg
			this.layerPanel.insertNewRow(newLayer.name, layerNumber + 1);
		}
	}
};

LayerManagerDelegate.prototype.insertLayerPostDelegate = function(newLayer, layerNumber, before) {
	// TODO: Update visibility toggle after layer insertions
};

LayerManagerDelegate.prototype.deleteLayerPreDelegate = function(layerNumber) {
	this.layerPanel.deleteRow(layerNumber);
};

LayerManagerDelegate.prototype.deleteLayerPostDelegate = function(layerNumber) {
	// TODO: Update visibility toggle after layer deletions
};

LayerManagerDelegate.prototype.switchToLayerDelegate = function(layerNumber) {
	this.layerPanel.selectRow(layerNumber);
};

LayerManagerDelegate.prototype.setLayerVisibilityDelegate = function(layerNumber, makeVisible) {
	var row = this.layerPanel.rows[layerNumber];
	
	if (makeVisible) {
		row.rowButton.enable();
		row.visibilityToggleButton.toggle(true);
		
		// Enable the layer visibility toggle if more than one layer becomes visible again
		if (this.delegatedObject.getNumberOfVisibleLayers() == 2) {
			this.layerPanel.rows[this.delegatedObject.currentLayer].visibilityToggleButton.enable();
		}
	} else {
		// Disable the layer visibility toggle if only one visible layer remains
		if (this.delegatedObject.getNumberOfVisibleLayers() == 1) {
			this.layerPanel.rows[this.delegatedObject.currentLayer].visibilityToggleButton.disable();
		}
		
		row.rowButton.disable();
		row.visibilityToggleButton.toggle(false);
	}
};

LayerManagerDelegate.prototype.setLayerNameDelegate = function(layerNumber, newName) {
	this.layerPanel.rows[layerNumber].layerNameDiv.innerHTML = newName;
};
