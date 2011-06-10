/*
 * Shape.js
 * extends SvgObject
 * 
 * Abstract shape class.
 * 
 * * */
 
function Shape(svgTagOrNode, shapeName) {
	Shape.baseConstructor.call(this, svgTagOrNode);
	this.shapeName = shapeName;
}
Util.extend(Shape, SvgObject);

// Returns a Rect2D bounding the shape. May need to override for some shapes,
// as some SVG implementations do not return correct results for all shapes.
Shape.prototype.getBoundingBox = function() {
	var svgRect = this.svgNode.getBBox();
	
	return new Rect2D(
		Util.roundToDecimal(svgRect.x, Alberti.decimalPrecision),
		Util.roundToDecimal(svgRect.y, Alberti.decimalPrecision),
		Util.roundToDecimal(svgRect.x + svgRect.width, Alberti.decimalPrecision),
		Util.roundToDecimal(svgRect.y + svgRect.height, Alberti.decimalPrecision));
};

// Display the shape as selected
Shape.prototype.displaySelected = function() {
	this.set("class", "selected");
};

// Display the shape as deselected
Shape.prototype.displayDeselected = function() {
	this.set("class", "");
};

// Overridden method should return new Shape w/ same properties w/o calling generate
Shape.prototype.clone = function(arguments) {
	throw "Un-overriden 'clone' method invoked on Shape "+this.shapeName;
};
