/*
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
		b += Util.twoPi - a;
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
		a = Math.atan(m);
	
		if (p.x < this.x) {
			a += Math.PI;
		} else if (p.y < this.y) {
			a += Util.twoPi;
		}
	} else {
		a = p.y > this.y ? Util.halfPi : Util.threeHalvesPi;
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
	coordRounded.x = Util.roundToDecimal(coordRounded.x, Alberti.decimalPrecision);
	coordRounded.y = Util.roundToDecimal(coordRounded.y, Alberti.decimalPrecision);
	
	return coordRounded;
}

Coord2D.prototype.toString = function() {
	return this.x+","+this.y;
};
