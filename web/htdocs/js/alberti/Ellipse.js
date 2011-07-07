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
 * Ellipse.js
 * 
 * Ellipse shape, defined by a center point, x-radius, y-radius and
 * x-axis-rotation.
 * 
 * * */
 
Ellipse.elementTag = "ellipse";
Ellipse.shapeName = "ellipse";

function Ellipse(svgNode) {
	Ellipse.baseConstructor.call(this, svgNode ? svgNode : Ellipse.elementTag, Ellipse.shapeName);
}
Util.extend(Ellipse, Shape);

Ellipse.prototype.initialize = function() {
	this.center = new Coord2D(0, 0);
	this.rx = 0;                                    // X-Radius
	this.ry = 0;                                    // Y-Radius
	this.xrot = 0;                                  // X-Axis Rotation
};

Ellipse.prototype.push = function() {
	this.set("cx", this.center.x);
	this.set("cy", this.center.y);
	this.set("rx", this.rx);
	this.set("ry", this.ry);
	this.set("transform", "rotate("+Util.radToDeg(this.xrot)+" "+this.center.x+" "+this.center.y+")");
};

Ellipse.prototype.clone = function() {
	var e = new Ellipse();
	e.center = this.center.clone();
	e.rx = this.rx;
	e.ry = this.ry;
	e.xrot = this.xrot;
	
	return e;
};
