/*
 * LayerPanel.js
 * 
 * GUI for manipulating layers. Be sure to call setController before 
 * performing operations on the LayerPanel object.
 * 
 * * */

LayerPanel.defaultPosition          = "-10px";     // Layer panel's default position
LayerPanel.collapsePosition         = "-180px";     // Layer panel's collapsed position
LayerPanel.collapseTransitionLength = 0.25;        // Collapse animation length in seconds
 
function LayerPanel(mainDiv, dynamicDiv, cstripDiv) {
	LayerPanel.baseConstructor.call(this);
	this.mainDivNode = mainDiv;                    // The div containing the entire layer panel
	this.dynamicDivNode = dynamicDiv;              // The div containing layer "row" divs
	this.cstripDivNode = cstripDiv;                // The div containing the layer panel's control strip layer panel row
	
	this.rows = [];                                // Array of LayerPanelRows
	this.rowBtnFamily = new GuiButtonFamily();     // Each row div is used for a GuiButton in this family
	this.rowIdCounter = 1;                         // Used to generate unique row ID strings
	
	// Add control strip buttons to control strip div
	this.cstrip = new LayerPanelControlStrip(Util.firstNonTextChild(this.cstripDivNode), this);
	
	this.isCollapsed = false;
	this.collapseAnimation = null;
}
Util.extend(LayerPanel, EventHandler);

// Object 'controller' will handle layer row controls
LayerPanel.prototype.setController = function(controller) {
	this.controller = controller;
};

// Create a single layer row with the given layer name. You may optionally 
// specify a row index to insert before (i.e. directly below) that row, 
// otherwise the row is placed above all other rows. The controller object 
// must handle the following methods:
//
//    switchToLayer(rowId)
//    setLayerVisibility(rowId, makeVisible)
//    newLayer()
//    deleteCurrentLayer()
//    setLayerName(rowId, newLayerName)
//    
// Returns the new row's ID string.
LayerPanel.prototype.insertNewRow = function(layerName, color, isHidden, beforeRowIndex) {
	var row = new LayerPanelRow("row"+this.rowIdCounter++, this.rowBtnFamily, layerName, color, isHidden, this);
	
	// Be careful of the order in which rows are inserted into the document--
	// newer rows should float up, when the default is for appended elements 
	// to float down. In other words, new row divs should be inserted into the
	// DOM document in reverse order, as we want new rows to visually stack on
	// top of older rows.
	
	if (beforeRowIndex !== undefined) {
		Util.assert(
			beforeRowIndex >= 0 && beforeRowIndex < this.rows.length,
			"Invalid 'beforeRow' argument passed to LayerPanel::createRowDiv"
		);
		
		this.dynamicDivNode.insertBefore(row.rowDiv, this.rows[beforeRowIndex].rowDiv.nextSibling);
		this.rows.splice(beforeRowIndex, 0, row);
	} else {
		// Insert at the top of the panel by default (before all other rows in the DOM tree)
		if (this.rows.length > 0) {
			this.dynamicDivNode.insertBefore(row.rowDiv, this.rows.peek().rowDiv);
		} else {
			this.dynamicDivNode.appendChild(row.rowDiv);
		}
		
		this.rows.push(row);
	}
	
	return row.rowId;
};

// Delete the row with given row index
LayerPanel.prototype.deleteRow = function(rowIndex) {
	Util.assert(
		rowIndex >= 0 && rowIndex < this.rows.length,
		"Invalid 'rowIndex' argument passed to LayerPanel::deleteRow"
	);
	
	var row = this.rows[rowIndex];
	
	this.dynamicDivNode.removeChild(row.rowDiv);
	this.rowBtnFamily.removeButton(row.rowButton);
	this.rows.splice(rowIndex, 1);
};

// Clear existing layer panel rows
LayerPanel.prototype.clearAllRows = function() {
	this.dynamicDivNode.innerHTML = "";
	this.rows = [];
};

// Highlight the specified row, signifying that it is selected
LayerPanel.prototype.selectRow = function(rowIndex) {
	this.rowBtnFamily.toggleButton(this.rows[rowIndex].rowButton);
};

// Collapse and reveal the layer panel
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
		"right",
		this.mainDivNode.style.right ? this.mainDivNode.style.right : LayerPanel.defaultPosition,
		this.isCollapsed ? LayerPanel.collapsePosition : LayerPanel.defaultPosition,
		-1.0
	);
	
	this.collapseAnimation.begin();
};

LayerPanel.prototype.handleRowButton = function(button, evt) {
	// Only change rows if the row itself was clicked, not one of the row's controls
	if (evt.target === button.htmlNode) {
		// Only select row if it isn't already selected
		if (!button.isToggled()) {
			this.controller.switchToLayer(button.id);
		}
	}
};

LayerPanel.prototype.handleVisibilityToggle = function(button, evt) {
	this.controller.setLayerVisibility(button.id, button.isToggled());
};

LayerPanel.prototype.handleColorWell = function(button, evt) {
	var row = this.getRowWithId(button.id);
	row.jscolorPicker.setColor(row.getColor());
	row.jscolorPicker.activate();
};

LayerPanel.prototype.handleJsColorPicker = function(jscolorPicker, color, rewindUndos) {
	this.controller.setLayerColor(jscolorPicker.id, color);
};

