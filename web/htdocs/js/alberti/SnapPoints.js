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
 * SnapPoints.js
 * 
 * Manages snap points.
 * 
 * USAGE
 * 
 * Intersections
 * 
 * Call testIntersections, passing a query shape, an array of shapes to test 
 * against, and an action flag. 'null' entries in the shape array are safe and
 * will simply be ignored. The action flag takes any of the following values:
 * 
 *    SnapPoints.insertFlag
 *    SnapPoints.deleteFlag
 *    SnapPoints.bulkDeleteFlag
 *    SnapPoints.nopFlag
 * 
 * If action is insertFlag, each intersection point found will be added to an
 * internal structure. If deleteFlag, points will be deleted. If 
 * bulkDeleteFlag, points will be marked for deletion and deleted at the next
 * call to SnapPoints::flush. If nopFlag, the internal set of intersection 
 * points will not be modified. testIntersections returns an array of shapes that 
 * intersect with the query shape (empty array if no intersections were 
 * found).
 * 
 * Nearest neighbor searches can be performed on the current set of 
 * intersection points with the getNearestNeighbor method.
 * 
 * * */

SnapPoints.insertFlag     = 0;
SnapPoints.deleteFlag     = 1;
SnapPoints.bulkDeleteFlag = 2;
SnapPoints.nopFlag        = 3;

function SnapPoints() {
	// The Zap object adjusts the search radius scale depending on the current 
	// zoom factor, so the spatial hash's bucket width should be large enough 
	// to accomodate for the minimum zoom factor.
	this.points = new SpatialHash((Alberti.snapRadius / Zap.zoomFactors[Zap.minZoomLevel]) * 2);
	
	// Array of points that are marked for deletion. These points will be
	// removed from the above hash at the next call to SnapPoints::flush.
	this.deletedPoints = [];

	this.snapRadiusScale = 1.0;
}

// Test newShape for intersections with all Shapes in shapeArray, and take
// appropriate action depending on action flag.
SnapPoints.prototype.testIntersections = function(newShape, shapeArray, action) {
	var intersectors = [];
	
	for (var i = 0, saLen = shapeArray.length; i < saLen; i++) {
		var shape = shapeArray[i];
		
		if (shape) {
			var intersections = [];
		
			if (shape.shapeName < newShape.shapeName) {
				var funcName = "isect_" + shape.shapeName + newShape.shapeName;
				if (SnapPoints[funcName]) {
					intersections = SnapPoints[funcName](shape, newShape);
				}
			} else {
				var funcName = "isect_" + newShape.shapeName + shape.shapeName;
				if (SnapPoints[funcName]) {
					intersections = SnapPoints[funcName](newShape, shape);
				}
			}
		
			if (intersections.length > 0) {
				intersectors.push(shape);
			}
		
			switch (action) {
				case SnapPoints.insertFlag:
					for (var j = 0, iLen = intersections.length; j < iLen; j++) {
						this.points.insert(intersections[j]);
					}
					break;
			
				case SnapPoints.deleteFlag:
					for (var j = 0, iLen = intersections.length; j < iLen; j++) {
						this.points.remove([intersections[j]]);
					}
					break;
			
				case SnapPoints.bulkDeleteFlag:
					for (var j = 0, iLen = intersections.length; j < iLen; j++) {
						this.deletedPoints.push(intersections[j]);
					}
					break;
			}
		}
	}
	
	return intersectors;
};

// Returns the closest intersection within a reasonable distance of the the 
// Coord2D passed in, or null if none are within distance.
SnapPoints.prototype.getNearestNeighbor = function(coord) {
	var qradius = Alberti.snapRadius / this.snapRadiusScale;
	var nearCoords = this.points.search(coord, qradius);
	
	var nearestCoord = null;
	var bestDistance = Infinity;
	
	for (i = 0, ncLen = nearCoords.length; i < ncLen; i++) {
		var dist = coord.distanceTo(nearCoords[i]);
		
		if (dist < bestDistance) {
			nearestCoord = nearCoords[i];
			bestDistance = dist;
		}
	}
	
	return nearestCoord ? nearestCoord.clone() : null;
};

SnapPoints.prototype.flush = function() {
	this.points.remove(this.deletedPoints);
	this.deletedPoints = [];
};

// Set the search radius scale. The search radius is divided by this number.
SnapPoints.prototype.setSnapRadiusScale = function(scale) {
	this.snapRadiusScale = scale;
};

