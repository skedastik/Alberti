/*
 * Rectangle.js
 * 
 * Rectangle shape, defined by left, right, top, bottom.
 * 
 * * */
 
Rectangle.elementTag = "rect";
Rectangle.shapeName = "rect";

function Rectangle(svgNode) {
	Rectangle.baseConstructor.call(this, svgNode ? svgNode : Rectangle.elementTag, Rectangle.shapeName);
}
Util.extend(Rectangle, Shape);

Rectangle.prototype.initialize = function() {
	this.rect = new Rect2D(0, 0, 0, 0);
};

Rectangle.prototype.push = function() {
	this.set("x", this.rect.left);
	this.set("y", this.rect.top);
	this.set("width", this.rect.right - this.rect.left);
	this.set("height", this.rect.bottom - this.rect.top);
};

// Returns a new Rectangle defined by the given Rect2D, without calling generate().
Rectangle.fromRect2D = function(rect2d) {
	var newRect = new Rectangle();
	newRect.rect.left = rect2d.left;
	newRect.rect.top = rect2d.top;
	newRect.rect.right = rect2d.right;
	newRect.rect.bottom = rect2d.bottom;
	
	return newRect;
}

Rectangle.prototype.clone = function() {
	var r = new Rectangle();
	r.rect = this.rect.clone();
	
	return r;
};
