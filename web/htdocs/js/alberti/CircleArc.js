/*
 * CircleArc.js
 * extends Shape
 * 
 * Circular arc shape, defined by a center point, radius, start angle, and
 * delta angle. The delta form allows us to orient the zero angle as desired, 
 * thereby avoiding the sign inversion imposed by the default coordinate 
 * system (0 degrees pointing right).
 * 
 * * */

CircleArc.elementTag = "path";
CircleArc.shapeName = "carc";
 
function CircleArc(svgNode) {
	CircleArc.baseConstructor.call(this, svgNode ? svgNode : CircleArc.elementTag, CircleArc.shapeName);
}
Util.extend(CircleArc, Shape);

CircleArc.prototype.initialize = function() {
	this.center = new Coord2D(0, 0);
	this.radius = 0;
	this.startAngle = 0;
	this.deltaAngle = 0;
};

CircleArc.prototype.push = function() {
	// m and n are the "endpoints" of the arc, needed for SVG's arc path format
	var m = new Coord2D(this.center.x + this.radius * Math.sin(this.startAngle + Util.halfPi),
		this.center.y + this.radius * -Math.cos(this.startAngle + Util.halfPi));
	var n = new Coord2D(this.center.x + this.radius * Math.sin(this.startAngle + this.deltaAngle + Util.halfPi),
		this.center.y + this.radius * -Math.cos(this.startAngle + this.deltaAngle + Util.halfPi));
	
	// Invert SVG's large-arc and sweep flags if delta angle is less than zero
	var sweep = this.deltaAngle < 0 ? (this.deltaAngle >= -Math.PI ? "0,0" : "1,0") : (this.deltaAngle <= Math.PI ? "0,1" : "1,1");
	
	this.set("d", "M"+m.x+","+m.y+" A"+this.radius+","+this.radius+", "
		+Util.degToRad(this.startAngle)+","+sweep+", "+n.x+", "+n.y);
	
	this.set("berti:cx", this.center.x, Alberti.customns);
	this.set("berti:cy", this.center.y, Alberti.customns);
	this.set("berti:radius", this.radius, Alberti.customns);
	this.set("berti:start-angle", this.startAngle, Alberti.customns);
	this.set("berti:delta-angle", this.deltaAngle, Alberti.customns);
};

CircleArc.prototype.pull = function() {
	this.center = new Coord2D(this.get("cx", Alberti.customns), this.get("cy", Alberti.customns));
	this.radius = this.get("radius", Alberti.customns);
	this.startAngle = this.get("start-angle", Alberti.customns);
	this.deltaAngle = this.get("delta-angle", Alberti.customns);
};

CircleArc.prototype.clone = function() {
	var ca = new CircleArc();
	ca.center = this.center.clone();
	ca.radius = this.radius;
	ca.startAngle = this.startAngle;
	ca.deltaAngle = this.deltaAngle;
	
	return ca;
};
