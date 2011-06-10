/*
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
