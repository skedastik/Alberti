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
 * FastImage.js
 * extends EventHandler
 * 
 * Hardware-accelerated HTML image transformations via -webkit-transform's 
 * "translate3d" and "scale3d" CSS primitives. The image is anchored at its 
 * center, at the point (x,y) and scaled uniformly by a scale factor. Its 
 * opacity, from 0 to 1.0, may also be adjusted.
 * 
 * * */
 
function FastImage(imgNode) {
	FastImage.baseConstructor.call(this);
	this.imgNode = imgNode;
	
	this.x = 0;
	this.y = 0;
	this.scale = 1.0;
	this.opacity = imgNode.style.opacity !== "" ? parseFloat(imgNode.style.opacity) : 1;
	this.hidden = imgNode.style.display == "none" ? true : false;
	
	// Center the image in the window
	this.updateOffset();
	
	this.registerListener("load", this.imgNode, false);
}
Util.extend(FastImage, EventHandler);

// Set the src of the FastImage's img node to the given URL
FastImage.prototype.setSource = function(url) {
	this.imgNode.src = url;
};

// Set the src of the FastImage's img node to the given data URL
FastImage.prototype.setSourceToDataUrl = function(dataUrl) {
	Util.assert(dataUrl.match(/^data:/), "Invalid data URL passed to AlbertiDocument::setUnderlayImage");
	
	this.setSource(dataUrl);
};

FastImage.prototype.isHidden = function() {
	return this.hidden;
};

FastImage.prototype.hide = function() {
	if (!this.hidden) {
		this.hidden = true;
		this.imgNode.style.display = "none";
	}
};

FastImage.prototype.show = function() {
	if (this.hidden) {
		this.hidden = false;
		this.imgNode.style.display = "";
	}
};

FastImage.prototype.update = function() {
	var pos = Math.round(this.x + this.adjustx)+"px, "+Math.round(this.y + this.adjusty)+"px";
	
	this.imgNode.style.cssText = "-webkit-transform: translate3d("+pos+", 0) scale3d("+this.scale+", "+this.scale+", 1); "
	    +"-moz-transform: translate("+pos+") scale("+this.scale+"); "
		+"-o-transform: translate("+pos+") scale("+this.scale+"); "
		+(this.opacity != 1.0 ? "opacity: "+this.opacity+"; " : "")
		+(this.hidden ? "display: none" : "");
};

FastImage.prototype.updateOffset = function() {
	this.adjustx = Alberti.halfOriginalWindowWidth - this.imgNode.width / 2;
	this.adjusty = Alberti.halfOriginalWindowHeight - this.imgNode.height / 2;
};

FastImage.prototype.translateRelative = function(dx, dy) {
	this.x += dx;
	this.y += dy;
};

FastImage.prototype.load = function(evt) {
	// Make sure the new image is centered in the window
	this.updateOffset();
	this.update();
};
