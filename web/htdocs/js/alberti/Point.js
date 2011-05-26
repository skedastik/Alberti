/*
 * Point.js
 * extends Shape
 * 
 * Point shape.
 * 
 * NOTES
 * 
 * SVG has no mechanism for rendering individual points, so Point uses an SVG 
 * group element with a special id as a template. This <g> element is defined 
 * once inside a <defs> tag and referenced via <use> elements for each point. 
 * The scale of the point template must be adjusted dynamically as the user 
 * zooms in or out, otherwise points will visibly grow or shrink.
 * 
 * BUG WORKAROUNDS
 * 
 * Under WebKit's SVG implementation, instances of the Point template are not 
 * affected consistently by CSS styles--this is noticeable when rendering 
 * optimizations are enabled/disabled during panning/zooming. To work around 
 * this, the Point template has its shape-rendering attribute written directly 
 * in the base SVG file, thereby overriding any externally applied CSS. In
 * short, rendering of Points is never optimized.
 * 
 * * */
 
Point.elementTag = "use";
Point.shapeName = "point";

Point.templateId = "pointTemplate";

function Point(svgNode) {
	Point.baseConstructor.call(this, svgNode ? svgNode : Point.elementTag, Point.shapeName);
}
Util.extend(Point, Shape);

Point.prototype.initialize = function() {
	this.coord = new Coord2D(0, 0);
	this.innerColor = "black";
	this.outerColor = "";
};

// Override SvgObject::generate, as all Point objects' SVG nodes need to 
// reference the same Point template node.
Point.prototype.generate = function() {
	Point.superclass.generate.call(this);
	this.set("xlink:href", "#"+Point.templateId, Alberti.xlinkns);
	
	return this;
};

// Expects a Coord2D object. Returns a new Point without calling generate.
Point.fromCoord = function(coord) {
	var p = new Point();
	p.coord.x = coord.x;
	p.coord.y = coord.y;
	
	return p;
};

Point.prototype.push = function() {
	this.set("x", this.coord.x);
	this.set("y", this.coord.y);
	this.set("fill", this.innerColor);
	this.set("stroke", this.outerColor);
};
