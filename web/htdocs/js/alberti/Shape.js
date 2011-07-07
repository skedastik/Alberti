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
 * Shape.js
 * extends SvgObject
 * 
 * Abstract shape class. Each shape has a unique 'sid' identifier string.
 * 
 * TODO
 * 
 * Some Shape objects push Alberti-specific attributes (such as "berti:sa" for
 * a CircleArc). These attributes have no effect at runtime but serve to
 * serialize Alberti-specific data. As such, they should only be pushed prior
 * to serialization via a 'serialize' method.
 * 
 * * */

Shape.sidCounter = 1;                       // Used to generate unique Shape sid's
 
function Shape(svgTagOrNode, shapeName) {
	Shape.baseConstructor.call(this, svgTagOrNode);
	this.shapeName = shapeName;
	this.sid = "s"+(Shape.sidCounter++);              // Assign a unique sid to the shape
}
Util.extend(Shape, SvgObject);

// Returns a Rect2D bounding the shape. May need to override for some shapes,
// as some SVG implementations do not return correct results for all shapes.
Shape.prototype.getBoundingBox = function() {
	var svgRect = this.svgNode.getBBox();
	
	return new Rect2D(
		Util.roundToDecimal(svgRect.x, Alberti.tolerance),
		Util.roundToDecimal(svgRect.y, Alberti.tolerance),
		Util.roundToDecimal(svgRect.x + svgRect.width, Alberti.tolerance),
		Util.roundToDecimal(svgRect.y + svgRect.height, Alberti.tolerance));
};

// Display the shape as selected
Shape.prototype.displaySelected = function() {
	this.set("class", "selected");
};

// Display the shape as deselected
Shape.prototype.displayDeselected = function() {
	this.set("class", "");
};

// Overridden method should return new Shape w/ same properties w/o calling generate
Shape.prototype.clone = function(arguments) {
	throw "Un-overriden 'clone' method invoked on Shape "+this.shapeName;
};
