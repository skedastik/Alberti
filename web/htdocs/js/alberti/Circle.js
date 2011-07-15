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

Circle.prototype.pull = function() {
	this.center = new Coord2D(this.get("cx"), this.get("cy"));
	this.radius = this.get("r");
};

// Clone the circle object, without calling SvgObject::generate
Circle.prototype.clone = function() {
	var c = new Circle();
	c.center = this.center.clone();
	c.radius = this.radius;
	
	return c;
};