LayerPanel.prototype.handleNewLayerButton = function(button, evt) {
	this.controller.newLayer(button.id);
};

LayerPanel.prototype.handleDeleteLayerButton = function(button, evt) {
	this.controller.deleteCurrentLayer(button.id);
};

LayerPanel.prototype.handleCollapseButton = function(button, evt) {
	this.toggleCollapse();
	button.toggle();
};

LayerPanel.prototype.handleLayerNameButton = function(button, evt) {
	var row = this.getRowWithId(button.id);
	row.layerNameGuiField.activate(row.getName());
};

LayerPanel.prototype.handleLayerNameField = function(field, newLayerName) {
	// TODO: Do not allow empty layer name.
	this.controller.setLayerName(field.id, newLayerName);
};

LayerPanel.prototype.getRowWithId = function(rowId) {
	return this.rows[this.getRowIndexForId(rowId)];
};

// Get row index corresponding to row with the given ID string. Returns -1 if 
// no such ID string found.
LayerPanel.prototype.getRowIndexForId = function(rowId) {
	for (var i = 0, rLen = this.rows.length; i < rLen; i++) {
		if (this.rows[i].rowId == rowId) {
			return i;
		}
	}
	
	return -1;
}

/*
 * LayerPanelControlStrip
 * 
 * Helper class for LayerPanel. Generates layer panel control strip controls.
 * 
 * * */

function LayerPanelControlStrip(cstripDiv, controller) {
	this.newLayerDiv = document.createElement("div");
	this.newLayerDiv.className = "new_layer_button";
	this.newLayerButton = new GuiButton("new_layer", this.newLayerDiv, controller, "handleNewLayerButton", false, "New Layer").enable();
	
	this.deleteLayerDiv = document.createElement("div");
	this.deleteLayerDiv.className = "delete_layer_button";
	this.deleteLayerButton = new GuiButton("delete_layer", this.deleteLayerDiv, controller, "handleDeleteLayerButton", false, "Delete Selected Layer").enable();
	
	this.lpCollapseDiv = document.createElement("div");
	this.lpCollapseDiv.className = "lp_collapse_button";
	this.lpCollapseButton = new GuiButton("lp_collapse", this.lpCollapseDiv, controller, "handleCollapseButton", false, "Hide Layer Panel, Show Layer Panel").enable().toggle(true);
	
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

function LayerPanelRow(rowId, rowBtnFamily, layerName, color, isHidden, controller) {
	this.rowId = rowId;
	
	// Generate div representing the layer row
	this.rowDiv = document.createElement("div");
	this.rowDiv.className = "layer_panel_row";
	this.rowButton = new GuiButton(rowId, this.rowDiv, controller, "handleRowButton", false, "", true);
	rowBtnFamily.addButton(this.rowButton);
	
	if (!isHidden) {
		this.rowButton.enable();
	}
	
	// Create button that toggles layer visibility
	this.visibilityToggleDiv = document.createElement("div");
	this.visibilityToggleDiv.className = "visibility_toggle";
	this.visibilityToggleButton = new GuiButton(
		rowId, this.visibilityToggleDiv, controller, "handleVisibilityToggle", true, "Hide Layer, Show Layer"
	).enable().toggle(!isHidden);
	
	// Create layer name text field/label
	this.layerNameDiv = document.createElement("div");
	this.layerNameDiv.className = "layer_name";
	this.layerNameDiv.innerHTML = layerName;
	this.layerNameButton = new GuiButton(rowId, this.layerNameDiv, controller, "handleLayerNameButton", false).enable();
	
	// Create color well that allows user to change layer color
	this.colorWellDiv = document.createElement("div");
	this.colorWellDiv.className = "color_well";
	this.colorWellDiv.style.backgroundColor = color;
	this.colorWellButton = new GuiButton(rowId, this.colorWellDiv, controller, "handleColorWell", false, "Pick Color").enable();
	
	// Create hidden JSColor color input and JsColorPicker
	this.jscolorInput = document.createElement("input");
	this.jscolorInput.className = "color";
	this.jscolorPicker = new JsColorPicker(rowId, this.colorWellDiv, controller, "handleJsColorPicker", this.jscolorInput);
	
	// Create the layer name text field
	this.layerNameInput = document.createElement("input");
	this.layerNameInput.className = "layer_name_input";
	this.layerNameGuiField = new GuiTextField(rowId, this.layerNameInput, controller, "handleLayerNameField", true);
	
	this.rowDiv.appendChild(this.layerNameInput);
	this.rowDiv.appendChild(this.jscolorInput);
	this.rowDiv.appendChild(this.colorWellDiv);
	this.rowDiv.appendChild(this.visibilityToggleDiv);
	this.rowDiv.appendChild(this.layerNameDiv);
}

LayerPanelRow.prototype.getName = function() {
	return this.layerNameDiv.innerHTML;
};

LayerPanelRow.prototype.setName = function(name) {
	this.layerNameDiv.innerHTML = name;
};

LayerPanelRow.prototype.getColor = function() {
	return Util.rgbToHex(this.colorWellDiv.style.backgroundColor);
};

LayerPanelRow.prototype.setColor = function(color) {
	this.colorWellDiv.style.backgroundColor = color;
	this.jscolorPicker.setColor(color);
};
