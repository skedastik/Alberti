/*
 * Layer.js
 * extends Group.js
 * 
 * The user uses layers to organize shapes.
 * 
 * TODO
 * 
 * - Different stroke color per layer.
 * - Different stroke-width per layer.
 * 
 * * */

function Layer(svgNode) {
	Layer.baseConstructor.call(this, svgNode ? svgNode : Group.elementTag);
	this.shapes = [];
}
Util.extend(Layer, Group);

Layer.prototype.initialize = function() {
	this.name = "";
	this.hidden = false;
};

// Inserts the given shape into the SVG tree
Layer.prototype.addShape = function(shape) {
	this.attachChild(shape);
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

Layer.prototype.isHidden = function() {
	return this.hidden;
};

Layer.prototype.push = function() {
	Layer.superclass.push.call(this);
	this.set("title", name);
	this.set("display", this.hidden ? "none" : "");
};

Layer.prototype.pull = function() {
	Layer.superclass.pull.call(this);
	this.hidden = (this.get("display") == "none") ?  true : false;
	this.name = this.get("title");
};
