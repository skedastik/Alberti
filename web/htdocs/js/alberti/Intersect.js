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
 * Intersect.js
 * 
 * Each method's name is a combination of two Shape names ordered alpha-
 * betically, indicating the type of intersection (line-line, circle-line, 
 * etc). Arguments are ordered respectively. Each returns an array of 
 * intersection points (Coord2D's), or empty array if the shapes do not
 * intersect.
 * 
 * * */

var Intersect = {

	// http://www.topcoder.com/tc?module=Static&d1=tutorials&d2=geometry2
	lineline: function(l1, l2) {
		var intersections = [];
	
		var a1 = l1.p2.y - l1.p1.y;
		var b1 = l1.p1.x - l1.p2.x;
		var c1 = a1 * l1.p1.x + b1 * l1.p1.y;
	
		var a2 = l2.p2.y - l2.p1.y;
		var b2 = l2.p1.x - l2.p2.x;
		var c2 = a2 * l2.p1.x + b2 * l2.p1.y;
	
		var det = a1 * b2 - a2 * b1;
	
		if (!Util.equals(det, 0)) {
			var x0 = (b2 * c1 - b1 * c2) / det;
			var y0 = (a1 * c2 - a2 * c1) / det;
		
			if (Util.between(x0, l1.p1.x, l1.p2.x) && Util.between(y0, l1.p1.y, l1.p2.y)
				&& Util.between(x0, l2.p1.x, l2.p2.x) && Util.between(y0, l2.p1.y, l2.p2.y)) {
				intersections.push(new Coord2D(x0, y0));
			}
		}
	
		return intersections;
	},

	ellipseline: function(ellipse, line) {
		// Given conic equation describing ellipse:
		//
		//    a*x^2 + 2*b*x*y + c*y^2 + 2*d*x + 2*f*y + g = 0
		//
		// We plug in parameterized line equations:
		//
		//    x(t) = x1 + t * (x2 - x1)
		//    y(t) = y1 + t * (y2 - y1)
		//
		// Yielding:
		//
		//    c*t^2*y2^2-2*c*t^2*y1*y2+2*c*t*y1*y2+2*b*t^2*x2*y2-2*b*t^2*x1*y2
		//    +2*b*t*x1*y2+2*f*t*y2+c*t^2*y1^2-2*c*t*y1^2+c*y1^2-2*b*t^2*x2*y1
		//    +2*b*t*x2*y1+2*b*t^2*x1*y1-4*b*t*x1*y1+2*b*x1*y1-2*f*t*y1+2*f*y1
		//    +a*t^2*x2^2-2*a*t^2*x1*x2+2*a*t*x1*x2+2*d*t*x2+a*t^2*x1^2-2*a*t*x1^2
		//    +a*x1^2-2*d*t*x1+2*d*x1+g
		//
		// From which we collect like terms under parameter t, yielding 
		// coefficients A, B, and C used to calculate the discriminant and 
		// determine roots.
		//
		var intersections = [];
	
		if (ellipse.coeffs.length > 0) {
			// Coefficients a, b, c, d, f, and g of conic equation describing ellipse
			var a = ellipse.coeffs[0];
			var b = ellipse.coeffs[1];
			var c = ellipse.coeffs[2];
			var d = ellipse.coeffs[3];
			var f = ellipse.coeffs[4];
			var g = ellipse.coeffs[5];
		
			var x1 = line.p1.x, y1 = line.p1.y;
			var x2 = line.p2.x, y2 = line.p2.y;
		
			var dx = x2 - x1;
			var dy = y2 - y1;
		
			var A = c*y2*y2 - 2*c*y1*y2 + 2*b*x2*y2 - 2*b*x1*y2 + c*y1*y1 - 2*b*x2*y1 + 2*b*x1*y1 + a*x2*x2 - 2*a*x1*x2 + a*x1*x1;
			var B = 2*c*y1*y2 + 2*b*x1*y2 + 2*f*y2 - 2*c*y1*y1 + 2*b*x2*y1 - 4*b*x1*y1 - 2*f*y1 + 2*a*x1*x2 + 2*d*x2 - 2*a*x1*x1 - 2*d*x1;
			var C = c*y1*y1 + 2*b*x1*y1 + 2*f*y1 + a*x1*x1 + 2*d*x1 + g;
		
			var discriminant = B*B - 4*A*C;
		
			// The above calculations (and the original perspective projection of
			// ellipse calculations) introduce significant floating point error in
			// the discriminant. In order to accurately detect tangencies (i.e.
			// discriminants of 0) it is necessary to adjust the tolerance value
			// on-the-fly. The error size is logarithmically correlated with the 
			// area of the ellipse. Tolerance is adjusted accordingly.
		
			var alpha = 2.19e35;
			var beta = -5.673;
			var area = ellipse.rx * ellipse.ry;
			var tolerance = (alpha * Math.pow(area, beta)) / 10e40;
		
			if (Util.equals(discriminant, 0, tolerance)) {
				var t = -B / (2*A);
			
				if (Util.between(t, 0, 1)) {
					intersections[0] = new Coord2D(line.p1.x + t * dx, line.p1.y + t * dy);
				}
			} else if (discriminant > 0) {
				var rootd = Math.sqrt(discriminant);
				var t1 = (-B + rootd) / (2*A);
				var t2 = (-B - rootd) / (2*A);
			
				if (Util.between(t1, 0, 1)) {
					intersections.push(new Coord2D(line.p1.x + t1 * dx, line.p1.y + t1 * dy));
				}
			
				if (Util.between(t2, 0, 1)) {
					intersections.push(new Coord2D(line.p1.x + t2 * dx, line.p1.y + t2 * dy));
				}
			}
		}
	
		return intersections;
	},

	earcline: function(arc, line) {
		var intersections = [];
		var solutions = Intersect.ellipseline(arc, line);
	
		var len = solutions.length;

		if (len > 0) {
			// Now that we have intersections of ellipse and line, we must 
			// determine if they are on the arc.
		
			var extent = arc.sa + arc.da;

			for (var i = 0; i < len; i++) {
				if (solutions[i] && Util.angleIsBetweenAngles(arc.center.angleTo(solutions[i]), arc.sa, extent)) {
					intersections.push(solutions[i]);
				}
			}
		}
	
		return intersections;
	},

	// http://stackoverflow.com/questions/1073336/circle-line-collision-detection
	circleline: function(circle, line) {
		// let D = direction vector of line from start to end
		// let F = direction vector from center of arc to line start
		//
		//    D = <p2.x - p1.x,
		//         p2.y - p1.y>
		//
		//    F = <p1.x - arc.center.x,
		//         p1.y - arc.center.y>
		// 
		// Using parameterized line equation:
		// 
		//    x = p1.x + t * (p2.x - p1.x)
		//    y = p1.y + t * (p2.y - p1.y)
		// 
		// And plugging into equation of circle, (x-h)^2 + (y-k)^2 = r^2, yields
		// quadratic vector equation (where * is dot product):
		// 
		//    t^2(D * D) + 2t(F * D) + (F * F - r^2) = 0
		//
		// Discriminant will be greater than or equal to 0 if there are 
		// intersections. Use quadratic formula to determine roots t1, t2. If both
		// t1 and t2 are in the range [0:1], there are two intersections; if not, 
		// there is only one intersection.
		//
		var intersections = [];
	
		var dx1 = line.p2.x - line.p1.x;
		var dy1 = line.p2.y - line.p1.y;
	
		var dx2 = line.p1.x - circle.center.x;
		var dy2 = line.p1.y - circle.center.y;
	
		var a = dx1 * dx1 + dy1 * dy1;
		var b = 2 * (dx2 * dx1 + dy2 * dy1);
		var c = (dx2 * dx2 + dy2 * dy2) - circle.radius * circle.radius;
	
		var discriminant = b * b - 4 * a * c;
	
		if (Util.equals(discriminant, 0, 1e-25)) {
			var t = -b / (2 * a);
		
			if (Util.between(t, 0, 1)) {
				intersections[0] = new Coord2D(line.p1.x + t * dx1, line.p1.y + t * dy1);
			}
		} else if (discriminant > 0) {
			var rootd = Math.sqrt(discriminant);
			var t1 = (-b + rootd) / (2 * a);
			var t2 = (-b - rootd) / (2 * a);
		
			if (Util.between(t1, 0, 1)) {
				intersections.push(new Coord2D(line.p1.x + t1 * dx1, line.p1.y + t1 * dy1));
			}
		
			if (Util.between(t2, 0, 1)) {
				intersections.push(new Coord2D(line.p1.x + t2 * dx1, line.p1.y + t2 * dy1));
			}
		}
	
		return intersections;
	},

	carcline: function(arc, line) {
		var intersections = [];
		var solutions = Intersect.circleline(arc, line);
	
		var len = solutions.length;
	
		if (len > 0) {
			// Now that we have intersections of circle and line, we must 
			// determine if they are on the arc.
		
			var extent = arc.sa + arc.da;
	
			for (var i = 0; i < len; i++) {
				if (solutions[i] && Util.angleIsBetweenAngles(arc.center.angleTo(solutions[i]), arc.sa, extent)) {
					intersections.push(solutions[i]);
				}
			}
		}
	
		return intersections;
	},

	bezierline: function(bezier, line) {
		var intersections = [];
		var solutions = [];
	
		var x0 = bezier.p1.x, y0 = bezier.p1.y;
		var x1 = bezier.p2.x, y1 = bezier.p2.y;
		var x2 = bezier.p3.x, y2 = bezier.p3.y;
		var x3 = line.p1.x,   y3 = line.p1.y;
		var x4 = line.p2.x,   y4 = line.p2.y;
	
		var A = (x2 - 2*x1 + x0)*y4 + (-x2 + 2*x1 - x0)*y3 + (x3 - x4)*y2 + (2*x4 - 2*x3)*y1 + (x3 - x4)*y0;
		var B = (2*x1 - 2*x0)*y4 + (2*x0 - 2*x1)*y3 + (2*x3 - 2*x4)*y1 + (2*x4 - 2*x3)*y0;
		var C = (x0 - x3)*y4 + (x4 - x0)*y3 + (x3 - x4)*y0;
	
		var discriminant = B*B - 4*A*C;
	
		if (Util.equals(discriminant, 0)) {
			var t = -B / (2*A);
		
			if (Util.between(t, 0, 1)) {
				var D = (1 - t)*(1 - t);
				var E = 2*(1 - t)*t;
				var F = t*t;
			
				solutions[0] = new Coord2D(
					D*x0 + E*x1 + F*x2,
					D*y0 + E*y1 + F*y2
				);
			}
		} else if (discriminant > 0) {
			var rootd = Math.sqrt(discriminant);
			var t1 = (-B + rootd) / (2*A);
			var t2 = (-B - rootd) / (2*A);
		
			if (Util.between(t1, 0, 1)) {
				var D = (1 - t1)*(1 - t1);
				var E = 2*(1 - t1)*t1;
				var F = t1*t1;
			
				solutions.push(new Coord2D(
					D*x0 + E*x1 + F*x2,
					D*y0 + E*y1 + F*y2
				));
			}
		
			if (Util.between(t2, 0, 1)) {
				var I = (1 - t2)*(1 - t2);
				var J = 2*(1 - t2)*t2;
				var K = t2*t2;
			
				solutions.push(new Coord2D(
					I*x0 + J*x1 + K*x2,
					I*y0 + J*y1 + K*y2
				));
			}
		}
	
		// Make sure that roots lie on line segment
		for (var iter = 0; iter < solutions.length; iter++) {
			var sol = solutions[iter];
			if (Util.between(sol.x, line.p1.x, line.p2.x) && Util.between(sol.y, line.p1.y, line.p2.y)) {
				intersections.push(sol);
			}
		}
	
		return intersections;
	},

	// http://paulbourke.net/geometry/2circle/
	circlecircle: function(c1, c2) {
		// let d = distance between circles' centers
		//
		// If d > c1.radius + c2.radius, the circles are too far apart to
		// intersect. If d < |c1.radius - c2.radius|, one circle is contained in
		// the other and there are no intersections. If d == 0, and the radii are
		// equivalent, the circles are coincident, with an infinite number of
		// intersections.
		//
		// If d == c1.radius + c2.radius, or d == |c1.radius - c2.radius|, there
		// is a single intersection.
		// 
		// The Pythagorean theorem and the principle of similar triangles are used
		// to solve for the intersection points.
		//
		var intersections = [];
	
		// Use floored values as distanceTo will always return a truncated float
		var d = Util.floorToDecimal(c1.center.distanceTo(c2.center), 6);
		var rsum = Util.floorToDecimal(c1.radius + c2.radius, 6);
		var rdiff = Util.floorToDecimal(Math.abs(c1.radius - c2.radius), 6);
	
		var r1Squared = c1.radius * c1.radius;
		var r2Squared = c2.radius * c2.radius;
	
		var dx = c2.center.x - c1.center.x;
		var dy = c2.center.y - c1.center.y;
	
		if (d < rsum && d > rdiff) {
			var a = (r1Squared - r2Squared + d * d) / (2 * d);
			var h = Math.sqrt(r1Squared - a * a);
		
			var aratio = a / d;
			var hratio = h / d;
		
			var newdx = hratio * dx;
			var newdy = hratio * dy;
	
			var p2 = new Coord2D(c1.center.x + aratio * dx, c1.center.y + aratio * dy);
			intersections[0] = new Coord2D(p2.x + newdy, p2.y - newdx);
			intersections[1] = new Coord2D(p2.x - newdy, p2.y + newdx);
			
		} else if (d != 0 && (Util.equals(rsum, d) || (Util.equals(rdiff, d)))) {
			var rratio = c1.radius / d;
			intersections[0] = new Coord2D(c1.center.x + rratio * dx, c1.center.y + rratio * dy);
		}
	
		return intersections;
	},

	carccircle: function(arc, circle) {
		var intersections = [];
		var solutions = Intersect.circlecircle(arc, circle);
	
		// Now that we have intersections of circle and circle, we must determine 
		// if they are on the arc.
	
		if (solutions.length > 0) {
			var extent = arc.sa + arc.da;
		
			for (var i = 0, pLen = solutions.length; i < pLen; i++) {
				if (Util.angleIsBetweenAngles(arc.center.angleTo(solutions[i]), arc.sa, extent)) {
					intersections.push(solutions[i]);
				}
			}
		}
	
		return intersections;
	},

	// http://paulbourke.net/geometry/2circle/
	carccarc: function(arc1, arc2) {
		var intersections = [];
		var solutions = Intersect.circlecircle(arc1, arc2);
	
		// Now that we have intersections of circle and circle, we must determine 
		// if they are on both arcs.
	
		if (solutions.length > 0) {
			var extent1 = arc1.sa + arc1.da;
			var extent2 = arc2.sa + arc2.da;
		
			for (var i = 0, pLen = solutions.length; i < pLen; i++) {
				if (Util.angleIsBetweenAngles(arc1.center.angleTo(solutions[i]), arc1.sa, extent1)
					&& Util.angleIsBetweenAngles(arc2.center.angleTo(solutions[i]), arc2.sa, extent2)) {
					intersections.push(solutions[i]);
				}
			}
		}
	
		return intersections;
	},

	linerect: function(line, rect) {
		var intersections = [];
	
		intersections = intersections.concat(Intersect.lineline(line, Line.fromPoints(
			new Coord2D(rect.rect.left, rect.rect.top),
			new Coord2D(rect.rect.right, rect.rect.top))));
		
		intersections = intersections.concat(Intersect.lineline(line, Line.fromPoints(
			new Coord2D(rect.rect.right, rect.rect.top),
			new Coord2D(rect.rect.right, rect.rect.bottom))));
		
		intersections = intersections.concat(Intersect.lineline(line, Line.fromPoints(
			new Coord2D(rect.rect.right, rect.rect.bottom),
			new Coord2D(rect.rect.left, rect.rect.bottom))));
		
		intersections = intersections.concat(Intersect.lineline(line, Line.fromPoints(
			new Coord2D(rect.rect.left, rect.rect.bottom),
			new Coord2D(rect.rect.left, rect.rect.top))));
	
		return intersections;
	},

	carcrect: function(carc, rect) {
		var intersections = [];
	
		intersections = intersections.concat(Intersect.carcline(carc, Line.fromPoints(
			new Coord2D(rect.rect.left, rect.rect.top),
			new Coord2D(rect.rect.right, rect.rect.top))));
	
		intersections = intersections.concat(Intersect.carcline(carc, Line.fromPoints(
			new Coord2D(rect.rect.right, rect.rect.top),
			new Coord2D(rect.rect.right, rect.rect.bottom))));
	
		intersections = intersections.concat(Intersect.carcline(carc, Line.fromPoints(
			new Coord2D(rect.rect.right, rect.rect.bottom),
			new Coord2D(rect.rect.left, rect.rect.bottom))));
	
		intersections = intersections.concat(Intersect.carcline(carc, Line.fromPoints(
			new Coord2D(rect.rect.left, rect.rect.bottom),
			new Coord2D(rect.rect.left, rect.rect.top))));
	
		return intersections;
	},

	earcrect: function(earc, rect) {
		var intersections = [];
	
		intersections = intersections.concat(Intersect.earcline(earc, Line.fromPoints(
			new Coord2D(rect.rect.left, rect.rect.top),
			new Coord2D(rect.rect.right, rect.rect.top))));
	
		intersections = intersections.concat(Intersect.earcline(earc, Line.fromPoints(
			new Coord2D(rect.rect.right, rect.rect.top),
			new Coord2D(rect.rect.right, rect.rect.bottom))));
	
		intersections = intersections.concat(Intersect.earcline(earc, Line.fromPoints(
			new Coord2D(rect.rect.right, rect.rect.bottom),
			new Coord2D(rect.rect.left, rect.rect.bottom))));
	
		intersections = intersections.concat(Intersect.earcline(earc, Line.fromPoints(
			new Coord2D(rect.rect.left, rect.rect.bottom),
			new Coord2D(rect.rect.left, rect.rect.top))));
	
		return intersections;
	},

	ellipserect: function(ellipse, rect) {
		var intersections = [];
	
		intersections = intersections.concat(Intersect.ellipseline(ellipse, Line.fromPoints(
			new Coord2D(rect.rect.left, rect.rect.top),
			new Coord2D(rect.rect.right, rect.rect.top))));
	
		intersections = intersections.concat(Intersect.ellipseline(ellipse, Line.fromPoints(
			new Coord2D(rect.rect.right, rect.rect.top),
			new Coord2D(rect.rect.right, rect.rect.bottom))));
	
		intersections = intersections.concat(Intersect.ellipseline(ellipse, Line.fromPoints(
			new Coord2D(rect.rect.right, rect.rect.bottom),
			new Coord2D(rect.rect.left, rect.rect.bottom))));
	
		intersections = intersections.concat(Intersect.ellipseline(ellipse, Line.fromPoints(
			new Coord2D(rect.rect.left, rect.rect.bottom),
			new Coord2D(rect.rect.left, rect.rect.top))));
	
		return intersections;
	},

	bezierrect: function(bezier, rect) {
		var intersections = [];
	
		intersections = intersections.concat(Intersect.bezierline(bezier, Line.fromPoints(
			new Coord2D(rect.rect.left, rect.rect.top),
			new Coord2D(rect.rect.right, rect.rect.top))));
	
		intersections = intersections.concat(Intersect.bezierline(bezier, Line.fromPoints(
			new Coord2D(rect.rect.right, rect.rect.top),
			new Coord2D(rect.rect.right, rect.rect.bottom))));
	
		intersections = intersections.concat(Intersect.bezierline(bezier, Line.fromPoints(
			new Coord2D(rect.rect.right, rect.rect.bottom),
			new Coord2D(rect.rect.left, rect.rect.bottom))));
	
		intersections = intersections.concat(Intersect.bezierline(bezier, Line.fromPoints(
			new Coord2D(rect.rect.left, rect.rect.bottom),
			new Coord2D(rect.rect.left, rect.rect.top))));
	
		return intersections;
	},

	circlerect: function(circle, rect) {
		var intersections = [];
	
		intersections = intersections.concat(Intersect.circleline(circle, Line.fromPoints(
			new Coord2D(rect.rect.left, rect.rect.top),
			new Coord2D(rect.rect.right, rect.rect.top))));
	
		intersections = intersections.concat(Intersect.circleline(circle, Line.fromPoints(
			new Coord2D(rect.rect.right, rect.rect.top),
			new Coord2D(rect.rect.right, rect.rect.bottom))));
	
		intersections = intersections.concat(Intersect.circleline(circle, Line.fromPoints(
			new Coord2D(rect.rect.right, rect.rect.bottom),
			new Coord2D(rect.rect.left, rect.rect.bottom))));
	
		intersections = intersections.concat(Intersect.circleline(circle, Line.fromPoints(
			new Coord2D(rect.rect.left, rect.rect.bottom),
			new Coord2D(rect.rect.left, rect.rect.top))));
	
		return intersections;
	}

};