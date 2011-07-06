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
 * Coord2D.js
 * 
 * A 2D coordinate point.
 * 
 * * */
 
function Coord2D(x, y) {
	if (arguments.length > 0) {
		this.x = x;
		this.y = y;
	}
}

// Returns a duplicate of this Coord2D instance
Coord2D.prototype.clone = function() {
	return new Coord2D(this.x, this.y);
};

// Returns true if specified coord has same coordinates as this instance
Coord2D.prototype.isEqual = function(coord) {
	return (Util.equals(this.x, coord.x) && Util.equals(this.y, coord.y));
};

// Returns the angle (0-2pi radians) of the vector extending from this point
// to point 'p', relative to angle 'a' (which is relative horizontal).
Coord2D.prototype.angleToRelative = function(p, a) {
	var b = this.angleTo(p);
	
	if (b < a) {
		b += twoPi - a;
	} else {
		b -= a;
	}
	
	return b;
};

// Returns the angle (0-2pi radians) from horizontal of the vector extending 
// from this point to point 'p'. 0 radians implies a vector pointing right, 
// pi/2 radians implies a vector pointing down.
Coord2D.prototype.angleTo = function(p) {
	var dx = p.x - this.x;
	var a = 0;
	
	if (!Util.equals(dx, 0)) {
		var m = (p.y - this.y) / dx;
		a = atan(m);
	
		if (p.x < this.x) {
			a += pi;
		} else if (p.y < this.y) {
			a += twoPi;
		}
	} else {
		a = p.y > this.y ? halfPi : threeHalfPi;
	}
	
	return a;
};

// Returns the distance to the specified Coord2D
Coord2D.prototype.distanceTo = function(p) {
	return Math.sqrt(Math.pow(p.x - this.x, 2) + Math.pow(p.y - this.y, 2));
};

// Clone the coord, round its components to a safe decimal place (for floating 
// point precision reasons), then return it
Coord2D.roundForSafety = function(coord) {
	var coordRounded = coord.clone();
	coordRounded.x = Util.roundToDecimal(coordRounded.x, Alberti.tolerance);
	coordRounded.y = Util.roundToDecimal(coordRounded.y, Alberti.tolerance);
	
	return coordRounded;
}

Coord2D.prototype.toString = function() {
	return this.x+","+this.y;
};
