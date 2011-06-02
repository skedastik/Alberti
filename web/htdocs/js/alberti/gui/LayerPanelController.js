/*
 * LayerPanelController.js
 * 
 * Controller object for the LayerPanel class. Serves as the interchange
 * between the layer panel and the layer manager delegate. Call 
 * setLayerManagerDelegate before operating the controller.
 * 
 * * */
 
function LayerPanelController(layerPanel) {
	this.layerPanel = layerPanel;
	this.rowLayerMap = {};            // maps layer panel row ID strings to Layer objects
}

LayerPanelController.prototype.setLayerManagerDelegate = function(lmDelegate) {
	this.lmDelegate = lmDelegate;
};

// Returns a layer panel row index corresponding to the given Layer. Throws an
// exception if none found.
LayerPanelController.prototype.getRowForLayer = function(layer) {
	for (var rowId in this.rowLayerMap) {
		if (this.rowLayerMap[rowId] == layer) {
			return this.layerPanel.getRowWithId(rowId);
		}
	}
	
	throw "Unrecognized layer passed to LayerPanelController::getRowForLayer";
};

// Generate layer panel rows from existing layers in layer manager
LayerPanelController.prototype.populateLayerPanel = function() {
	this.layerPanel.clearAllRows();
	
	// Iterate through layers adding layer panel rows
	var layers = this.lmDelegate.layers;
	for (var i = 0, len = layers.length; i < len; i++) {
		this.insertNewRow(layers[i]);
	}
	
	// Select the row corresponding to the current layer
	this.layerPanel.selectRow(this.getRowForLayer(this.lmDelegate.currentLayer));
};

/* * * * * * * * * * Layer manager-related methods below * * * * * * * * * */

LayerPanelController.prototype.switchToLayer = function(rowId) {
	this.lmDelegate.switchToLayer(this.rowLayerMap[rowId]);
};

LayerPanelController.prototype.setLayerVisibility = function(rowId, makeVisible) {
	this.lmDelegate.setLayerVisibility(this.rowLayerMap[rowId], makeVisible);
};

LayerPanelController.prototype.newLayer = function() {
	this.lmDelegate.newLayer();
};

LayerPanelController.prototype.deleteCurrentLayer = function() {
	this.lmDelegate.deleteCurrentLayer();
};

LayerPanelController.prototype.setLayerName = function(rowId, newLayerName) {
	this.lmDelegate.setLayerName(this.rowLayerMap[rowId], newLayerName);
};

/* * * * * * * * * * Layer panel-related methods below * * * * * * * * * * */

LayerPanelController.prototype.insertNewRow = function(newLayer, beforeLayer) {
	this.rowLayerMap[
		this.layerPanel.insertNewRow(newLayer.name, beforeLayer ? this.getRowForLayer(beforeLayer) : undefined)
	] = newLayer;
};

LayerPanelController.prototype.deleteRow = function(targetLayer) {
	var targetRow = this.layerPanel.rows[this.getRowForLayer(targetLayer)];
	
	this.layerPanel.deleteRow(this.getRowForLayer(targetLayer));
	delete this.rowLayerMap[targetRow.rowId];
};

LayerPanelController.prototype.selectRow = function(targetLayer) {
	this.layerPanel.selectRow(this.getRowForLayer(targetLayer));
};

LayerPanelController.prototype.updateVisibilityToggle = function(targetLayer, makeVisible) {
	var targetRow = this.layerPanel.rows[this.getRowForLayer(targetLayer)];
	var currentRow = this.layerPanel.rows[this.getRowForLayer(this.lmDelegate.currentLayer)];
	
	if (makeVisible) {
		targetRow.rowButton.enable();
		targetRow.visibilityToggleButton.toggle(true);
		
		// Enable the layer visibility toggle if more than one layer becomes visible again
		if (this.lmDelegate.getNumberOfVisibleLayers() == 2) {
			currentRow.visibilityToggleButton.enable();
		}
	} else {
		targetRow.rowButton.disable();
		targetRow.visibilityToggleButton.toggle(false);
		
		// Disable the layer visibility toggle if only one visible layer remains
		if (this.lmDelegate.getNumberOfVisibleLayers() == 1) {
			currentRow.visibilityToggleButton.disable();
		}
	}
};

LayerPanelController.prototype.updateRowLayerName = function(targetLayer, newLayerName) {
	this.layerPanel.rows[this.getRowForLayer(targetLayer)].layerNameDiv.innerHTML = newLayerName;
};