/* * * * * * * * * * * * * Intersection methods * * * * * * * * * * * * * * *
 * 
 * Each method's name is a combination of two Shape names ordered alpha-
 * betically, indicating the type of intersection (line-line, line-circle, 
 * etc). Arguments are ordered respectively. Each returns an array of 
 * intersection points (Coord2D's), or empty array if the shapes do not
 * intersect.
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// Big thanks to: http://www.topcoder.com/tc?module=Static&d1=tutorials&d2=geometry2
// Much faster than my crummy slope-intercept algorithm.
SnapPoints.isect_lineline = function(l1, l2) {
	var intersections = [];
	
	var a1 = l1.p2.y - l1.p1.y;
	var b1 = l1.p1.x - l1.p2.x;
	var c1 = a1 * l1.p1.x + b1 * l1.p1.y;
	
	var a2 = l2.p2.y - l2.p1.y;
	var b2 = l2.p1.x - l2.p2.x;
	var c2 = a2 * l2.p1.x + b2 * l2.p1.y;
	
	var det = a1 * b2 - a2 * b1;
	
	if (det != 0) {
		var x0 = (b2 * c1 - b1 * c2) / det;
		var y0 = (a1 * c2 - a2 * c1) / det;
		
		if (Util.between(x0, l1.p1.x, l1.p2.x) && Util.between(y0, l1.p1.y, l1.p2.y)
			&& Util.between(x0, l2.p1.x, l2.p2.x) && Util.between(y0, l2.p1.y, l2.p2.y)) {
			intersections.push(new Coord2D(x0, y0));
		}
	}
	
	return intersections;
};

SnapPoints.isect_earcline = function(arc, line) {
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
	
	if (arc.coeffs.length > 0) {
		var solutions = [];
		
		// Coefficients a, b, c, d, f, and g of conic equation describing ellipse
		var a = arc.coeffs[0], b = arc.coeffs[1], c = arc.coeffs[2], d = arc.coeffs[3], f = arc.coeffs[4], g = arc.coeffs[5];
		
		var x1 = line.p1.x, y1 = line.p1.y;
		var x2 = line.p2.x, y2 = line.p2.y;
		
		var dx = x2 - x1;
		var dy = y2 - y1;
		
		var A = c*y2*y2 - 2*c*y1*y2 + 2*b*x2*y2 - 2*b*x1*y2 + c*y1*y1 - 2*b*x2*y1 + 2*b*x1*y1 + a*x2*x2 - 2*a*x1*x2 + a*x1*x1;
		var B = 2*c*y1*y2 + 2*b*x1*y2 + 2*f*y2 - 2*c*y1*y1 + 2*b*x2*y1 - 4*b*x1*y1 - 2*f*y1 + 2*a*x1*x2 + 2*d*x2 - 2*a*x1*x1 - 2*d*x1;
		var C = c*y1*y1 + 2*b*x1*y1 + 2*f*y1 + a*x1*x1 + 2*d*x1 + g;
		
		var discriminant = B*B - 4*A*C;
		
		if (discriminant == 0) {
			var t = -B / (2*A);			
			
			solutions[0] = (t >= 0 && t <= 1) ? new Coord2D(line.p1.x + t * dx, line.p1.y + t * dy) : null;
			
		} else if (discriminant > 0) {
			var rootd = Math.sqrt(discriminant);
			var t1 = (-B + rootd) / (2*A);
			var t2 = (-B - rootd) / (2*A);
			
			solutions[0] = (t1 >= 0 && t1 <= 1) ? new Coord2D(line.p1.x + t1 * dx, line.p1.y + t1 * dy) : null;
			solutions[1] = (t2 >= 0 && t2 <= 1) ? new Coord2D(line.p1.x + t2 * dx, line.p1.y + t2 * dy) : null;
		}
		
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
	}
	
	return intersections;
};

// http://stackoverflow.com/questions/1073336/circle-line-collision-detection
SnapPoints.isect_carcline = function(arc, line) {
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
	var solutions = [];
	
	var dx1 = line.p2.x - line.p1.x;
	var dy1 = line.p2.y - line.p1.y;
	
	var dx2 = line.p1.x - arc.center.x;
	var dy2 = line.p1.y - arc.center.y;
	
	var a = dx1 * dx1 + dy1 * dy1;
	var b = 2 * (dx2 * dx1 + dy2 * dy1);
	var c = (dx2 * dx2 + dy2 * dy2) - arc.radius * arc.radius;
	
	var discriminant = b * b - 4 * a * c;
	
	if (discriminant == 0) {
		var t = -b / (2 * a);
		
		solutions[0] = (t >= 0 && t <= 1) ? new Coord2D(line.p1.x + t * dx1, line.p1.y + t * dy1) : null;
		
	} else if (discriminant > 0) {
		var rootd = Math.sqrt(discriminant);
		var t1 = (-b + rootd) / (2 * a);
		var t2 = (-b - rootd) / (2 * a);
		
		solutions[0] = (t1 >= 0 && t1 <= 1) ? new Coord2D(line.p1.x + t1 * dx1, line.p1.y + t1 * dy1) : null;
		solutions[1] = (t2 >= 0 && t2 <= 1) ? new Coord2D(line.p1.x + t2 * dx1, line.p1.y + t2 * dy1) : null;
	}
	
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
};

// http://paulbourke.net/geometry/2circle/
SnapPoints.isect_carccarc = function(arc1, arc2) {
	//
	// let d = distance between arcs' centers
	//
	// If d > arc1.radius + arc2.radius, the circles are too far apart to
	// intersect. If d < |arc1.radius - arc2.radius|, one circle is contained
	// in the other and there are no intersections. If d == 0, and the radii
	// are equivalent, the circles are coincident, with an infinite number of
	// intersections.
	//
	// If d == arc1.radius + arc2.radius, or d == |arc1.radius - arc2.radius|, 
	// there is a single intersection.
	// 
	// The Pythagorean theorem and the principle of similar triangles are used
	// to solve for the intersection points.
	//
	var intersections = [];
	
	var d = arc1.center.distanceTo(arc2.center);
	var rsum = arc1.radius + arc2.radius;
	var rdiff = Math.abs(arc1.radius - arc2.radius);
	
	var r1Squared = arc1.radius * arc1.radius;
	var r2Squared = arc2.radius * arc2.radius;
	
	var dx = arc2.center.x - arc1.center.x;
	var dy = arc2.center.y - arc1.center.y;
	
	var solutions = [];
	
	if (d < rsum && d > rdiff) {
		var a = (r1Squared - r2Squared + d * d) / (2 * d);
		var h = Math.sqrt(r1Squared - a * a);
		
		var aratio = a / d;
		var hratio = h / d;
		
		var newdx = hratio * dx;
		var newdy = hratio * dy;
	
		var p2 = new Coord2D(arc1.center.x + aratio * dx, arc1.center.y + aratio * dy);
		solutions[0] = new Coord2D(p2.x + newdy, p2.y - newdx);
		solutions[1] = new Coord2D(p2.x - newdy, p2.y + newdx);
			
	} else if (d != 0 && (Util.equals(rsum, d) || (Util.equals(rdiff, d)))) {
		var rratio = arc1.radius / d;
		solutions[0] = new Coord2D(arc1.center.x + rratio * dx, arc1.center.y + rratio * dy);
	}
	
	// Now that we have intersections of circle and circle, we must determine 
	// if they are on both circle's arcs.
	
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
};

SnapPoints.isect_linerect = function(line, rect) {
	var intersections = [];
	
	intersections = intersections.concat(SnapPoints.isect_lineline(line, Line.fromPoints(
		new Coord2D(rect.rect.left, rect.rect.top),
		new Coord2D(rect.rect.right, rect.rect.top))));
		
	intersections = intersections.concat(SnapPoints.isect_lineline(line, Line.fromPoints(
		new Coord2D(rect.rect.right, rect.rect.top),
		new Coord2D(rect.rect.right, rect.rect.bottom))));
		
	intersections = intersections.concat(SnapPoints.isect_lineline(line, Line.fromPoints(
		new Coord2D(rect.rect.right, rect.rect.bottom),
		new Coord2D(rect.rect.left, rect.rect.bottom))));
		
	intersections = intersections.concat(SnapPoints.isect_lineline(line, Line.fromPoints(
		new Coord2D(rect.rect.left, rect.rect.bottom),
		new Coord2D(rect.rect.left, rect.rect.top))));
	
	return intersections;
};

SnapPoints.isect_carcrect = function(carc, rect) {
	var intersections = [];
	
	intersections = intersections.concat(SnapPoints.isect_carcline(carc, Line.fromPoints(
		new Coord2D(rect.rect.left, rect.rect.top),
		new Coord2D(rect.rect.right, rect.rect.top))));
	
	intersections = intersections.concat(SnapPoints.isect_carcline(carc, Line.fromPoints(
		new Coord2D(rect.rect.right, rect.rect.top),
		new Coord2D(rect.rect.right, rect.rect.bottom))));
	
	intersections = intersections.concat(SnapPoints.isect_carcline(carc, Line.fromPoints(
		new Coord2D(rect.rect.right, rect.rect.bottom),
		new Coord2D(rect.rect.left, rect.rect.bottom))));
	
	intersections = intersections.concat(SnapPoints.isect_carcline(carc, Line.fromPoints(
		new Coord2D(rect.rect.left, rect.rect.bottom),
		new Coord2D(rect.rect.left, rect.rect.top))));
	
	return intersections;
};

SnapPoints.isect_earcrect = function(earc, rect) {
	var intersections = [];
	
	intersections = intersections.concat(SnapPoints.isect_earcline(earc, Line.fromPoints(
		new Coord2D(rect.rect.left, rect.rect.top),
		new Coord2D(rect.rect.right, rect.rect.top))));
	
	intersections = intersections.concat(SnapPoints.isect_earcline(earc, Line.fromPoints(
		new Coord2D(rect.rect.right, rect.rect.top),
		new Coord2D(rect.rect.right, rect.rect.bottom))));
	
	intersections = intersections.concat(SnapPoints.isect_earcline(earc, Line.fromPoints(
		new Coord2D(rect.rect.right, rect.rect.bottom),
		new Coord2D(rect.rect.left, rect.rect.bottom))));
	
	intersections = intersections.concat(SnapPoints.isect_earcline(earc, Line.fromPoints(
		new Coord2D(rect.rect.left, rect.rect.bottom),
		new Coord2D(rect.rect.left, rect.rect.top))));
	
	return intersections;
};
