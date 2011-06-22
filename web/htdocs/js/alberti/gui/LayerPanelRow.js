/*
 * LayerPanelRow.js
 * 
 * A single layer panel row.
 * 
 * * */

// Class names for styling purposes
LayerPanelRow.styleGhost = "ghost";

// Layer row metrics
LayerPanelRow.rowHeight = 26;
LayerPanelRow.halfRowHeight = 13;
LayerPanelRow.rowInnerHeight = 17;

function LayerPanelRow(rowId, layerName, color, isHidden, controller, dropTargetFamily) {
	this.rowId = rowId;
	
	// Create GuiButton representing the layer row
	this.rowDiv = document.createElement("div");
	this.rowDiv.className = "layer_panel_row";
	this.rowButton = new GuiButton(rowId, this.rowDiv, controller, "handleRowButton", false, "", null, true);
	
	// Make the row draggable
	this.rowDragger = new GuiDraggable(
		this.rowButton, "handleBeginDragRow", "handleDragRow", "handleDropRow", 3, dropTargetFamily
	).enable();
	
	// Make the row a drop target for other layer rows
	this.rowDropTarget = new GuiDropTarget(
		this.rowButton, "handleRowEnterDropTarget", "handleRowExitDropTarget", "handleRowMoveWithinDropTarget"
	).enable();
	
	// Enable the row button after enabling the GuiDraggable and GuiDropTarget
	// so that they receive events before GuiButton.
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
	this.layerNameDiv.setAttribute("unselectable", "on");        // For Opera's sake
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

// Kill all event listeners associated with layer panel row
LayerPanelRow.prototype.cleanup = function() {
	this.rowButton.killAllListeners();
	this.rowDragger.killAllListeners();
	this.rowDropTarget.killAllListeners();
	this.visibilityToggleButton.killAllListeners();
	this.layerNameButton.killAllListeners();
	this.colorWellButton.killAllListeners();
	this.jscolorPicker.killAllListeners();
	this.layerNameGuiField.killAllListeners();
};
