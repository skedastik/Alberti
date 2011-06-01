/*
 * LayerManagerDelegate.js
 * 
 * Delegation between LayerManager and LayerPanel.
 * 
 * * */

function LayerManagerDelegate(layerManager, layerPanel) {
	LayerManagerDelegate.baseConstructor.call(this, layerManager);
	this.layerPanel = layerPanel;
	
	this.mapMethod("insertLayer", "insertLayerDelegate");
	this.mapMethod("deleteLayer", "deleteLayerDelegate");
	this.mapMethod("switchToLayer", "switchToLayerDelegate");
	this.mapMethod("setLayerVisibility", "setLayerVisibilityDelegate");
	this.mapMethod("setLayerName", "setLayerNameDelegate");
}
Util.extend(LayerManagerDelegate, Delegate);

LayerManagerDelegate.prototype.insertLayerDelegate = function(newLayer, layerNumber, before) {
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

LayerManagerDelegate.prototype.deleteLayerDelegate = function(layerNumber) {
	this.layerPanel.deleteRow(layerNumber);
	this.delegatedObject.clearSelections();      // Clear shape selections whenever a layer is deleted
};

LayerManagerDelegate.prototype.switchToLayerDelegate = function(layerNumber) {
	this.layerPanel.selectRow(layerNumber);
};

LayerManagerDelegate.prototype.setLayerVisibilityDelegate = function(layerNumber, makeVisible) {
	if (makeVisible) {
		// Layer is being shown, so enable selection of the layer row
		this.layerPanel.rows[layerNumber].rowButton.enable();
	} else {
		// Layer is being hidden, so disable selection of the layer row, and clear shape selections
		this.layerPanel.rows[layerNumber].rowButton.disable();
		this.delegatedObject.clearSelections();
	}
};

LayerManagerDelegate.prototype.setLayerNameDelegate = function(layerNumber, newName) {
	this.layerPanel.rows[layerNumber].layerNameSpan.innerHTML = newName;
};
