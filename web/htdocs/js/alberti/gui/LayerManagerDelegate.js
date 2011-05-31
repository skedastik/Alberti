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
	this.mapMethod("deleteCurrentLayer", "deleteCurrentLayerDelegate");
	this.mapMethod("switchToLayer", "switchToLayerDelegate");
	this.mapMethod("setLayerVisibility", "setLayerVisibilityDelegate");
}
Util.extend(LayerManagerDelegate, Delegate);

LayerManagerDelegate.prototype.insertLayerDelegate = function(layer, before) {
	var currentLayer = this.delegatedObject.currentLayer;
	
	if (before) {
		// Layer is being inserted before current layer, so use current layer as 'beforeRow' arg
		this.layerPanel.insertNewRow(layer.name, currentLayer);
	} else {
		if (currentLayer == this.delegatedObject.layers.length - 1) {
			// Layer is being inserted above topmost layer, so 'beforeRow' arg is not needed
			this.layerPanel.insertNewRow(layer.name);
		} else {
			// Layer is being inserted above non-topmost layer, so use row above current row as 'beforeRow' arg
			this.layerPanel.insertNewRow(layer.name, currentLayer + 1);
		}
	}
};

LayerManagerDelegate.prototype.deleteCurrentLayerDelegate = function() {
	this.layerPanel.deleteRow(this.delegatedObject.currentLayer);
};

LayerManagerDelegate.prototype.switchToLayerDelegate = function(layerNumber) {
	this.layerPanel.selectRow(layerNumber);
};

LayerManagerDelegate.prototype.setLayerVisibilityDelegate = function(layerNumber, makeVisible) {
	if (makeVisible) {
		// Layer is being shown, so enable selection of the layer row
		this.layerPanel.rows[layerNumber].rowButton.enable();
	} else {
		// Layer is being hidden, so disable selection of the layer row
		this.layerPanel.rows[layerNumber].rowButton.disable();
	}
};
