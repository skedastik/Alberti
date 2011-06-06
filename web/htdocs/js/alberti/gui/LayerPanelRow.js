/*
 * LayerPanelRow.js
 * 
 * A single layer panel row.
 * 
 * * */

// Class names for styling purposes
LayerPanelRow.styleFloating = "floating"
LayerPanelRow.styleDropTargetBelow = "drop_target_below";
LayerPanelRow.styleDropTargetAbove = "drop_target_above";

function LayerPanelRow(rowId, layerName, color, isHidden, controller) {
	this.rowId = rowId;
	
	// Used for drag and drop
	this.floating = false;
	this.floatPosition = new Coord2D(0, 0);
	
	// Create GuiButton representing the layer row
	this.rowDiv = document.createElement("div");
	this.rowDiv.className = "layer_panel_row";
	this.rowButton = new GuiButton(rowId, this.rowDiv, controller, "handleRowButton", false, "", null, true);
	
	if (!isHidden) {
		this.rowButton.enable();
	}
	
	// Make the row draggable
	this.rowDragger = new GuiDraggable(
		this.rowButton, "handleBeginDragRow", "handleDragRow", "handleDropRow", 3, "layer_row"
	).enable();
	
	// Make the row a drop target for other layer rows
	this.rowDropTarget = new GuiDropTarget(
		this.rowButton, "handleRowEnterDropTarget", "handleRowExitDropTarget", "handleRowMoveWithinDropTarget", "layer_row"
	).enable();
	
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
	this.layerNameButton = new GuiButton(
		rowId, this.layerNameDiv, controller, "handleLayerNameButton", false, "", "dblclick"
	).enable();
	
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
};

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

// Detach the layer panel row from its current parent and append it to the
// document body as an absolutely-positioned element at (x,y).
LayerPanelRow.prototype.float = function(x, y) {
	if (!this.floating) {
		this.floating = true;
		this.setFloatPosition(x, y);
		
		this.rowDiv.style.position = "absolute";
		Util.addHtmlClass(this.rowDiv, LayerPanelRow.styleFloating);
		
		if (this.rowDiv.parentNode) {
			this.rowDiv.parentNode.removeChild(this.rowDiv);
		}
		
		document.body.appendChild(this.rowDiv);
	}
};

// Translate layer row. Has no effect if row is not floating.
LayerPanelRow.prototype.translateFloatPosition = function(dx, dy) {
	this.setFloatPosition(this.floatPosition.x + dx, this.floatPosition.y + dy);
};

// Set layer row position. Has no effect if row is not floating.
LayerPanelRow.prototype.setFloatPosition = function(x, y) {
	if (this.floating) {
		this.floatPosition.x = x;
		this.floatPosition.y = y;
		this.rowDiv.style.left = x+"px";
		this.rowDiv.style.top = y+"px";
	}
};
