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
	
	this.mapMethod("insertLayer", "insertLayerPreDelegate", "insertLayerPostDelegate");
	this.mapMethod("deleteLayer", null, "deleteLayerDelegate");
	this.mapMethod("moveLayer", "moveLayerDelegate");
	this.mapMethod("switchToLayer", "switchToLayerDelegate");
	this.mapMethod("setLayerVisibility", null, "setLayerVisibilityDelegate");
	this.mapMethod("setLayerName", "setLayerNameDelegate");
	this.mapMethod("setLayerColor", "setLayerColorDelegate");
	this.mapMethod("setSelection", null, "shapeSelectionDelegate");
	this.mapMethod("xorSelection", null, "shapeSelectionDelegate");
	this.mapMethod("addMarker", null, "addMarkerDelegate");
	this.mapMethod("removeMarker", null, "removeMarkerDelegate");
}
Util.extend(LayerManagerDelegate, Delegate);

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

LayerManagerDelegate.prototype.shapeSelectionDelegate = function(shapes) {
	this.ui.updateClippingMenuItems(this.getSelectedShapes().length > 0);
};

LayerManagerDelegate.prototype.addMarkerDelegate = function(marker) {
	this.ui.updateNavBar();
};

LayerManagerDelegate.prototype.removeMarkerDelegate = function(marker) {
	this.ui.updateNavBar();
};
