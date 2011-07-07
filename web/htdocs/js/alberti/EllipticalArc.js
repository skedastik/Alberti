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
 * EllipticalArc.js
 * extends Shape
 * 
 * Elliptical arc shape, defined by a center point, x-radius, y-radius,
 * x-axis-rotation, start angle, and delta angle (angles in radians).
 * 
 * * */

EllipticalArc.elementTag = "path";
EllipticalArc.shapeName = "earc";
 
function EllipticalArc(svgNode) {
	EllipticalArc.baseConstructor.call(this, svgNode ? svgNode : EllipticalArc.elementTag, EllipticalArc.shapeName);
}
Util.extend(EllipticalArc, Shape);

EllipticalArc.prototype.initialize = function() {
	this.center = new Coord2D(0, 0);
	this.rx = 0;                                    // X-Radius
	this.ry = 0;                                    // Y-Radius
	this.xrot = 0;                                  // X-Axis Rotation
	this.sa = 0;                                    // Start angle
	this.da = 0;                                    // Delta angle
};

EllipticalArc.prototype.push = function() {
	var ea = this.sa + this.da;
	
	// Use general parametric form of ellipse to calculate m and n, the 
	// "endpoints" of the arc needed for SVG's arc path format. But before we
	// do that, we need to define parameter t in terms of the start and delta
	// angles, respectively, using:
	//
	//    t = arctan(a*tan(theta)/b)
	//
	// The above works for the first quadrant and is adapted for others. See
	// <http://mathforum.org/library/drmath/view/54922.html> for derivation.
	var tm = atan((this.rx * tan(this.sa)) / this.ry) + ((this.sa > halfPi && this.sa <= threeHalfPi) ? pi : twoPi);
	var tn = atan((this.rx * tan(ea)) / this.ry)  + ((ea > halfPi && ea <= threeHalfPi) ? pi : twoPi);
	
	var m = new Coord2D(
		this.center.x + this.rx * cos(tm) * cos(this.xrot) - this.ry * sin(tm) * sin(this.xrot),
		this.center.y + this.rx * cos(tm) * sin(this.xrot) + this.ry * sin(tm) * cos(this.xrot)
	);
		
	var n = new Coord2D(
		this.center.x + this.rx * cos(tn) * cos(this.xrot) - this.ry * sin(tn) * sin(this.xrot),
		this.center.y + this.rx * cos(tn) * sin(this.xrot) + this.ry * sin(tn) * cos(this.xrot)
	);
	
	// Determine large-arc and sweep flag SVG path params based on delta angle
	var large = Math.abs(this.da) > pi ? 1 : 0;
	var sweep = this.da > 0 ? 1 : 0;
	
	this.set("d",
		"M"+Util.roundToDecimal(m.x, Alberti.precision)+","+Util.roundToDecimal(m.y, Alberti.precision)
		+" A"+Util.roundToDecimal(this.rx, Alberti.precision)+","+Util.roundToDecimal(this.ry, Alberti.precision)+", "
		+Util.roundToDecimal(Util.radToDeg(this.xrot), Alberti.precision)+", "
		+large+","+sweep+", "
		+Util.roundToDecimal(n.x, Alberti.precision)+", "+Util.roundToDecimal(n.y, Alberti.precision)
	);
	
	this.set("berti:cx", this.center.x, Alberti.customns);
	this.set("berti:cy", this.center.y, Alberti.customns);
	this.set("berti:rx", this.rx, Alberti.customns);
	this.set("berti:ry", this.ry, Alberti.customns);
	this.set("berti:xrot", this.xrot, Alberti.customns);
	this.set("berti:sa", this.sa, Alberti.customns);
	this.set("berti:da", this.da, Alberti.customns);
};

EllipticalArc.prototype.pull = function() {
	this.center = new Coord2D(this.get("cx", Alberti.customns), this.get("cy", Alberti.customns));
	this.rx = this.get("rx", Alberti.customns);
	this.ry = this.get("ry", Alberti.customns);
	this.xrot = this.get("xrot", Alberti.customns);
	this.sa = this.get("sa", Alberti.customns);
	this.da = this.get("da", Alberti.customns);
};

EllipticalArc.prototype.clone = function() {
	var ea = new EllipticalArc();
	ea.center = this.center.clone();
	ea.rx = this.rx;
	ea.ry = this.ry;
	ea.xrot = this.xrot;
	ea.sa = this.sa;
	ea.da = this.da;
	
	return ca;
};

// Returns a new, un-generate()'ed EllipticalArc inscribed in a convex 
// quadrilateral defined by four Coord2D's (which must be passed in anti-
// clockwise order), as described here:
//
//    <http://chrisjones.id.au/Ellipses/ellipse.html>
//
// With further equations from:
// 
//    http://mathworld.wolfram.com/Ellipse.html
//
EllipticalArc.inscribedInQuad = function(w, x, y, z) {
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
	
	var earc = new EllipticalArc();
	var bSquaredMinusAC = (b*b - a*c);
	
	earc.center.x = (c*d - b*f) / bSquaredMinusAC;
	earc.center.y = (a*f - b*d) / bSquaredMinusAC;
	
	var numerator = (2 * (a*f*f + c*d*d + g*b*b - 2*b*d*f - a*c*g));
	var rootQuantity = Math.sqrt((a - c)*(a - c) + 4*b*b);
	
	earc.rx = Math.sqrt(numerator / (bSquaredMinusAC * (rootQuantity - (a+c))));
	earc.ry = Math.sqrt(numerator / (bSquaredMinusAC * (-rootQuantity - (a+c))));
	
	if (b == 0) {
		if (a < c) {
			earc.xrot = 0;
		} else {
			earc.xrot = halfPi;
		}
	} else {
		var cotanQuantity = 0.5 * atan((2*b) / (a - c));
		
		if (a < c) {
			earc.xrot = cotanQuantity;
		} else {
			earc.xrot = halfPi + cotanQuantity;
		}
	}
	
	return earc;
};
