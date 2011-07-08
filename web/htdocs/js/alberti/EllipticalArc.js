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
 * EllipticalArc.js
 * extends EllipticalShape
 * 
 * Elliptical arc shape, defined by a center point, x-radius, y-radius,
 * x-axis-rotation, start angle, and delta angle (angles in radians).
 * 
 * * */

EllipticalArc.elementTag = "path";
EllipticalArc.shapeName = "earc";
 
function EllipticalArc(svgNode) {
	EllipticalArc.baseConstructor.call(this, svgNode ? svgNode : EllipticalArc.elementTag, EllipticalArc.shapeName);
}
Util.extend(EllipticalArc, EllipticalShape);

EllipticalArc.prototype.initialize = function() {
	EllipticalArc.superclass.initialize.call(this);
	this.sa = 0;                                    // Start angle
	this.da = 0;                                    // Delta angle
};

EllipticalArc.prototype.push = function() {
	// Calculate elliptical arc endpoint params needed by SVG's arc path format
	var m = this.getPointGivenAngle(this.sa);
	var n = this.getPointGivenAngle(this.sa + this.da);
	
	// Determine large-arc and sweep flag SVG path params based on delta angle
	var large = Math.abs(this.da) > pi ? 1 : 0;
	var sweep = this.da > 0 ? 1 : 0;
	
	this.set("d",
		"M"+Util.roundToDecimal(m.x, Alberti.precision)+","+Util.roundToDecimal(m.y, Alberti.precision)
		+" A"+Util.roundToDecimal(this.rx, Alberti.precision)+","+Util.roundToDecimal(this.ry, Alberti.precision)+", "
		+Util.roundToDecimal(Util.radToDeg(this.xrot), Alberti.precision)+", "
		+large+","+sweep+", "
		+Util.roundToDecimal(n.x, Alberti.precision)+","+Util.roundToDecimal(n.y, Alberti.precision)
	);
	
	this.set("berti:cx", this.center.x, Alberti.customns);
	this.set("berti:cy", this.center.y, Alberti.customns);
	this.set("berti:rx", this.rx, Alberti.customns);
	this.set("berti:ry", this.ry, Alberti.customns);
	this.set("berti:xrot", this.xrot, Alberti.customns);
	this.set("berti:sa", this.sa, Alberti.customns);
	this.set("berti:da", this.da, Alberti.customns);
};

EllipticalArc.prototype.pull = function() {
	EllipticalArc.superclass.pull.call(this);
	this.sa = this.get("sa", Alberti.customns);
	this.da = this.get("da", Alberti.customns);
};

EllipticalArc.prototype.clone = function() {
	var ea = new EllipticalArc();
	ea.center = this.center.clone();
	ea.rx = this.rx;
	ea.ry = this.ry;
	ea.xrot = this.xrot;
	ea.sa = this.sa;
	ea.da = this.da;
	
	return ca;
};
