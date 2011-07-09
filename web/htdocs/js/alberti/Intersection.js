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
 * Intersection.js
 * 
 * Calculates intersections between Shapes and performs nearest-neighbor 
 * queries on intersection points.
 * 
 * USAGE
 * 
 * Create a new Intersection object and call testShape, passing a query shape, 
 * an array of shapes to test against, and an action flag. 'null' entries in
 * the shape array are safe and will simply be ignored. The action flag takes 
 * any of the following values:
 * 
 *    Intersection.insertFlag
 *    Intersection.deleteFlag
 *    Intersection.bulkDeleteFlag
 *    Intersection.nopFlag
 * 
 * If action is insertFlag, each intersection point found will be added to an
 * internal structure. If deleteFlag, points will be deleted. If 
 * bulkDeleteFlag, points will be marked for deletion and deleted at the next
 * call to Intersection::flush. If nopFlag, the internal set of intersection 
 * points will not be modified. testShape returns an array of shapes that 
 * intersect with the query shape (empty array if no intersections were 
 * found).
 * 
 * Nearest neighbor searches can be performed on the current set of 
 * intersection points with the getNearbyIntersection method.
 * 
 * * */

Intersection.searchRadius = 20;

Intersection.insertFlag     = 0;
Intersection.deleteFlag     = 1;
Intersection.bulkDeleteFlag = 2;
Intersection.nopFlag        = 3;

function Intersection() {
	// The Zap object adjusts the search radius scale depending on the current 
	// zoom factor, so the spatial hash's bucket width should be large enough 
	// to accomodate for the minimum zoom factor.
	this.points = new SpatialHash((Intersection.searchRadius / Zap.zoomFactors[Zap.minZoomLevel]) * 2);
	
	// Array of points that are marked for deletion. These points will be
	// removed from the above hash at the next call to Intersection::flush.
	this.deletedPoints = [];

	this.searchRadiusScale = 1.0;
}

