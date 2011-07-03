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
 * Rect2D.js
 * 
 * A 2D rectangle, defined by left, top, right, bottom.
 * 
 * * */
 
function Rect2D(left, top, right, bottom) {
	if (arguments.length > 3) {
		this.left = left;
		this.top = top;
		this.right = right;
		this.bottom = bottom;
	}
}

Rect2D.prototype.clone = function() {
	var r = new Rect2D();
	r.left = this.left;
	r.top = this.top;
	r.right = this.right;
	r.bottom = this.bottom;
	
	return r;
};

// Define a rectangle from two points describing opposite corners of the 
// rectangle.
Rect2D.fromPoints = function(p1, p2) {
	return new Rect2D(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y), Math.max(p1.x, p2.x), Math.max(p1.y, p2.y));
};

// Returns true if this rect intersects the rect passed in
Rect2D.prototype.intersectsRect = function(rect) {
	return !(rect.left > this.right || rect.right < this.left || rect.top > this.bottom || rect.bottom < this.top);
};

// Returns true if this rect encloses the rect passed in
Rect2D.prototype.enclosesRect = function(rect) {
	return this.left < rect.left && this.right > rect.right && this.top < rect.top && this.bottom > rect.bottom;
};

Rect2D.prototype.toString = function() {
	return "("+this.left+", "+this.top+", "+this.right+", "+this.bottom+")";
};
