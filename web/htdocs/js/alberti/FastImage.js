/*
 * FastImage.js
 * 
 * Hardware-accelerated HTML image transformations via -webkit-transform's 
 * "translate3d" and "scale3d" CSS primitives. The image is anchored at its 
 * center, at the point (x,y) and scaled uniformly by a scale factor. Its 
 * opacity, from 0 to 1.0, may also be adjusted.
 * 
 * * */
 
function FastImage(imgNode) {
	this.imgNode = imgNode;
	
	this.x = 0;
	this.y = 0;
	this.scale = 1.0;
	this.opacity = 1.0;
	
	this.adjustx = Alberti.halfOriginalWindowWidth - this.imgNode.width / 2;
	this.adjusty = Alberti.halfOriginalWindowHeight - this.imgNode.height / 2;
}

FastImage.prototype.update = function() {
	var pos = Math.round(this.x + this.adjustx)+"px, "+Math.round(this.y + this.adjusty)+"px";
	
	this.imgNode.style.cssText = "-webkit-transform: translate3d("+pos+", 0) scale3d("+this.scale+", "+this.scale+", 1); "
	    +"-moz-transform: translate("+pos+") scale("+this.scale+"); "
		+"-o-transform: translate("+pos+") scale("+this.scale+")"
		+(this.opacity != 1.0 ? "; opacity: "+this.opacity+";" : "");
};

FastImage.prototype.translateRelative = function(dx, dy) {
	this.x += dx;
	this.y += dy;
};
