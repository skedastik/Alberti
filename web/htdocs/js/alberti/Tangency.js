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
 * Tangency.js
 * 
 * Each method's name is a combination of two Shape names ordered alpha-
 * betically, indicating the type of tangency (ellipse-point, etc). Arguments 
 * are ordered respectively. Each returns an array of tangent points 
 * (Coord2D's), or empty array if no tangents exist.
 * 
 * Note that the exact meaning of tangency is flexible and varies depending on
 * the input shapes. See individual method descriptions for details.
 * 
 * * */

var Tangency = {
 
	// For any point P external to ellipse E, there exists two lines passing
	// through P tangent to E. This method returns those points.
	ellipsepoint: function(ellipse, point) {
		// The general conic equation describing the ellipse is implicitly
		// differentiated yielding the ellipse slope equation:
		//
		//           dy/dx = -(a*X + b*Y + d) / (b*X + c*Y + f)
		//
		// The above is equated with the slope of the line passing through 
		// external point p(x0, y0) in order to form a system of equations that 
		// must be solved for X and Y:
		//
		//    (Y - y0) / (X - x0) = -(a*X + b*Y + d) / (b*X + c*Y + f)         [1]
		//
		//        a*X^2 + 2*b*X*Y +c*Y^2 + 2*d*X + 2*f*Y + g = 0               [2]
		//
		// The result of cross-multiplying eqn. [1] is reduced to:
		// 
		//    Y = (P*X + R) / Q                                                [3]
		//
		// Where:
		// 
		//    P = a*x0 + b*y0 + d
		//    Q = b*x0 + c*y0 + f      [if Q = 0, handle as special case #3]
		//    R = d*x0 + f*y0 + g
		//
		// Eqn. [3] is substituted into eqn. [2] and reduced to:
		//
		//    A*X^2 + B*X + C = 0                                              [4]
		// 
		// Where:
		//
		//    A = a - (2*b*P) / Q + (c*P*P) / (Q*Q)
		//    B = 2 * (d - (b*R + f*P) / Q + (c*P*R) / (Q*Q))
		//    C = g - (2*f*R) / Q + (c*R*R) / (Q*Q)
		// 
		// Eqn. [4] is solved w/ quadratic formula yielding X coordinates of 
		// tangent points. Substitute these into [3] for corresponding Y.
		// 
		// Special case #1: If the discriminant of [4] is negative, point p is not
		// external. It lies inside the ellipse and no tangents exist.
		// 
		// Special case #2: If the discriminant of [4] is 0, point p lies on the
		// ellipse and there is only one point of tangency: point p.
		// 
		// Special case #3: If Q is 0, the following equation is plugged into [2]:
		// 
		//    X = -R / P
		// 
		// Yielding a quadratic equation which reduces to:
		// 
		//    A*Y^2 + B*Y + C = 0
		// 
		// Where:
		// 
		//    A = c
		//    B = 2*(f - (b*R) / P)
		//    C = (a*R^2) / P^2 - (2*d*R) / P + g
		// 

		var tangents = [];

		var a = ellipse.coeffs[0];
		var b = ellipse.coeffs[1];
		var c = ellipse.coeffs[2];
		var d = ellipse.coeffs[3];
		var f = ellipse.coeffs[4];
		var g = ellipse.coeffs[5];
		
		var x0 = point.coord.x;
		var y0 = point.coord.y;

		var P = a*x0 + b*y0 + d;
		var Q = b*x0 + c*y0 + f;
		var R = d*x0 + f*y0 + g;

		if (Q == 0) {
			var A = c;
			var B = 2 * (f - (b*R) / P);
			var C = (a*R*R) / (P*P) - (2*d*R) / P + g;
		} else {
			var A = a - (2*b*P) / Q + (c*P*P) / (Q*Q);
			var B = 2 * (d - (b*R + f*P) / Q + (c*P*R) / (Q*Q));
			var C = g - (2*f*R) / Q + (c*R*R) / (Q*Q);
		}

		var discriminant = B*B - 4*A*C;
		
		// The above calculations (and the original perspective projection of
		// ellipse calculations) introduce significant floating point error 
		// in the discriminant. In order to accurately detect a discriminant
		// of zero, it is necessary to adjust the tolerance value on-the-fly.
		// The error size is logarithmically correlated with the area of the
		// ellipse. Tolerance is adjusted accordingly.
		
		var alpha = 1.86e29;
		var beta = -5.304;
		var area = ellipse.rx * ellipse.ry;
		var tolerance = (alpha * Math.pow(area, beta)) / 10e40;

		if (Util.equals(discriminant, 0, tolerance)) {
			tangents[0] = new Coord2D(x0, y0);      // Point lies on the ellipse, it is the single tangency
		} else if (discriminant > 0) {
			var rootd = Math.sqrt(discriminant);
			
			if (Q == 0) {
				var y1 = (-B + rootd) / (2*A);
				var y2 = (-B - rootd) / (2*A);
				var x1 = -R / P;
				var x2 = -R / P;
			} else {
				var x1 = (-B + rootd) / (2*A);
				var x2 = (-B - rootd) / (2*A);
				var y1 = -(P*x1 + R) / Q;
				var y2 = -(P*x2 + R) / Q;
			}

			tangents[0] = new Coord2D(x1, y1);
			tangents[1] = new Coord2D(x2, y2);
		}

		return tangents;
	},
	
	// Elliptical-arc and point
	earcpoint: function(arc, point) {
		var intersections = [];
		var solutions = Tangency.ellipsepoint(arc, point);
	
		var len = solutions.length;

		if (len > 0) {
			// Now that we have tangencies of ellipse and point, we must 
			// determine if they are on the arc.
		
			var extent = arc.sa + arc.da;

			for (var i = 0; i < len; i++) {
				if (solutions[i] && Util.angleIsBetweenAngles(arc.center.angleTo(solutions[i]), arc.sa, extent)) {
					intersections.push(solutions[i]);
				}
			}
		}
	
		return intersections;
	}
}