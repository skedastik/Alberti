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
	
	this.rowCounter = 0;                  // Used to generate row id's
	this.rows = [];                       // Array of row div references
	this.layerMap = {};                   // Maps row id's to Layer objects
	
	this.enableAnimation = false;         // Enable animated row insertions and deletions?
	
	// Register event listeners on the layer panel div
	this.mainDivNode.addEventListener("mousedown", this, false);
}
Util.extend(LayerPanel, EventHandler);

// Generates layer panel rows from existing layers in layer manager
LayerPanel.prototype.loadLayers = function() {
	// Clear existing layer panel rows
	this.dynamicDivNode.innerHTML = "";
	
	// Iterate through layers adding layer panel rows
	var layers = this.layerManager.layers;
	for (var i = 0, len = layers.length; i < len; i++) {
		this.insertNewRow(layers[i]);
	}
	
	this.selectCurrentLayer();
};

// Create a single div element for the given Alberti layer. You may optionally 
// specify a row number to insert before (i.e. directly below) that row 
// number, otherwise the row is placed above all other rows. Row 0 is the
// bottommost row.
LayerPanel.prototype.insertNewRow = function(layer, beforeRow) {
	var rowDiv = document.createElement("div");
	rowDiv.className = "layer_panel_row";
	rowDiv.id = "lrow"+this.rowCounter;                // assign unique id attribute.
	
	// Create button that toggles layer visibility
	var visibilityToggleDiv = document.createElement("div");
	visibilityToggleDiv.className = "visibility_toggle";
	
	// Create layer name text field/label
	var layerNameSpan = document.createElement("span");
	layerNameSpan.className = "layer_name";
	layerNameSpan.innerHTML = layer.name;
	
	// Create color well that allows user to change layer color
	var colorWellDiv = document.createElement("div");
	colorWellDiv.className = "color_well";
	
	rowDiv.appendChild(visibilityToggleDiv);
	rowDiv.appendChild(layerNameSpan);
	rowDiv.appendChild(colorWellDiv);
	
	if (arguments.length > 1) {
		if (beforeRow < 0 || beforeRow >= this.rows.length) {
			throw "Invalid 'beforeRow' argument passed to LayerPanel::createRowDiv";
		}
		
		// Insert new row directly below 'beforeRow'
		this.dynamicDivNode.insertBefore(rowDiv, beforeRow.nextSibling);
	} else {
		// Insert at the top of the panel by default (before all other rows)
		if (this.rows.length > 0) {
			this.dynamicDivNode.insertBefore(rowDiv, this.rows.peek());
		} else {
			this.dynamicDivNode.appendChild(rowDiv);
		}
	}
	
	// Add the new row and map its id to the layer passed in
	this.rows.push(rowDiv);
	this.layerMap[rowDiv.id] = layer;
	this.rowCounter++;
	
	// Register event listeners on the row div
	rowDiv.addEventListener("mousedown", this, false);
};

// Highlight the row div corresponding to the current layer
LayerPanel.prototype.selectCurrentLayer = function() {
	this.selectRow(this.layerManager.currentLayer);
};

// Highlight the specified row, signifying that it is selected
LayerPanel.prototype.selectRow = function(rowNumber) {
	var currentRowDiv = this.rows[this.layerManager.currentLayer];
	Util.removeHtmlClass(currentRowDiv, "selected_row");
	
	Util.addHtmlClass(this.rows[rowNumber], "selected_row");
};

LayerPanel.prototype.mousedown = function(evt) {
	// Prevent mousedown from propagating to Alberti workspace
	evt.stopPropagation();
};
