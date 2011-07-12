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
 * LayerPanelController.js
 * 
 * Controller object for the LayerPanel class. Serves as the interchange
 * between the layer panel and the layer manager delegate. Call 
 * setLayerManagerDelegate before operating the controller.
 * 
 * * */
 
function LayerPanelController(layerPanel) {
	this.layerPanel = layerPanel;
	this.rowLayerMap = {};            // Maps layer panel row ID strings to Layer objects
	this.lmDelegate = null;
}

LayerPanelController.prototype.setLayerManagerDelegate = function(lmDelegate) {
	this.lmDelegate = lmDelegate;
};

// Returns a LayerPanelRow corresponding to the given Layer.
LayerPanelController.prototype.getRowForLayer = function(layer) {
	return this.layerPanel.rows[this.getRowIndexForLayer(layer)];
};

// Returns a layer panel row index corresponding to the given Layer. Throws an
// exception if none found.
LayerPanelController.prototype.getRowIndexForLayer = function(layer) {
	for (var rowId in this.rowLayerMap) {
		if (this.rowLayerMap[rowId] == layer) {
			return this.layerPanel.getRowIndexForId(rowId);
		}
	}
	
	throw "Unrecognized layer passed to LayerPanelController::getRowIndexForLayer";
};

// Generate layer panel rows from existing layers in layer manager
LayerPanelController.prototype.populateLayerPanel = function() {
	this.layerPanel.clearAllRows();
	
	// Iterate through layers adding layer panel rows
	var layers = this.lmDelegate.layers;
	for (var i = 1, len = layers.length; i < len; i++) {
		this.insertNewRow(layers[i]);
	}
	
	// Select the row corresponding to the current layer
	this.layerPanel.selectRow(this.getRowIndexForLayer(this.lmDelegate.currentLayer));
	
	// Update layer panel button states
	this.updateButtons();
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

LayerPanelController.prototype.moveLayer = function(targetRowId, beforeRowId) {
	this.lmDelegate.moveLayer(this.rowLayerMap[targetRowId], beforeRowId ? this.rowLayerMap[beforeRowId] : undefined);
};

LayerPanelController.prototype.setLayerName = function(rowId, newLayerName) {
	this.lmDelegate.setLayerName(this.rowLayerMap[rowId], newLayerName);
};

LayerPanelController.prototype.setLayerColor = function(rowId, newColor) {
	this.lmDelegate.setLayerColor(this.rowLayerMap[rowId], newColor);
};

/* * * * * * * * * * Layer panel-related methods below * * * * * * * * * * */

LayerPanelController.prototype.insertNewRow = function(newLayer, beforeLayer) {
	var rowId = this.layerPanel.newRow(
		newLayer.name,
		newLayer.color,
		newLayer.isHidden(),
		beforeLayer ? this.getRowIndexForLayer(beforeLayer) : undefined
	);
	
	this.rowLayerMap[rowId] = newLayer;
};

LayerPanelController.prototype.deleteRow = function(targetLayer) {
	var targetRow = this.getRowForLayer(targetLayer);
	
	this.layerPanel.removeRow(this.getRowIndexForLayer(targetLayer));
	delete this.rowLayerMap[targetRow.rowId];
};

LayerPanelController.prototype.moveRow = function(targetLayer, beforeLayer) {
	this.layerPanel.moveRow(
		this.getRowIndexForLayer(targetLayer), beforeLayer ? this.getRowIndexForLayer(beforeLayer) : undefined
	);
};

LayerPanelController.prototype.selectRow = function(targetLayer) {
	this.layerPanel.selectRow(this.getRowIndexForLayer(targetLayer));
};

// Update layer panel button states to match layers
LayerPanelController.prototype.updateButtons = function() {
	var numLayersVisible = this.lmDelegate.getNumberOfVisibleLayers();
	var enableOther = numLayersVisible > 1 ? "enable" : "disable";
	
	// Disable/enable each row button if corresponding layer is hidden/shown
	for (var i = 1, len = this.lmDelegate.layers.length; i < len; i++) {
		var layer = this.lmDelegate.layers[i];
		var row = this.getRowForLayer(layer);
		var enableRow = layer.isHidden() ? "disable" : "enable";
		
		row.rowButton[enableRow]();
		row.visibilityToggleButton.toggle(!layer.isHidden());
		
		if (!layer.isHidden()) {
			row.visibilityToggleButton[enableOther]();
		}
	}
	
	this.layerPanel.cstrip.deleteLayerButton[enableOther]();
};

LayerPanelController.prototype.updateRowLayerName = function(targetLayer, newLayerName) {
	this.getRowForLayer(targetLayer).setName(newLayerName);
};

LayerPanelController.prototype.updateRowColor = function(targetLayer, newColor) {
	this.getRowForLayer(targetLayer).setColor(newColor);
};
