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
