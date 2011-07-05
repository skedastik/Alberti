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
 * CircleArc.js
 * extends Shape
 * 
 * Circular arc shape, defined by a center point, radius, start angle, and
 * delta angle. The delta form allows us to orient the zero angle as desired, 
 * thereby avoiding the sign inversion imposed by the default coordinate 
 * system (0 degrees pointing right).
 * 
 * * */

CircleArc.elementTag = "path";
CircleArc.shapeName = "carc";
 
function CircleArc(svgNode) {
	CircleArc.baseConstructor.call(this, svgNode ? svgNode : CircleArc.elementTag, CircleArc.shapeName);
}
Util.extend(CircleArc, Shape);

CircleArc.prototype.initialize = function() {
	this.center = new Coord2D(0, 0);
	this.radius = 0;
	this.sa = 0;                                // Start angle
	this.da = 0;                                // Delta angle
};

CircleArc.prototype.push = function() {
	var extentAngle = this.sa + this.da;
	
	// m and n are the "endpoints" of the arc, needed for SVG's arc path format
	var m = new Coord2D(
		this.center.x + this.radius * cos(this.sa),
		this.center.y + this.radius * sin(this.sa)
	);
		
	var n = new Coord2D(
		this.center.x + this.radius * cos(extentAngle),
		this.center.y + this.radius * sin(extentAngle)
	);
	
	// Determine large-arc and sweep flag SVG path params based on delta angle
	var large = Math.abs(this.da) > Math.PI ? 1 : 0;
	var sweep = this.da > 0 ? 1 : 0;
	
	this.set("d", "M"+m.x+","+m.y+" A"+this.radius+","+this.radius+", "
		+this.sa+","+large+","+sweep+", "+n.x+", "+n.y);
	
	this.set("berti:cx", this.center.x, Alberti.customns);
	this.set("berti:cy", this.center.y, Alberti.customns);
	this.set("berti:r", this.radius, Alberti.customns);
	this.set("berti:sa", this.sa, Alberti.customns);
	this.set("berti:da", this.da, Alberti.customns);
};

CircleArc.prototype.pull = function() {
	this.center = new Coord2D(this.get("cx", Alberti.customns), this.get("cy", Alberti.customns));
	this.radius = this.get("r", Alberti.customns);
	this.sa = this.get("sa", Alberti.customns);
	this.da = this.get("da", Alberti.customns);
};

CircleArc.prototype.clone = function() {
	var ca = new CircleArc();
	ca.center = this.center.clone();
	ca.radius = this.radius;
	ca.sa = this.sa;
	ca.da = this.da;
	
	return ca;
};
