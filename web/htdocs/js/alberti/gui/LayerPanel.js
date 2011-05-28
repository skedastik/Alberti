/*
 * LayerPanel.js
 * 
 * GUI for manipulating layers.
 * 
 * * */
 
function LayerPanel(layerManager, mainDiv, dynamicDiv, cstripDiv) {
	LayerPanel.baseConstructor.call(this);
	this.layerManager = layerManager;
	this.mainDivNode = mainDiv;                    // The div containing the entire layer panel
	this.dynamicDivNode = dynamicDiv;              // The div containing layer "row" divs
	this.cstripDivNode = cstripDiv;                // The div containing the layer panel's control strip
	
	this.rows = [];                       // Array of layer row div elements
	this.animationEnabled = true;         // Enable animated row insertions and deletions?
	
	// Register event listeners on the layer panel div, if only to absorb
	// window-level mouse clicks that would normally draw in the workspace.
	this.mainDivNode.addEventListener("mousedown", this, false);
}
Util.extend(LayerPanel, EventHandler);

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
		this.insertNewRow(layers[i]);
	}
	
	// Highlight the currently selected layer
	this.selectCurrentLayer();
	
	// Re-enable layer insertion/deletion animations
	this.animationEnabled = true;
};

// Create a single div element for the given Alberti layer. You may optionally 
// specify a row number to insert before (i.e. directly below) that row 
// number, otherwise the row is placed above all other rows. Row 0 is the
// bottommost row.
LayerPanel.prototype.insertNewRow = function(layer, beforeRow) {
	// Generate div representing the layer row
	var rowDiv = this.generateRowDiv(layer);
	
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
		this.dynamicDivNode.insertBefore(rowDiv, this.rows[beforeRow].nextSibling);
		this.rows.splice(beforeRow, 0, rowDiv);
	} else {
		// Insert at the top of the panel by default (before all other rows in the DOM tree)
		if (this.rows.length > 0) {
			this.dynamicDivNode.insertBefore(rowDiv, this.rows.peek());
		} else {
			this.dynamicDivNode.appendChild(rowDiv);
		}
		
		this.rows.push(rowDiv);
	}
	
	// Register event listeners on the row div
	rowDiv.addEventListener("mousedown", this, false);
};

// Highlight the row div corresponding to the current layer
LayerPanel.prototype.selectCurrentLayer = function() {
	this.selectRow(this.layerManager.currentLayer);
};

// Highlight the specified row, signifying that it is selected
LayerPanel.prototype.selectRow = function(rowNumber) {
	// TODO: Incorporate this functionality into GuiButtonFamily.
	var currentRowDiv = this.rows[this.layerManager.currentLayer];
	Util.removeHtmlClass(currentRowDiv, "selected_row");
	
	Util.addHtmlClass(this.rows[rowNumber], "selected_row");
};

// Generate a row div for the given layer complete with controls and return it
LayerPanel.prototype.generateRowDiv = function(forLayer) {
	var rowIndex = this.rows.length;
	
	// Generate div representing the layer row
	var rowDiv = document.createElement("div");
	rowDiv.className = "layer_panel_row";
	var layerRow = new GuiButton("lr"+rowIndex, rowDiv, false, this, "handleButton").enable();
	
	// Create button that toggles layer visibility
	var visibilityToggleDiv = document.createElement("div");
	visibilityToggleDiv.className = "visibility_toggle";
	var visibilityToggleButton = new GuiButton("vt"+rowIndex, visibilityToggleDiv, true, this, "handleButton").enable();
	
	// Create layer name text field/label
	var layerNameSpan = document.createElement("span");
	layerNameSpan.className = "layer_name";
	layerNameSpan.innerHTML = forLayer.name;
	// TODO: Dynamic text field label class
	
	// Create color well that allows user to change layer color
	var colorWellDiv = document.createElement("div");
	colorWellDiv.className = "color_well";
	var colorWellButton = new GuiButton("cw"+rowIndex, colorWellDiv, false, this, "handleButton").enable();
	// TODO: Color picker functionality
	
	rowDiv.appendChild(layerNameSpan);
	rowDiv.appendChild(colorWellDiv);
	rowDiv.appendChild(visibilityToggleDiv);
	
	return rowDiv;
};

// GuiButton event handling is delegated to this method
LayerPanel.prototype.handleButton = function(button, evt) {
	Dbug.log("Click from button '"+button.getId()+"'");
};

LayerPanel.prototype.mousedown = function(evt) {
	// Prevent mousedown from propagating to Alberti workspace, or else 
	// drawing will happen when the user clicks in the layer panel.
	evt.stopPropagation();
};
