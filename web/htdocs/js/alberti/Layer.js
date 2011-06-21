/*
 * Layer.js
 * extends Group.js
 * 
 * The user uses layers to organize shapes.
 * 
 * TODO
 * 
 * - Different stroke-width per layer.
 * 
 * * */

Layer.counter = 0;                        // For generating unique layer names
Layer.defaultLayerColor = "#7788ff";

function Layer(svgNode) {
	Layer.baseConstructor.call(this, svgNode ? svgNode : Group.elementTag);
	this.shapes = [];
	
	Layer.counter++;
}
Util.extend(Layer, Group);

Layer.prototype.initialize = function() {
	Layer.superclass.initialize.call(this);
	this.name = "";
	this.hidden = false;
	this.color = Layer.defaultLayerColor;         // layer's line stroke color
};

// Inserts the given shape into the SVG tree
Layer.prototype.addShape = function(shape) {
	// The shape node may already exist
	if (shape.svgNode.parentNode == null) {
		this.attachChild(shape);
	}
	
	this.shapes.push(shape);
};

// Removes the given shape from the SVG tree and returns it
Layer.prototype.removeShape = function(shape) {
	var shapeIndex = this.shapes.indexOf(shape);
	
	Util.assert(shapeIndex >= 0, "Unrecognized shape passed to Layer::removeShape");
	
	shape.detach();
	this.shapes.splice(shapeIndex, 1);
};

Layer.prototype.hide = function() {
	if (!this.hidden) {
		this.hidden = true;
		this.set("display", "none");
	}
};

Layer.prototype.show = function() {
	if (this.hidden) {
		this.hidden = false;
		this.set("display", "");
	}
};

Layer.prototype.setName = function(name) {
	this.name = name;
	this.set("title", name);
};

Layer.prototype.setColor = function(color) {
	this.color = color;
	this.set("stroke", color);
};

Layer.prototype.isHidden = function() {
	return this.hidden;
};

Layer.prototype.push = function() {
	Layer.superclass.push.call(this);
	this.set("title", this.name);
	this.set("display", this.hidden ? "none" : "");
	this.set("stroke", this.color);
};

Layer.prototype.pull = function() {
	Layer.superclass.pull.call(this);
	this.hidden = (this.get("display") == "none") ?  true : false;
	this.name = this.get("title");
	this.color = this.get("stroke");
};

// Reset the layer counter global
Layer.resetCounter = function() {
	Layer.counter = 0;
}
