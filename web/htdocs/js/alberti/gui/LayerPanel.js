/*
 * LayerPanel.js
 * 
 * GUI for manipulating layers. A LayerManager serves as the data source for 
 * the layer panel. Be sure to call setLayerManager before performing 
 * operations on the LayerPanel object.
 * 
 * * */

LayerPanel.collapseWidth            = "170px";     // How much is the layer panel collapsed?
LayerPanel.collapseTransitionLength = 0.25;        // Collapse animation length in seconds
 
function LayerPanel(mainDiv, dynamicDiv, cstripDiv) {
	LayerPanel.baseConstructor.call(this);
	this.mainDivNode = mainDiv;                    // The div containing the entire layer panel
	this.dynamicDivNode = dynamicDiv;              // The div containing layer "row" divs
	this.cstripDivNode = cstripDiv;                // The div containing the layer panel's control strip layer panel row
	
	this.layerManager = null;
	
	this.rows = [];                                // Array of LayerPanelRows
	this.rowBtnFamily = new GuiButtonFamily();     // Each row div is used for a GuiButton in this family
	
	// Add control strip buttons to control strip div's layer panel row
	this.cstrip = new LayerPanelControlStrip(Util.firstNonTextChild(this.cstripDivNode), this);
	
	this.isCollapsed = false;
	this.collapseAnimation = null;                 // Collapse Animation object
}
Util.extend(LayerPanel, EventHandler);

LayerPanel.prototype.setLayerManager = function(layerManager) {
	// A LayerManagerDelegate serves as the data source for the layer panel
	this.layerManager = layerManager;
};

// Generates layer panel rows from existing layers in layer manager
LayerPanel.prototype.loadLayers = function() {
	
	// Clear existing layer panel rows
	this.dynamicDivNode.innerHTML = "";
	this.rows = [];
	
	// Iterate through layers adding layer panel rows
	var layers = this.layerManager.layers;
	for (var i = 0, len = layers.length; i < len; i++) {
		this.insertNewRow(layers[i].name);
	}
	
	// Select the row corresponding to the current layer
	this.selectRow(this.layerManager.currentLayer);
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
		Util.assert(
			beforeRow >= 0 && beforeRow < this.rows.length,
			"Invalid 'beforeRow' argument passed to LayerPanel::createRowDiv"
		);
		
		// Insert new row directly below 'beforeRow'.
		this.dynamicDivNode.insertBefore(row.rowDiv, this.rows[beforeRow].rowDiv.nextSibling);
		this.rows.splice(beforeRow, 0, row);
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
	Util.assert(
		rowNumber >= 0 && rowNumber < this.rows.length,
		"Invalid 'rowNumber' argument passed to LayerPanel::deleteRow"
	);
	
	var row = this.rows[rowNumber];
	
	this.dynamicDivNode.removeChild(row.rowDiv);
	this.rowBtnFamily.removeButton(row.rowButton);
	this.rows.splice(rowNumber, 1);
};

// Highlight the specified row, signifying that it is selected
LayerPanel.prototype.selectRow = function(rowNumber) {
	this.rowBtnFamily.toggleButton(this.rows[rowNumber].rowButton);
};

// Collapse the layer panel if 'collapseFlag' is true, reveal it otherwise
LayerPanel.prototype.toggleCollapse = function() {
	this.isCollapsed = !this.isCollapsed;
	
	if (this.collapseAnimation) {
		this.collapseAnimation.stop();
	}
	
	this.collapseAnimation = new Animation(LayerPanel.collapseTransitionLength,
		function() {
			this.collapseAnimation = null;
		}.bindTo(this)
	);
	
	this.collapseAnimation.add(
		this.mainDivNode.style,
		"left",
		this.mainDivNode.style.left ? this.mainDivNode.style.left : "0px",
		this.isCollapsed ? "-"+LayerPanel.collapseWidth : "0px",
		-1.0
	);
	
	this.collapseAnimation.begin();
};

LayerPanel.prototype.handleRowButton = function(button, evt) {
	// Only changes rows if the row itself was clicked, not one of the row's controls
	if (evt.target === button.htmlNode) {
		// Only select row if it isn't already selected
		if (!button.isToggled()) {
			this.layerManager.switchToLayer(LayerPanel.getLayerForControl(button));
		}
	}
};

LayerPanel.prototype.handleVisibilityToggle = function(button, evt) {
	this.layerManager.setLayerVisibility(LayerPanel.getLayerForControl(button), button.isToggled());
};

