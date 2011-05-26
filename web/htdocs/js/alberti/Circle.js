/*
 * Circle.js
 * extends Shape
 * 
 * Circle shape, defined by a center point and radius.
 * 
 * * */

Circle.elementTag = "circle";
Circle.shapeName = "circle";

function Circle(svgNode) {
	Circle.baseConstructor.call(this, svgNode ? svgNode : Circle.elementTag, Circle.shapeName);
}
Util.extend(Circle, Shape);

Circle.prototype.initialize = function() {
	this.center = new Coord2D(0, 0);
	this.radius = 0;
};

Circle.prototype.push = function() {
	this.set("cx", this.center.x);
	this.set("cy", this.center.y);
	this.set("r", this.radius);
};

// Clone the circle object, without calling SvgObject::generate
Circle.prototype.clone = function() {
	var c = new Circle();
	c.center = this.center.clone();
	c.radius = this.radius;
	
	return c;
};
