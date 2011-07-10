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
	
	// Coefficients of general conic equation describing ellipse. May or may
	// not be set, depending on how ellipse was created.
	this.coeffs = [];
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
};

EllipticalShape.prototype.serialize = function() {
	this.set("berti:cx", this.center.x, Alberti.customns);
	this.set("berti:cy", this.center.y, Alberti.customns);
	this.set("berti:rx", this.rx, Alberti.customns);
	this.set("berti:ry", this.ry, Alberti.customns);
	this.set("berti:xrot", this.xrot, Alberti.customns);
	
	// This will work so long as all elliptical shapes are generated via the
	// projectToQuad method. Otherwise coefficients will have to be 
	// calculated on the fly.
	if (this.coeffs.length > 0) {
		this.set("berti:a", this.coeffs[0], Alberti.customns);
		this.set("berti:b", this.coeffs[1], Alberti.customns);
		this.set("berti:c", this.coeffs[2], Alberti.customns);
		this.set("berti:d", this.coeffs[3], Alberti.customns);
		this.set("berti:f", this.coeffs[4], Alberti.customns);
		this.set("berti:g", this.coeffs[5], Alberti.customns);
	}
};

EllipticalShape.prototype.pull = function() {
	this.center = new Coord2D(this.get("cx", Alberti.customns), this.get("cy", Alberti.customns));
	this.rx = this.get("rx", Alberti.customns);
	this.ry = this.get("ry", Alberti.customns);
	this.xrot = this.get("xrot", Alberti.customns);
	this.coeffs = [];
	
	var a = this.get("a", Alberti.customns);
	
	if (a !== "" && a !== null) {
		this.coeffs[0] = a;
		this.coeffs[1] = this.get("b", Alberti.customns);
		this.coeffs[2] = this.get("c", Alberti.customns);
		this.coeffs[3] = this.get("d", Alberti.customns);
		this.coeffs[4] = this.get("f", Alberti.customns);
		this.coeffs[5] = this.get("g", Alberti.customns);
	}
};

// Returns the point on the ellipse at the given polar angle
EllipticalShape.prototype.getPointGivenAngle = function(a) {
	// Normalize the angle to a polar angle in the range [-2pi, 2pi]
	a = (a - this.xrot) % twoPi;
	
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

// Returns elliptical shape 'e' inscribed in a convex quadrilateral defined by
// four Coord2D's (which must be passed in anti-clockwise order), as described
// here:
//
//    <http://chrisjones.id.au/Ellipses/ellipse.html>
//
// With further equations from:
// 
//    http://mathworld.wolfram.com/Ellipse.html
//
// Returns 'e'.
//
EllipticalShape.projectToQuad = function(e, w, x, y, z) {
	var W0 = w.x, W1 = w.y;
	var X0 = x.x, X1 = x.y;
	var Y0 = y.x, Y1 = y.y;
	var Z0 = z.x, Z1 = z.y;
	
	var A =  X0*Y0*Z1 - W0*Y0*Z1 - X0*Y1*Z0 + W0*Y1*Z0 - W0*X1*Z0 + W1*X0*Z0 + W0*X1*Y0 - W1*X0*Y0;
	var B =  W0*Y0*Z1 - W0*X0*Z1 - X0*Y1*Z0 + X1*Y0*Z0 - W1*Y0*Z0 + W1*X0*Z0 + W0*X0*Y1 - W0*X1*Y0;
	var C =  X0*Y0*Z1 - W0*X0*Z1 - W0*Y1*Z0 - X1*Y0*Z0 + W1*Y0*Z0 + W0*X1*Z0 + W0*X0*Y1 - W1*X0*Y0;
	var D =  X1*Y0*Z1 - W1*Y0*Z1 - W0*X1*Z1 + W1*X0*Z1 - X1*Y1*Z0 + W1*Y1*Z0 + W0*X1*Y1 - W1*X0*Y1;
	var E = -X0*Y1*Z1 + W0*Y1*Z1 + X1*Y0*Z1 - W0*X1*Z1 - W1*Y1*Z0 + W1*X1*Z0 + W1*X0*Y1 - W1*X1*Y0;
	var F =  X0*Y1*Z1 - W0*Y1*Z1 + W1*Y0*Z1 - W1*X0*Z1 - X1*Y1*Z0 + W1*X1*Z0 + W0*X1*Y1 - W1*X1*Y0;
	var G =  X0*Z1    - W0*Z1    - X1*Z0    + W1*Z0    - X0*Y1    + W0*Y1    + X1*Y0    - W1*Y0;
	var H =  Y0*Z1    - X0*Z1    - Y1*Z0    + X1*Z0    + W0*Y1    - W1*Y0    - W0*X1    + W1*X0;
	var I =  Y0*Z1    - W0*Z1    - Y1*Z0    + W1*Z0    + X0*Y1    - X1*Y0    + W0*X1    - W1*X0;
	
	var S = Matrix.create([
		[A,B,C],
		[D,E,F],
		[G,H,I]
	]);
	
	var T = S.inverse();
		
	var J = T.elements[0][0];
	var K = T.elements[0][1];
	var L = T.elements[0][2];
	var M = T.elements[1][0];
	var N = T.elements[1][1];
	var O = T.elements[1][2];
	var P = T.elements[2][0];
	var Q = T.elements[2][1];
	var R = T.elements[2][2];
	
	var a = J*J + M*M - P*P;
	var b = J*K + M*N - P*Q;
	var c = K*K + N*N - Q*Q;
	var d = J*L + M*O - P*R;
	var f = K*L + N*O - Q*R;
	var g = L*L + O*O - R*R;
	
	var bSquaredMinusAC = (b*b - a*c);
	
	e.center.x = (c*d - b*f) / bSquaredMinusAC;
	e.center.y = (a*f - b*d) / bSquaredMinusAC;
	
	var numerator = (2 * (a*f*f + c*d*d + g*b*b - 2*b*d*f - a*c*g));
	var rootQuantity = Math.sqrt((a - c)*(a - c) + 4*b*b);
	
	e.rx = Math.sqrt(numerator / (bSquaredMinusAC * (rootQuantity - (a+c))));
	e.ry = Math.sqrt(numerator / (bSquaredMinusAC * (-rootQuantity - (a+c))));
	
	if (b == 0) {
		if (a < c) {
			e.xrot = 0;
		} else {
			e.xrot = halfPi;
		}
	} else {
		var cotanQuantity = 0.5 * atan((2*b) / (a - c));
		
		if (a < c) {
			e.xrot = cotanQuantity;
		} else {
			e.xrot = halfPi + cotanQuantity;
		}
	}
	
	e.coeffs = [a, b, c, d, f, g];
	
	return e;
};
