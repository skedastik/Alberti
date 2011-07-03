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
 * Line.js
 * extends Shape
 * 
 * Line shape, defined by two points.
 * 
 * * */
 
Line.elementTag = "line";
Line.shapeName = "line";

function Line(svgNode) {
	Line.baseConstructor.call(this, svgNode ? svgNode : Line.elementTag, Line.shapeName);
}
Util.extend(Line, Shape);

Line.prototype.initialize = function() {
	this.p1 = new Coord2D(0, 0);
	this.p2 = new Coord2D(0, 0);
};

Line.prototype.push = function() {
	this.set("x1", this.p1.x);
	this.set("y1", this.p1.y);
	this.set("x2", this.p2.x);
	this.set("y2", this.p2.y);
};

Line.prototype.pull = function() {
	this.p1 = new Coord2D(this.get("x1"), this.get("y1"));
	this.p2 = new Coord2D(this.get("x2"), this.get("y2"));
};

// Create a new Line from given coords, without calling SvgObject::generate
Line.fromPoints = function(p1, p2) {
	var l = new Line();
	l.p1.x = p1.x;
	l.p1.y = p1.y;
	l.p2.x = p2.x;
	l.p2.y = p2.y;
	
	return l;
}

// Clone the line object, without calling SvgObject::generate
Line.prototype.clone = function() {
	var l = new Line();
	l.p1 = this.p1.clone();
	l.p2 = this.p2.clone();
	
	return l;
};

// Returns the point on this line nearest the given external point--in other
// words, the intersection point of this line and an orthogonal line passing
// through the external point. Note that, for the purposes of this function,
// this line is considered to be infinite--the nearest coincident point will 
// not be constrained between this line's endpoints. 
Line.prototype.getNearestCoincident = function(p) {
	var dx = this.p2.x - this.p1.x;
	var dy = this.p2.y - this.p1.y;
	var m1 = dy / dx;
	
	if (Util.equals(dx, 0)) {
		// line is vertical, nearest coincident is at (this.p1.x, p.y)
		return new Coord2D(this.p1.x, p.y);
	} else if (Util.equals(dy, 0)) {
		// line is horizontal, nearest coincident is at (p.x, this.p1.y)
		return new Coord2D(p.x, this.p1.y);
	} else {
		// perpendicular slope via negative reciprocal
		m2 = -dx / dy;
		
		// y-intercepts
		b1 = this.p1.y - m1 * this.p1.x;
		b2 = p.y - m2 * p.x;
		
		// calculate the intersection
		var x0 = (b1 - b2) / (m2 - m1);
		var y0 = m2 * x0 + b2;
		
		return new Coord2D(x0, y0);
	}
};

// Returns a new Line object geometrically identical to this one, except 
// extending (practically) infinitely in either direction. Caution: SVG has
// difficulty rendering long, single-pixel-width lines with shape-rendering
// set to "crispEdges". Visual artifacts will occur. The "infinity factor" 
// (the exponent in var ratio's definition) below can be adjusted accordingly.
//
// Note that SvgObject::generate is not called.
Line.prototype.extendToInfinity = function() {
	var l = new Line();
	var ratio = 1e4 / this.getLength();
	var mp = this.getMidpoint();
	var dx = mp.x - this.p1.x;
	var dy = mp.y - this.p1.y;
	
	l.p1.x = mp.x - ratio * dx;
	l.p1.y = mp.y - ratio * dy;
	
	l.p2.x = mp.x + ratio * dx;
	l.p2.y = mp.y + ratio * dy;
	
	return l;
};

Line.prototype.getLength = function() {
	return this.p1.distanceTo(this.p2);
};

Line.prototype.getSlope = function() {
	return (this.p2.y - this.p1.y) / (this.p2.x - this.p1.x);
};

Line.prototype.getMidpoint = function() {
	return new Coord2D((this.p1.x + this.p2.x) / 2, (this.p1.y + this.p2.y) / 2);
};

// Returns the angle (0-2pi radians) of this line relative to angle 'a' (which 
// is relative horizontal).
Line.prototype.getAngleRelative = function(a) {
	return this.p1.angleToRelative(this.p2, a);
};

// Returns angle from horizontal in radians (0 radians pointing right, pi/2 
// radians pointing down).
Line.prototype.getAngleFromHorizontal = function() {
	return this.p1.angleTo(this.p2);
};

// Rotates the line about endpoint p1 to the given angle (in radians) from 
// horizontal (0 radians pointing right, pi/2 radians pointing down). Returns
// self.
Line.prototype.setAngleFromHorizontal = function(a) {
	var r = this.getLength();
	this.p2.x = this.p1.x + r * Math.cos(a);
	this.p2.y = this.p1.y + r * Math.sin(a);
	
	return this;
};

// Set the length of the line segment, keeping p1 stationary and translating 
// p2 to match the new length. Returns self.
Line.prototype.setLength = function(len) {
	var a = this.getAngleFromHorizontal();
	this.p2.x = this.p1.x + len * Math.cos(a);
	this.p2.y = this.p1.y + len * Math.sin(a);
	
	return this;
};
