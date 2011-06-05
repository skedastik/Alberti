/*
 * LayerPanel.js
 * 
 * GUI for manipulating layers. Be sure to call setController before 
 * performing operations on the LayerPanel object.
 * 
 * REQUIRES
 * 
 * LayerPanelRow.js
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

// Create and insert single layer panel row with the given layer name. You may 
// optionally specify a row index to insert before (i.e. directly below) that 
// row, otherwise the row is placed above all other rows.
LayerPanel.prototype.newRow = function(layerName, color, isHidden, beforeRowIndex) {
	var newRow = new LayerPanelRow("row"+this.rowIdCounter++, this.rowBtnFamily, layerName, color, isHidden, this);
	this.insertRow(newRow)
	
	return newRow.rowId;
};

// Insert given LayerPanelRow, optionally before the given row index.
LayerPanel.prototype.insertRow = function(newRow, beforeRowIndex) {
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
		
		this.dynamicDivNode.insertBefore(newRow.rowDiv, this.rows[beforeRowIndex].rowDiv.nextSibling);
		this.rows.splice(beforeRowIndex, 0, newRow);
	} else {
		// Insert at the top of the panel by default (before all other rows in the DOM tree)
		if (this.rows.length > 0) {
			this.dynamicDivNode.insertBefore(newRow.rowDiv, this.rows.peek().rowDiv);
		} else {
			this.dynamicDivNode.appendChild(newRow.rowDiv);
		}
		
		this.rows.push(newRow);
	}
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
	for (var i = this.rows.length - 1; i >= 0; i--) {
		this.deleteRow(i);
	}
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

LayerPanel.prototype.handleRowButton = function(button, evt) {
	// Only change rows if the row itself, or the row's layer name was clicked
	if (evt.target == button.htmlNode || evt.target == this.getRowWithId(button.getId()).layerNameDiv) {
		// Only select row if it isn't already selected
		if (!button.isToggled()) {
			this.controller.switchToLayer(button.getId());
		}
	}
};

/* * * * * * * * * * * Control handler methods below * * * * * * * * * * * */

LayerPanel.prototype.handleVisibilityToggle = function(button, evt) {
	this.controller.setLayerVisibility(button.getId(), button.isToggled());
};

LayerPanel.prototype.handleColorWell = function(button, evt) {
	var row = this.getRowWithId(button.getId());
	row.jscolorPicker.setColor(row.getColor());
	row.jscolorPicker.activate();
};

LayerPanel.prototype.handleJsColorPicker = function(jscolorPicker, color, rewindUndos) {
	this.controller.setLayerColor(jscolorPicker.getId(), color);
};

LayerPanel.prototype.handleNewLayerButton = function(button, evt) {
	this.controller.newLayer(button.getId());
};

LayerPanel.prototype.handleDeleteLayerButton = function(button, evt) {
	this.controller.deleteCurrentLayer(button.getId());
};

LayerPanel.prototype.handleCollapseButton = function(button, evt) {
	this.toggleCollapse();
	button.toggle();
};

LayerPanel.prototype.handleLayerNameButton = function(button, evt) {
	var row = this.getRowWithId(button.getId());
	row.layerNameGuiField.activate(row.getName());
};

LayerPanel.prototype.handleLayerNameField = function(field, newLayerName, evt) {
	// TODO: Do not allow empty layer name.
	this.controller.setLayerName(field.getId(), newLayerName);
};

LayerPanel.prototype.handleBeginDragRow = function(dragger, evt) {
	
};

LayerPanel.prototype.handleDragRow = function(dragger, dx, dy, evt) {
	
};

LayerPanel.prototype.handleDropRow = function(dragger, evt) {
	
};

LayerPanel.prototype.handleRowEnterDropTarget = function(dragger, evt) {
	
};

LayerPanel.prototype.handleRowExitDropTarget = function(dragger, evt) {
	
};

LayerPanel.prototype.handleRowMoveWithinDropTarget = function(dragger, dx, dy, evt) {
	
};

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
	
	cstripDiv.appendChild(this.deleteLayerDiv);
	cstripDiv.appendChild(this.newLayerDiv);
	cstripDiv.appendChild(this.lpCollapseDiv);
};
