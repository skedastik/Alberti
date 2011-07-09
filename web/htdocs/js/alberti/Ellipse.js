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
 * extends EllipticalShape
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
Util.extend(Ellipse, EllipticalShape);

Ellipse.prototype.clone = function() {
	var e = new Ellipse();
	e.center = this.center.clone();
	e.rx = this.rx;
	e.ry = this.ry;
	e.xrot = this.xrot;
	
	return e;
};

// Returns a new, un-generate()'ed Ellipse inscribed in a convex quadrilateral 
// defined by four Coord2D's (which must be passed in anti-clockwise order), 
// as described here:
//
//    <http://chrisjones.id.au/Ellipses/ellipse.html>
//
// With further equations from:
// 
//    http://mathworld.wolfram.com/Ellipse.html
//
Ellipse.projectedToQuad = function(w, x, y, z) {
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
	
	var ellipse = new Ellipse();
	var bSquaredMinusAC = (b*b - a*c);
	
	ellipse.center.x = (c*d - b*f) / bSquaredMinusAC;
	ellipse.center.y = (a*f - b*d) / bSquaredMinusAC;
	
	var numerator = (2 * (a*f*f + c*d*d + g*b*b - 2*b*d*f - a*c*g));
	var rootQuantity = Math.sqrt((a - c)*(a - c) + 4*b*b);
	
	ellipse.rx = Math.sqrt(numerator / (bSquaredMinusAC * (rootQuantity - (a+c))));
	ellipse.ry = Math.sqrt(numerator / (bSquaredMinusAC * (-rootQuantity - (a+c))));
	
	if (b == 0) {
		if (a < c) {
			ellipse.xrot = 0;
		} else {
			ellipse.xrot = halfPi;
		}
	} else {
		var cotanQuantity = 0.5 * atan((2*b) / (a - c));
		
		if (a < c) {
			ellipse.xrot = cotanQuantity;
		} else {
			ellipse.xrot = halfPi + cotanQuantity;
		}
	}
	
	ellipse.coeffs = [a, b, c, d, f, g];
	
	return ellipse;
};