LayerPanel.prototype.handleColorWell = function(button, evt) {
	
};

LayerPanel.prototype.handleNewLayerButton = function(button, evt) {
	this.layerManager.newLayer();
};

LayerPanel.prototype.handleDeleteLayerButton = function(button, evt) {
	this.layerManager.deleteCurrentLayer();
};

LayerPanel.prototype.handleCollapseButton = function(button, evt) {
	this.toggleCollapse();
	button.toggle();
};

LayerPanel.prototype.handleLayerNameButton = function(button, evt) {
	var row = this.rows[button.getId()];
	row.layerNameGuiField.activate(row.layerNameDiv.innerHTML);
};

LayerPanel.prototype.handleLayerNameField = function(field, newLayerName) {
	this.layerManager.setLayerName(LayerPanel.getLayerForControl(field), newLayerName);
};

// Helper function: get layer number from given control's ID
LayerPanel.getLayerForControl = function(control) {
	return parseInt(control.getId());
}

/*
 * LayerPanelControlStrip
 * 
 * Helper class for LayerPanel. Generates layer panel control strip controls.
 * 
 * * */

function LayerPanelControlStrip(cstripDiv, controlDelegate) {
	this.newLayerDiv = document.createElement("div");
	this.newLayerDiv.className = "new_layer_button";
	this.newLayerButton = new GuiButton("new_layer", this.newLayerDiv, controlDelegate, "handleNewLayerButton", false, "New Layer").enable();
	
	this.deleteLayerDiv = document.createElement("div");
	this.deleteLayerDiv.className = "delete_layer_button";
	this.deleteLayerButton = new GuiButton("delete_layer", this.deleteLayerDiv, controlDelegate, "handleDeleteLayerButton", false, "Delete Selected Layer").enable();
	
	this.lpCollapseDiv = document.createElement("div");
	this.lpCollapseDiv.className = "lp_collapse_button";
	this.lpCollapseButton = new GuiButton("lp_collapse", this.lpCollapseDiv, controlDelegate, "handleCollapseButton", false, "Hide Layer Panel, Show Layer Panel").enable().toggle(true);
	
	cstripDiv.appendChild(this.newLayerDiv);
	cstripDiv.appendChild(this.deleteLayerDiv);
	cstripDiv.appendChild(this.lpCollapseDiv);
};

/*
 * LayerPanelRow
 * 
 * Helper class for LayerPanel. Generates a row complete with controls.
 * 
 * * */

function LayerPanelRow(rowBtnFamily, rowNumber, layerName, controlDelegate) {
	// Generate div representing the layer row
	this.rowDiv = document.createElement("div");
	this.rowDiv.className = "layer_panel_row";
	this.rowButton = new GuiButton(rowNumber, this.rowDiv, controlDelegate, "handleRowButton", false, "", true).enable();
	rowBtnFamily.addButton(this.rowButton);
	
	// Create button that toggles layer visibility
	this.visibilityToggleDiv = document.createElement("div");
	this.visibilityToggleDiv.className = "visibility_toggle";
	this.visibilityToggleButton = new GuiButton(
		rowNumber, this.visibilityToggleDiv, controlDelegate, "handleVisibilityToggle", true, "Hide Layer, Show Layer"
	).enable().toggle(true);
	
	// Create layer name text field/label
	this.layerNameDiv = document.createElement("div");
	this.layerNameDiv.className = "layer_name";
	this.layerNameDiv.innerHTML = layerName;
	this.layerNameButton = new GuiButton(rowNumber, this.layerNameDiv, controlDelegate, "handleLayerNameButton", false).enable();
	
	// Create color well that allows user to change layer color
	this.colorWellDiv = document.createElement("div");
	this.colorWellDiv.className = "color_well";
	this.colorWellButton = new GuiButton(rowNumber, this.colorWellDiv, controlDelegate, "handleColorWell", false, "Pick Color").enable();
	// TODO: Color picker functionality
	
	// Create the layer name text field
	this.layerNameInput = document.createElement("input");
	this.layerNameInput.className = "layer_name_input";
	this.layerNameGuiField = new GuiTextField(rowNumber, this.layerNameInput, controlDelegate, "handleLayerNameField", true);
	
	this.rowDiv.appendChild(this.layerNameInput);
	this.rowDiv.appendChild(this.layerNameDiv);
	this.rowDiv.appendChild(this.colorWellDiv);
	this.rowDiv.appendChild(this.visibilityToggleDiv);
}
