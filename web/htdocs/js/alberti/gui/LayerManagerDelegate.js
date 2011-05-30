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
};

LayerManagerDelegate.prototype.deleteCurrentLayerDelegate = function() {
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
