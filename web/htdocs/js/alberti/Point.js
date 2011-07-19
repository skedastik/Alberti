/*  
 *  Copyright (C) 2011, Alaric Holloway <alaric.holloway@gmail.com>
 *  
 *  This file is part of Alberti.
 *
 *  Alberti is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  Alberti is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with Alberti.  If not, see <http://www.gnu.org/licenses/>.
 *  
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
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

Point.templateId = "point_template";
Point.selectedTemplateId = "point_template_sel";

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

Point.prototype.pull = function() {
	this.coord = new Coord2D(this.get("x"), this.get("y"));
	this.innerColor = this.get("fill");
	this.outerColor = this.get("stroke");
};

Point.prototype.clone = function() {
	var p = new Point();
	p.coord = this.coord.clone();
	p.innerColor = this.innerColor;
	p.outerColor = this.outerColor;
	
	return p;
};

Point.prototype.displaySelected = function() {
	this.set("xlink:href", "#"+Point.selectedTemplateId, Alberti.xlinkns);
};

Point.prototype.displayDeselected = function() {
	this.set("xlink:href", "#"+Point.templateId, Alberti.xlinkns);
};

// Returns a tiny Rect2D enclosing the point
Shape.prototype.getBoundingBox = function() {
	return new Rect2D(this.coord.x - 0.1, this.coord.y - 0.1, this.coord.x + 0.1, this.coord.y + 0.1);
};
