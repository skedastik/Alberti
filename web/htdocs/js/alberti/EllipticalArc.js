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
 * extends Shape
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
Util.extend(EllipticalArc, Shape);

EllipticalArc.prototype.initialize = function() {
	this.center = new Coord2D(0, 0);
	this.rx = 0;                                    // X-Radius
	this.ry = 0;                                    // Y-Radius
	this.xrot = 0;                                  // X-Axis Rotation
	this.sa = 0;                                    // Start angle
	this.da = 0;                                    // Delta angle
};

EllipticalArc.prototype.push = function() {
	var ea = this.sa + this.da;
	
	// Use general parametric form of ellipse to calculate m and n, the 
	// "endpoints" of the arc, needed for SVG's arc path format. But before we
	// do that, we need to define parameter t in terms of the start and delta
	// angles, respectively, using:
	//
	//    t = arctan(a*tan(theta)/b)
	//
	
	// var tm = atan((this.rx / this.ry) * tan(this.sa));
	// var tn = atan((this.rx / this.ry) * tan(this.sa + this.da));
	var tm = this.sa;
	var tn = this.sa + this.da;
	
	var m = new Coord2D(
		this.center.x + this.rx * cos(tm) * cos(this.xrot) - this.ry * sin(tm) * sin(this.xrot),
		this.center.y + this.rx * cos(tm) * sin(this.xrot) + this.ry * sin(tm) * cos(this.xrot)
	);
		
	var n = new Coord2D(
		this.center.x + this.rx * cos(tn) * cos(this.xrot) - this.ry * sin(tn) * sin(this.xrot),
		this.center.y + this.rx * cos(tn) * sin(this.xrot) + this.ry * sin(tn) * cos(this.xrot)
	);
	
	// Determine large-arc and sweep flag SVG path params based on delta angle
	var large = Math.abs(this.da) > Math.PI ? 1 : 0;
	var sweep = this.da > 0 ? 1 : 0;
	
	this.set("d",
		"M"+Util.roundToDecimal(m.x, Alberti.precision)+","+Util.roundToDecimal(m.y, Alberti.precision)
		+" A"+Util.roundToDecimal(this.rx, Alberti.precision)+","+Util.roundToDecimal(this.ry, Alberti.precision)+", "
		+Util.roundToDecimal(Util.radToDeg(this.xrot), Alberti.precision)+", "
		+large+","+sweep+", "
		+Util.roundToDecimal(n.x, Alberti.precision)+", "+Util.roundToDecimal(n.y, Alberti.precision)
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
	this.center = new Coord2D(this.get("cx", Alberti.customns), this.get("cy", Alberti.customns));
	this.rx = this.get("rx", Alberti.customns);
	this.ry = this.get("ry", Alberti.customns);
	this.xrot = this.get("xrot", Alberti.customns);
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
