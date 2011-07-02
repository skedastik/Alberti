/*
 * Shape.js
 * extends SvgObject
 * 
 * Abstract shape class. Each shape has a unique 'sid' identifier string.
 * 
 * * */

Shape.sidCounter = 1;                       // Used to generate unique Shape sid's
 
function Shape(svgTagOrNode, shapeName) {
	Shape.baseConstructor.call(this, svgTagOrNode);
	this.shapeName = shapeName;
	this.sid = "s"+(Shape.sidCounter++);              // Assign a unique sid to the shape
}
Util.extend(Shape, SvgObject);

// Returns a Rect2D bounding the shape. May need to override for some shapes,
// as some SVG implementations do not return correct results for all shapes.
Shape.prototype.getBoundingBox = function() {
	var svgRect = this.svgNode.getBBox();
	
	return new Rect2D(
		Util.roundToDecimal(svgRect.x, Alberti.tolerance),
		Util.roundToDecimal(svgRect.y, Alberti.tolerance),
		Util.roundToDecimal(svgRect.x + svgRect.width, Alberti.tolerance),
		Util.roundToDecimal(svgRect.y + svgRect.height, Alberti.tolerance));
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
