/*
 * Layer.js
 * 
 * A layer contains Shapes.
 * 
 * TODO
 * 
 * - Different stroke color per layer.
 * - Different stroke-width per layer.
 * 
 * * */

function Layer(svgGroup) {
	this.svgGroup = svgGroup;
	this.name = null;
	this.shapes = [];
	this.hidden = false;
}

// Inserts the given shape into the SVG tree
Layer.prototype.addShape = function(shape) {
	this.svgGroup.attachChild(shape);
	this.shapes.push(shape);
};

// Removes the given shape from the SVG tree and returns it
Layer.prototype.removeShape = function(shape) {
	shape.detach();
	this.shapes.splice(this.shapes.indexOf(shape), 1);
};

Layer.prototype.hide = function() {
	if (!this.hidden) {
		this.hidden = true;
		this.svgGroup.set("display", "none");
	}
};

Layer.prototype.show = function() {
	if (this.hidden) {
		this.hidden = false;
		this.svgGroup.set("display", "");
	}
};

Layer.prototype.setName = function(name) {
	this.name = name;
	this.svgGroup.set("title", name);
};

Layer.prototype.isHidden = function() {
	return this.hidden;
};
