/*
 * Layer.js
 * 
 * A layer object, similar to what you might find in a Photoshop document.
 * 
 * TODO
 * 
 * - Different stroke color per layer.
 * - Different stroke-width per layer.
 * 
 * * */

function Layer(parentGroup, name) {
	this.shapes = [];
	
	if (arguments.length > 1) {
		this.svgGroup = new Group().generate();
		parentGroup.attachChild(this.svgGroup);
		
		this.setName(arguments.length > 1 ? name : "New Layer");
		this.hidden = false;
	}
}

// Create and return a layer from the given Group object.
Layer.fromGroup = function(group) {
	var l = new Layer();
	
	l.svgGroup = group;
	l.name = group.get("title");
	
	var visibility = group.get("visibility");
	l.hidden = (visibility == "hidden") ? true : false;
	
	return l;
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

Layer.prototype.hideLayer = function() {
	if (!this.hidden) {
		this.hidden = true;
		this.svgGroup.set("display", "none");
	}
};

Layer.prototype.showLayer = function() {
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