// Test newShape for intersections with all Shapes in shapeArray, and take
// appropriate action depending on action flag.
Intersection.prototype.testShape = function(newShape, shapeArray, action) {
	var intersectors = [];
	
	for (var i = 0, saLen = shapeArray.length; i < saLen; i++) {
		var shape = shapeArray[i];
		
		if (shape) {
			var intersections = [];
		
			if (shape.shapeName < newShape.shapeName) {
				var funcName = shape.shapeName + newShape.shapeName;
				if (Intersection[funcName]) {
					intersections = Intersection[funcName](shape, newShape);
				}
			} else {
				var funcName = newShape.shapeName + shape.shapeName;
				if (Intersection[funcName]) {
					intersections = Intersection[funcName](newShape, shape);
				}
			}
		
			if (intersections.length > 0) {
				intersectors.push(shape);
			}
		
			switch (action) {
				case Intersection.insertFlag:
					for (var j = 0, iLen = intersections.length; j < iLen; j++) {
						this.points.insert(intersections[j]);
					}
					break;
			
				case Intersection.deleteFlag:
					for (var j = 0, iLen = intersections.length; j < iLen; j++) {
						this.points.remove([intersections[j]]);
					}
					break;
			
				case Intersection.bulkDeleteFlag:
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
Intersection.prototype.getNearbyIntersection = function(coord) {
	var qradius = Intersection.searchRadius / this.searchRadiusScale;
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

Intersection.prototype.flush = function() {
	this.points.remove(this.deletedPoints);
	this.deletedPoints = [];
};

// Set the search radius scale. The search radius is divided by this number.
Intersection.prototype.setSearchRadiusScale = function(scale) {
	this.searchRadiusScale = scale;
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
Intersection.lineline = function(l1, l2) {
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

Intersection.earcline = function(arc, line) {
	var intersections = [];
	
	if (arc.coeffs.length > 0) {
		// Coefficients of conic equation describing ellipse
		var a = arc.coeffs[0], b = arc.coeffs[1], c = arc.coeffs[2], d = arc.coeffs[3], f = arc.coeffs[4], g = arc.coeffs[5];
		
		// Coefficients of line equation ix + jy = k
		var i = line.p2.y - line.p1.y;
		var j = line.p1.x - line.p2.x;
		var k = i * line.p1.x + j * line.p1.y;
		
		if (j == 0) {
			
		} else {
			var m = -i / j;
			k = k / j;
			
			var A = a + 2*b*m + c*m*m;
			var B = 2*(b*k + c*m*k + d + f*m);
			var C = c*k*k + 2*f*k + g;
			
			var discriminant = B*B - 4*A*C;
			
			if (discriminant == 0) {
				var x = -B / (2*A);
				var y = m*x + k;
				
				intersections[0] = new Coord2D(x, y);
			} else if (discriminant > 0) {
				var rootd = Math.sqrt(discriminant);
				var x1 = (-B + rootd) / (2*A);
				var x2 = (-B - rootd) / (2*A);
				var y1 = m*x1 + k;
				var y2 = m*x2 + k;
				
				intersections[0] = new Coord2D(x1, y1);
				intersections[1] = new Coord2D(x2, y2);
			}
		}
	}
	
	return intersections;
};

// http://stackoverflow.com/questions/1073336/circle-line-collision-detection
Intersection.carcline = function(arc, line) {
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
	
	var dx2 = line.p1.x - arc.center.x;
	var dy2 = line.p1.y - arc.center.y;
	
	var a = dx1 * dx1 + dy1 * dy1;
	var b = 2 * (dx2 * dx1 + dy2 * dy1);
	var c = (dx2 * dx2 + dy2 * dy2) - arc.radius * arc.radius;
	
	var discriminant = b * b - 4 * a * c;
	
	if (discriminant >= 0) {
		var rootd = Math.sqrt(discriminant);
		
		var t1 = (-b + rootd) / (2 * a);
		var t2 = (-b - rootd) / (2 * a);
		
		var points = [];
		points[0] = (t1 >= 0 && t1 <= 1) ? new Coord2D(line.p1.x + t1 * dx1, line.p1.y + t1 * dy1) : null;
		points[1] = (t2 >= 0 && t2 <= 1) ? new Coord2D(line.p1.x + t2 * dx1, line.p1.y + t2 * dy1) : null;

		// Now that we have intersections of circle and line, we must 
		// determine if they are on the arc.

		var endAngle = arc.sa + arc.da;
		
		for (var i = 0; i < (discriminant > 0 ? 2 : 1); i++) {
			if (points[i] && Util.angleIsBetweenAngles(arc.center.angleTo(points[i]), arc.sa, endAngle)) {
				intersections.push(points[i]);
			}
		}
	}
	
	return intersections;
};

// http://paulbourke.net/geometry/2circle/
Intersection.carccarc = function(arc1, arc2) {
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
	
	var points = [];
	
	if (d < rsum && d > rdiff) {
		var a = (r1Squared - r2Squared + d * d) / (2 * d);
		var h = Math.sqrt(r1Squared - a * a);
		
		var aratio = a / d;
		var hratio = h / d;
		
		var newdx = hratio * dx;
		var newdy = hratio * dy;
	
		var p2 = new Coord2D(arc1.center.x + aratio * dx, arc1.center.y + aratio * dy);
		points[0] = new Coord2D(p2.x + newdy, p2.y - newdx);
		points[1] = new Coord2D(p2.x - newdy, p2.y + newdx);
			
	} else if (d != 0 && (Util.equals(rsum, d) || (Util.equals(rdiff, d)))) {
		var rratio = arc1.radius / d;
		points[0] = new Coord2D(arc1.center.x + rratio * dx, arc1.center.y + rratio * dy);
	}
	
	// Now that we have intersections of circle and circle, we must determine 
	// if they are on both circle's arcs.
	
	if (points.length > 0) {
		var endAngle1 = arc1.sa + arc1.da;
		var endAngle2 = arc2.sa + arc2.da;
		
		for (var i = 0, pLen = points.length; i < pLen; i++) {
			if (Util.angleIsBetweenAngles(arc1.center.angleTo(points[i]), arc1.sa, endAngle1)
				&& Util.angleIsBetweenAngles(arc2.center.angleTo(points[i]), arc2.sa, endAngle2)) {
				intersections.push(points[i]);
			}
		}
	}
	
	return intersections;
};

Intersection.linerect = function(line, rect) {
	var intersections = [];
	
	intersections = intersections.concat(Intersection.lineline(line, Line.fromPoints(
		new Coord2D(rect.rect.left, rect.rect.top),
		new Coord2D(rect.rect.right, rect.rect.top))));
		
	intersections = intersections.concat(Intersection.lineline(line, Line.fromPoints(
		new Coord2D(rect.rect.right, rect.rect.top),
		new Coord2D(rect.rect.right, rect.rect.bottom))));
		
	intersections = intersections.concat(Intersection.lineline(line, Line.fromPoints(
		new Coord2D(rect.rect.right, rect.rect.bottom),
		new Coord2D(rect.rect.left, rect.rect.bottom))));
		
	intersections = intersections.concat(Intersection.lineline(line, Line.fromPoints(
		new Coord2D(rect.rect.left, rect.rect.bottom),
		new Coord2D(rect.rect.left, rect.rect.top))));
	
	return intersections;
};

Intersection.carcrect = function(carc, rect) {
	var intersections = [];
	
	intersections = intersections.concat(Intersection.carcline(carc, Line.fromPoints(
		new Coord2D(rect.rect.left, rect.rect.top),
		new Coord2D(rect.rect.right, rect.rect.top))));
	
	intersections = intersections.concat(Intersection.carcline(carc, Line.fromPoints(
		new Coord2D(rect.rect.right, rect.rect.top),
		new Coord2D(rect.rect.right, rect.rect.bottom))));
	
	intersections = intersections.concat(Intersection.carcline(carc, Line.fromPoints(
		new Coord2D(rect.rect.right, rect.rect.bottom),
		new Coord2D(rect.rect.left, rect.rect.bottom))));
	
	intersections = intersections.concat(Intersection.carcline(carc, Line.fromPoints(
		new Coord2D(rect.rect.left, rect.rect.bottom),
		new Coord2D(rect.rect.left, rect.rect.top))));
	
	return intersections;
};
