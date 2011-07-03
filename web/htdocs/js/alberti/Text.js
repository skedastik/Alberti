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
 * Text.js
 * extends SvgObject
 * 
 * Text shape.
 * 
 * * */

Text.elementTag = "text";
 
function Text(svgNode) {
	Text.baseConstructor.call(this, svgNode ? svgNode : Text.elementTag);
}
Util.extend(Text, SvgObject);

Text.prototype.initialize = function() {
	this.anchor = new Coord2D();
	this.fontFamily = "";
	this.fontStyle = "";
	this.fontSize = "";
	this.textData = "";
	this.justification = "";              // "left", "middle", "right"
	
	this.textNode = null;
};

// Override SvgObject::generate since we need to generate a text node.
Text.prototype.generate = function() {
	Text.superclass.generate.call(this);
	this.textNode = document.createTextNode(this.textData);
	this.svgNode.appendChild(this.textNode);
	
	return this;
};

Text.prototype.push = function() {
	this.set("x", this.anchor.x);
	this.set("y", this.anchor.y);
	this.set("font-family", this.fontFamily);
	this.set("font-style", this.fontStyle);
	this.set("font-size", this.fontSize);
	this.set("text-anchor", this.justification);
	this.textNode.data = this.textData;
};
