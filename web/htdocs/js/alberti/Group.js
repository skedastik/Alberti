/*
 * Group.js
 * extends SvgContainer
 * 
 * SVG <g> node.
 * 
 * * */

Group.elementTag = "g";

function Group(svgNode) {
	Group.baseConstructor.call(this, svgNode ? svgNode : Group.elementTag);
}
Util.extend(Group, SvgContainer);

Group.prototype.initialize = function() {
	this.position = new Coord2D(0, 0);
	this.scale = 1.0;
};

// Translates group from current position
Group.prototype.translateRelative = function(dx, dy) {
	this.position.x += dx;
	this.position.y += dy;
};

// Positions group relative to parent coordinate system's origin
Group.prototype.positionAbsolute = function(x, y) {
	this.position.x = x;
	this.position.y = y;
};

// Sets scale relative to parent coordinate system's scale
Group.prototype.scaleAbsolute = function(scale) {
	this.scale = scale;
};

Group.prototype.push = function() {
	this.set("transform",
		(this.position.x != 0 || this.position.y != 0 ? "translate("+this.position.x+","+this.position.y+")" : "")
		+ (this.scale != 1.0 ? " scale("+this.scale+")" : ""));
};

Group.prototype.pull = function() {
	var transform = this.get("transform");
	var translate = transform.match(/translate\((.+),(.+)\)/);
	var scale = transform.match(/scale\((.+)\)/);
	
	this.position = translate ? new Coord2D(translate[1], translate[2]) : new Coord2D(0, 0);
	this.scale = scale ? scale[1] : 1.0;
};
