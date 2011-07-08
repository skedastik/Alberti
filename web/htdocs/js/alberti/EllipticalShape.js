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
 * EllipticalShape.js
 * extends Shape
 * 
 * Base class for elliptical shapes featuring ellipse geometry functions.
 * 
 * * */
 
function EllipticalShape(svgTagOrNode, shapeName) {
	EllipticalShape.baseConstructor.call(this, svgTagOrNode, shapeName);
}
Util.extend(EllipticalShape, Shape);

EllipticalShape.prototype.initialize = function() {
	this.center = new Coord2D(0, 0);
	this.rx = 0;                                    // X-Radius
	this.ry = 0;                                    // Y-Radius
	this.xrot = 0;                                  // X-Axis Rotation
};

EllipticalShape.prototype.initialize = function() {
	this.center = new Coord2D(0, 0);
	this.rx = 0;                                    // X-Radius
	this.ry = 0;                                    // Y-Radius
	this.xrot = 0;                                  // X-Axis Rotation
};

EllipticalShape.prototype.push = function() {
	this.set("cx", this.center.x);
	this.set("cy", this.center.y);
	this.set("rx", this.rx);
	this.set("ry", this.ry);
	this.set("transform", "rotate("+Util.radToDeg(this.xrot)+" "+this.center.x+" "+this.center.y+")");
	
	this.set("berti:cx", this.center.x, Alberti.customns);
	this.set("berti:cy", this.center.y, Alberti.customns);
	this.set("berti:rx", this.rx, Alberti.customns);
	this.set("berti:ry", this.ry, Alberti.customns);
	this.set("berti:xrot", this.xrot, Alberti.customns);
};

EllipticalShape.prototype.pull = function() {
	this.center = new Coord2D(this.get("cx", Alberti.customns), this.get("cy", Alberti.customns));
	this.rx = this.get("rx", Alberti.customns);
	this.ry = this.get("ry", Alberti.customns);
	this.xrot = this.get("xrot", Alberti.customns);
};

// Returns the point on the ellipse at the given polar angle
EllipticalShape.prototype.getPointGivenAngle = function(a) {
	a -= this.xrot;
	
	// Use general parametric form of ellipse to calculate tangent point. But 
	// first define parameter 't' in terms of angle 'a':
	//
	//    t = arctan(a*tan(theta)/b)
	//
	// The above works for the first quadrant and is adapted for others. See
	// <http://mathforum.org/library/drmath/view/54922.html> for derivation.
	var aa = Math.abs(a);
	var t = atan((this.rx * tan(a)) / this.ry) + ((aa > halfPi && aa <= threeHalfPi) ? pi : twoPi);
	
	return new Coord2D(
		this.center.x + this.rx * cos(t) * cos(this.xrot) - this.ry * sin(t) * sin(this.xrot),
		this.center.y + this.rx * cos(t) * sin(this.xrot) + this.ry * sin(t) * cos(this.xrot)
	);
};
