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

LayerPanel.defaultPosition          = "0px";        // Layer panel's default position
LayerPanel.collapsePosition         = "-160px";     // Layer panel's collapsed (hidden) position
LayerPanel.collapseTransitionLength = 0.25;         // Collapse animation length in seconds
LayerPanel.rowInsertAnimationLength = 0.1;          // Length of row insertion/removal for drag/drop purposes
LayerPanel.rowSnapAnimationLength   = 0.125;        // Length of ghost row "bungee" animation for drag/drop purposes
 
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
	
	this.isCollapsed = false;                      // Layer panel can be collapsed (i.e. hidden) by user
	this.collapseAnimation = null;
	
	// Parameters for layer row drag/drop
	this.ghostRow = null;                         // A fixed-position row div that follows the mouse during drag
	this.ghostOriginalPosition = null;            // Position of ghost row at creation
	this.ghostPosition = new Coord2D(0, 0);       // Current position of ghost row
	this.dropTargetIndex = -1;                    // Index of dragged row's current drop target (another layer row)
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
	return this.insertRow(
		new LayerPanelRow("row"+this.rowIdCounter++, layerName, color, isHidden, this),
		beforeRowIndex
	).rowId;
};

// Insert given LayerPanelRow, optionally before the given row index (defaults
// to inserting above topmost row). Returns same row.
LayerPanel.prototype.insertRow = function(newRow, beforeRowIndex) {
	// Be careful of the order in which rows are inserted into the document--
	// newer rows should float up, when the default is for appended elements 
	// to float down. In other words, new row divs should be inserted into the
	// DOM document in reverse order, as we want new rows to visually stack on
	// top of older rows.
	
	if (beforeRowIndex !== undefined) {
		Util.assert(beforeRowIndex >= 0 && beforeRowIndex < this.rows.length,
			"Invalid 'beforeRowIndex' argument passed to LayerPanel::insertRow"
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
	
	// Add new row to layer panel's row button family
	this.rowBtnFamily.addButton(newRow.rowButton);
	
	return newRow;
};

// Remove the row with given row index from the layer panel. Returns removed row.
LayerPanel.prototype.removeRow = function(rowIndex) {
	Util.assert(rowIndex >= 0 && rowIndex < this.rows.length,
		"Invalid 'rowIndex' argument passed to LayerPanel::removeRow"
	);
	
	var row = this.rows[rowIndex];
	
	this.dynamicDivNode.removeChild(row.rowDiv);
	this.rowBtnFamily.removeButton(row.rowButton);
	this.rows.splice(rowIndex, 1);
	
	return row;
};


// Move row with index 'rowIndex' before index 'beforeRowIndex'. If second arg
// is not specified, or it is higher than the highest index, moves row to 
// topmost position.
LayerPanel.prototype.moveRow = function(rowIndex, beforeRowIndex) {
	var targetRow = this.rows[rowIndex];
	var beforeRow = beforeRowIndex !== undefined ? this.rows[beforeRowIndex] : null;
	
	this.dynamicDivNode.removeChild(targetRow.rowDiv);
	this.rows.splice(rowIndex, 1);
	
	if (beforeRow) {
		this.dynamicDivNode.insertBefore(targetRow.rowDiv, beforeRow.rowDiv.nextSibling);
		this.rows.splice(beforeRowIndex, 0, targetRow);
	} else {
		this.dynamicDivNode.insertBefore(targetRow.rowDiv, this.rows.peek().rowDiv);
		this.rows.push(targetRow);
	}
};

// Clear existing layer panel rows
LayerPanel.prototype.clearAllRows = function() {
	for (var i = this.rows.length - 1; i >= 0; i--) {
		this.removeRow(i);
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

// Create a ghost row on-demand for drag/drop purposes. Its contents will
// be copied from the given row.
LayerPanel.prototype.createGhostRow = function(row) {
	if (!this.ghostRow) {
		var rowButton = row.rowButton;
		var rowPos = rowButton.getClientPosition();
	
		this.ghostOriginalPosition = rowPos.clone();
		this.ghostRow = row.rowDiv.cloneNode(true);
	
		// Make the ghost row transparent to mouse events
		this.ghostRow.style.pointerEvents = "none";
		
		Util.addHtmlClass(this.ghostRow, LayerPanelRow.styleGhost);
		this.ghostRow.style.position = "fixed";
		this.setGhostRowPosition(rowPos.x, rowPos.y);
	
		document.body.appendChild(this.ghostRow);
	}
};

LayerPanel.prototype.deleteGhostRow = function() {
	if (this.ghostRow) {
		this.ghostRow.parentNode.removeChild(this.ghostRow);
		this.ghostRow = null;
	}
};

// Set the ghost row position
LayerPanel.prototype.setGhostRowPosition = function(x, y) {
	if (this.ghostRow) {
		this.ghostPosition.x = x;
		this.ghostPosition.y = y;
		this.ghostRow.style.left = x+"px";
		this.ghostRow.style.top = y+"px";
	}
};

LayerPanel.prototype.translateGhostRow = function(dx, dy) {
	this.setGhostRowPosition(this.ghostPosition.x + dx, this.ghostPosition.y + dy);
};

/* * * * * * * * * * * Control handler methods below * * * * * * * * * * * */

LayerPanel.prototype.handleRowButton = function(button, evt) {
	// Only change rows if the row itself, or the row's layer name was clicked
	if (evt.target == button.htmlNode || evt.target == this.getRowWithId(button.getId()).layerNameDiv) {
		// Only select row if it isn't already selected
		if (!button.isToggled()) {
			this.controller.switchToLayer(button.getId());
		}
	}
};

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
	if (newLayerName != "" && !newLayerName.match(/^\s+$/)) {
		this.controller.setLayerName(field.getId(), newLayerName);
	}
};

LayerPanel.prototype.handleBeginDragRow = function(control, evt) {
	// Now that dragging has begun, create a ghost row and reset drop target index
	this.createGhostRow(this.getRowWithId(control.getId()));
	this.dropTargetIndex = -1;
};

LayerPanel.prototype.handleDragRow = function(control, dx, dy, evt) {
	// Update ghost row position to mouse position
	this.translateGhostRow(dx, dy);
};

LayerPanel.prototype.handleDropRow = function(control, dropTargetControl, evt) {
	var draggedRowIndex = this.getRowIndexForId(control.getId());
	
	var updateRows = function() {
		this.deleteGhostRow();
		
		if (
			this.dropTargetIndex >= 0 
			&& draggedRowIndex != this.dropTargetIndex 
			&& this.dropTargetIndex != draggedRowIndex + 1
		) {
			this.controller.moveLayer(control.getId(),
				this.dropTargetIndex >= this.rows.length ? undefined : this.rows[this.dropTargetIndex].rowId
			);
		}
	}.bindTo(this);
	
	if (this.dropTargetIndex == -1) {
		// User dropped row outside of a valid drop target, so perform bungee animation on ghost row
		var animation = new Animation(LayerPanel.rowSnapAnimationLength, updateRows);
		animation.add(this.ghostRow.style, "left", this.ghostPosition.x+"px", this.ghostOriginalPosition.x+"px", -1.0);
		animation.add(this.ghostRow.style, "top", this.ghostPosition.y+"px", this.ghostOriginalPosition.y+"px", -1.0);
		animation.begin();
	} else {
		updateRows();
	}
};

LayerPanel.prototype.handleRowEnterDropTarget = function(control, evt) {
	// Nothing to be done
};

LayerPanel.prototype.handleRowExitDropTarget = function(control, evt) {
	this.dropTargetIndex = -1;
};

LayerPanel.prototype.handleRowMoveWithinDropTarget = function(control, dx, dy, evt) {
	// If mouse is hovering within the top half of drop target row, dragged 
	// row will be inserted above drop target row, below otherwise.
	var dropBelow = dy > LayerPanelRow.halfRowHeight;
	this.dropTargetIndex = dropBelow ? this.getRowIndexForId(control.getId()) : this.getRowIndexForId(control.getId()) + 1;
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
