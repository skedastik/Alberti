/*
 * LayerManagerDelegate.js
 * 
 * Delegates LayerManager to LayerPanel.
 * 
 * * */

function LayerManagerDelegate(layerManager, layerPanel) {
	LayerManagerDelegate.baseConstructor.call(this, layerManager);
	this.layerPanel = layerPanel;
	this.mapMethod("insertLayer", "insertLayerDelegate");
	this.mapMethod("deleteCurrentLayer", "deleteCurrentLayerDelegate");
}
Util.extend(LayerManagerDelegate, Delegate);

LayerManagerDelegate.prototype.insertLayerDelegate = function(layer, before) {
	Dbug.log("LayerManagerDelegate::insertLayerDelegate");
};

LayerManagerDelegate.prototype.deleteCurrentLayerDelegate = function() {
	Dbug.log("LayerManagerDelegate::deleteCurrentLayerDelegate");
};
