/*
 * LayerPanel.js
 * 
 * GUI for manipulating layers. A LayerManagerDelegate serves as the data 
 * source for the layer panel. Be sure to call setLayerManager before
 * performing operations on the LayerPanel object.
 * 
 * TODO
 * 
 * - Animated row insertions/deletions.
 * 
 * - This class does too much. Should be split into a generic GuiSelectList 
 * class, and a LayerPanel-specific subclass. The control strip should 
 * probably be moved to a separate class as well.
 * 
 * * */
 
function LayerPanel(mainDiv, dynamicDiv, cstripDiv) {
	LayerPanel.baseConstructor.call(this);
	
	this.mainDivNode = mainDiv;                    // The div containing the entire layer panel
	this.dynamicDivNode = dynamicDiv;              // The div containing layer "row" divs
	this.cstripDivNode = cstripDiv;                // The div containing the layer panel's control strip
	
	this.rows = [];                                // Array of LayerPanelRows
	this.rowBtnFamily = new GuiButtonFamily();     // Each row div is used for a GuiButton in this family
	
	this.animationEnabled = true;                  // Enable animated row insertions and deletions?
	
	// Register event listeners on the layer panel div, if only to absorb
	// window-level mouse clicks that would normally draw in the workspace.
	this.mainDivNode.addEventListener("mousedown", this, false);
}
Util.extend(LayerPanel, EventHandler);

LayerPanel.prototype.setLayerManager = function(layerManager) {
	// A LayerManagerDelegate serves as the data source for the layer panel
	this.layerManager = layerManager;
};

// Generates layer panel rows from existing layers in layer manager
LayerPanel.prototype.loadLayers = function() {
	// Do not animate row insertions/deletions when loading layers
	this.animationEnabled = false;
	
	// Clear existing layer panel rows
	this.dynamicDivNode.innerHTML = "";
	this.rows = [];
	
	// Iterate through layers adding layer panel rows
	var layers = this.layerManager.layers;
	for (var i = 0, len = layers.length; i < len; i++) {
		this.insertNewRow(layers[i].name);
	}
	
	// Highlight the currently selected layer
	this.selectCurrentLayer();
	
	// Re-enable layer insertion/deletion animations
	this.animationEnabled = true;
};

// Create a single row div element w/ the given Alberti layer name. You may 
// optionally specify a row number to insert before (i.e. directly below) that 
// row number, otherwise the row is placed above all other rows. Row 0 is the
// bottommost row.
LayerPanel.prototype.insertNewRow = function(layerName, beforeRow) {
	// Generate div representing the layer row
	var row = new LayerPanelRow(this.rowBtnFamily, this.rows.length, layerName, this);
	
	// Be careful of the order in which rows are inserted into the document--
	// newer rows should float up, when the default is for appended elements 
	// to float down. In other words, new row divs should be inserted into the
	// DOM document in reverse order, as we want new rows to visually stack on
	// top of older rows.
	
	if (beforeRow !== undefined) {
		if (beforeRow < 0 || beforeRow >= this.rows.length) {
			throw "Invalid 'beforeRow' argument passed to LayerPanel::createRowDiv";
		}
		
		// Insert new row directly below 'beforeRow'.
		this.dynamicDivNode.insertBefore(row.rowDiv, this.rows[beforeRow].rowDiv.nextSibling);
		this.rows.splice(beforeRow, 0, rowDiv);
	} else {
		// Insert at the top of the panel by default (before all other rows in the DOM tree)
		if (this.rows.length > 0) {
			this.dynamicDivNode.insertBefore(row.rowDiv, this.rows.peek().rowDiv);
		} else {
			this.dynamicDivNode.appendChild(row.rowDiv);
		}
		
		this.rows.push(row);
	}
};

// Delete the specified row
LayerPanel.prototype.deleteRow = function(rowNumber) {
	if (rowNumber < 0 || rowNumber >= this.rows.length) {
		throw "Invalid 'rowNumber' argument passed to LayerPanel::deleteRow";
	}
	
	this.dynamicDivNode.removeChild(this.rows[rowNumber]);
	this.rowBtnFamily.removeButton(th)
	this.rows.splice(rowNumber, 1);
	
	// The selected layer may have been deleted, so update selection
	this.selectCurrentLayer();
}

// Highlight the row div corresponding to the current layer
LayerPanel.prototype.selectCurrentLayer = function() {
	this.selectRow(this.layerManager.currentLayer);
};

// Highlight the specified row, signifying that it is selected
LayerPanel.prototype.selectRow = function(rowNumber) {
	this.rowBtnFamily.toggleButton(this.rows[rowNumber].rowButton);
};

// GuiButton event handling is delegated to this method
LayerPanel.prototype.handleButton = function(button, evt) {
	var tokens = button.id.match(/([^0-9]+)([0-9]+)/);
	var type = tokens[1];
	var rowNum = parseInt(tokens[2]);
	
	switch (type) {
		case "lr":                                         // Handle layer row clicks
			this.rowBtnFamily.toggleButton(button);
			break;
	}
};

LayerPanel.prototype.mousedown = function(evt) {
	// Prevent mousedown events originating in the layer panel from 
	// propagating to the Alberti workspace, or else drawing will happen when  
	// the user clicks in the layer panel.
	evt.stopPropagation();
};

/*
 * LayerPanelRow
 * 
 * Helper class for LayerPanel. Generates a row complete with controls.
 * 
 * * */

function LayerPanelRow(rowBtnFamily, rowNumber, layerName, buttonDelegate) {
	// Generate div representing the layer row
	this.rowDiv = document.createElement("div");
	this.rowDiv.className = "layer_panel_row";
	this.rowButton = new GuiButton("lr"+rowNumber, this.rowDiv, false, buttonDelegate, "handleButton").enable();
	rowBtnFamily.addButton(this.rowButton);
	
	// Create button that toggles layer visibility
	this.visibilityToggleDiv = document.createElement("div");
	this.visibilityToggleDiv.className = "visibility_toggle";
	this.visibilityToggleButton = new GuiButton("vt"+rowNumber, this.visibilityToggleDiv, true, buttonDelegate, "handleButton").enable();
	
	// Create layer name text field/label
	this.layerNameSpan = document.createElement("span");
	this.layerNameSpan.className = "layer_name";
	this.layerNameSpan.innerHTML = layerName;
	// TODO: Dynamic text field label class
	
	// Create color well that allows user to change layer color
	this.colorWellDiv = document.createElement("div");
	this.colorWellDiv.className = "color_well";
	this.colorWellButton = new GuiButton("cw"+rowNumber, this.colorWellDiv, false, buttonDelegate, "handleButton").enable();
	// TODO: Color picker functionality
	
	this.rowDiv.appendChild(this.layerNameSpan);
	this.rowDiv.appendChild(this.colorWellDiv);
	this.rowDiv.appendChild(this.visibilityToggleDiv);
}
