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
 * Group.js
 * extends SvgContainer
 * 
 * SVG <g> node.
 * 
 * * */

Group.elementTag = "g";

function Group(svgNode) {
	Group.baseConstructor.call(this, svgNode ? svgNode : Group.elementTag);
}
Util.extend(Group, SvgContainer);

Group.prototype.initialize = function() {
	this.position = new Coord2D(0, 0);
	this.scale = 1.0;
};

// Translates group from current position
Group.prototype.translateRelative = function(dx, dy) {
	this.position.x += dx;
	this.position.y += dy;
};

// Positions group relative to parent coordinate system's origin
Group.prototype.positionAbsolute = function(x, y) {
	this.position.x = x;
	this.position.y = y;
};

// Sets scale relative to parent coordinate system's scale
Group.prototype.scaleAbsolute = function(scale) {
	this.scale = scale;
};

Group.prototype.push = function() {
	this.set("transform",
		(this.position.x != 0 || this.position.y != 0 ? "translate("+this.position.x+","+this.position.y+")" : "")
		+ (this.scale != 1.0 ? " scale("+this.scale+")" : ""));
};

Group.prototype.pull = function() {
	var transform = this.get("transform");
	var translate = null;
	var scale = null;
	
	if (transform) {
		translate = transform.match(/translate\((.+),(.+)\)/);
		scale = transform.match(/scale\((.+)\)/);
	}
	
	this.position = translate ? new Coord2D(translate[1], translate[2]) : new Coord2D(0, 0);
	this.scale = scale ? scale[1] : 1.0;
};
