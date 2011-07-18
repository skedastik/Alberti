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
 * points will not be modified. testIntersections returns an array containing
 * two arrays: the first being an array of shapes that intersect with the 
 * query shape, the second, an array of all intersection points. These arrays 
 * will be empty if no intersections were found.
 * 
 * Tangency
 * 
 * Call testTangencies in the same manner as testIntersections above.
 * 
 * Searching Snap Points
 * 
 * Nearest neighbor searches can be performed on the current set of snap 
 * points with the getNearestNeighbor method.
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

// Test newShape for intersections with all Shapes in shapeArray
SnapPoints.prototype.testIntersections = function(newShape, shapeArray, action) {
	return this.test(Intersect, newShape, shapeArray, action);
};

// Test newShape for tangencies with all Shapes in shapeArray (not the same as
// a single intersection--see Tangency.js for details).
SnapPoints.prototype.testTangencies = function(newShape, shapeArray, action) {
	return this.test(Tangency, newShape, shapeArray, action);
};

// Test one shape against another using given geometry class and take 
// appropriate action depending on action flag. The geometry class' methods
// should consist of two shape names ordered alphabetically w/ shape args in
// respective order.
SnapPoints.prototype.test = function(geomClass, newShape, shapeArray, action) {
	var intersectors = [];
	var allPoints = [];
	
	for (var i = 0, saLen = shapeArray.length; i < saLen; i++) {
		var shape = shapeArray[i];
		
		if (shape) {
			var intersections = [];
		
			if (shape.shapeName < newShape.shapeName) {
				var funcName = shape.shapeName + newShape.shapeName;
				if (geomClass[funcName]) {
					intersections = geomClass[funcName](shape, newShape);
				}
			} else {
				var funcName = newShape.shapeName + shape.shapeName;
				if (geomClass[funcName]) {
					intersections = geomClass[funcName](newShape, shape);
				}
			}
		
			if (intersections.length > 0) {
				intersectors.push(shape);
				allPoints = allPoints.concat(intersections);
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
	
	return [intersectors, allPoints];
};

// Returns the closest intersection within a reasonable distance of the the 
// Coord2D passed in, optionally excluding a specified coord. Returns null if 
// none are within distance.
SnapPoints.prototype.getNearestNeighbor = function(coord, excludeCoord) {
	var qradius = Alberti.snapRadius / this.snapRadiusScale;
	var nearCoords = this.points.search(coord, qradius);
	
	var nearestCoord = null;
	var bestDistance = Infinity;
	
	for (i = 0, ncLen = nearCoords.length; i < ncLen; i++) {
		if (!excludeCoord || !nearCoords[i].isEqual(excludeCoord)) {
			var dist = coord.distanceTo(nearCoords[i]);
		
			if (dist < bestDistance) {
				nearestCoord = nearCoords[i];
				bestDistance = dist;
			}
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
