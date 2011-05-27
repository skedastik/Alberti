/*
 * LayerPanel.js
 * 
 * GUI for manipulating layers.
 * 
 * * */
 
function LayerPanel(layerManager, mainDiv, dynamicDiv, cstripDiv) {
	this.layerManager = layerManager;
	this.mainDivNode = mainDiv;
	this.dynamicDivNode = dynamicDiv;
	this.cstripDivNode = cstripDiv;
	
	this.rows = [];
}

// Generates layer panel rows from existing layers in layer manager
LayerPanel.prototype.loadLayers = function() {
	// Clear existing layer panel rows
	this.dynamicDivNode.innerHTML = "";
	
	// Iterate through layers adding layer panel rows
	var layers = this.layerManager.layers;
	for (var i = 0, len = layers.length; i < len; i++) {
		this.generateRowDiv(layers[i]);
	}
	
	this.selectCurrentLayer();
};

LayerPanel.prototype.generateRowDiv = function(layer) {
	var rowDiv = document.createElement("div");
	rowDiv.className = "layer_panel_row";
	
	this.rows.push(rowDiv);
	
	var visibilityToggleDiv = document.createElement("div");
	visibilityToggleDiv.className = "visibility_toggle";
	
	var layerNameSpan = document.createElement("span");
	layerNameSpan.className = "layer_name";
	layerNameSpan.innerHTML = layer.name;
	
	var colorWellDiv = document.createElement("div");
	colorWellDiv.className = "color_well";
	
	rowDiv.appendChild(visibilityToggleDiv);
	rowDiv.appendChild(layerNameSpan);
	rowDiv.appendChild(colorWellDiv);
	this.dynamicDivNode.appendChild(rowDiv);
};

LayerPanel.prototype.selectCurrentLayer = function() {
	this.selectRow(this.layerManager.currentLayer);
};

LayerPanel.prototype.selectRow = function(rowNumber) {
	var currentRowDiv = this.rows[this.layerManager.currentLayer];
	Util.removeHtmlClass(currentRowDiv, "selected_row");
	
	Util.addHtmlClass(this.rows[rowNumber], "selected_row");
};

LayerPanel.prototype.getRowDiv = function(rowNumber) {
	return this.rows[rowNumber];
};
