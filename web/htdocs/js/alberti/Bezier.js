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
 * Bezier.js
 * 
 * A quadratic bezier curve defined by three points.
 * 
 * * */

Bezier.elementTag = "path";
Bezier.shapeName = "bezier";
 
function Bezier(svgNode) {
	Bezier.baseConstructor.call(this, svgNode ? svgNode : Bezier.elementTag, Bezier.shapeName);
}
Util.extend(Bezier, Shape);

Bezier.prototype.initialize = function() {
	this.p1 = new Coord2D(0, 0);
	this.p2 = new Coord2D(0, 0);
	this.p3 = new Coord2D(0, 0);
};

Bezier.prototype.push = function() {
	this.set("d",
		"M"+this.p1.x+","+this.p1.y+
		"Q"+this.p2.x+","+this.p2.y+
		" "+this.p3.x+","+this.p3.y
	);
};

Bezier.prototype.serialize = function() {
	this.set("berti:x0", this.p1.x, Alberti.customns);
	this.set("berti:y0", this.p1.y, Alberti.customns);
	this.set("berti:x1", this.p2.x, Alberti.customns);
	this.set("berti:y1", this.p2.y, Alberti.customns);
	this.set("berti:x2", this.p3.x, Alberti.customns);
	this.set("berti:y2", this.p3.y, Alberti.customns);
	this.set("berti:type", Bezier.shapeName, Alberti.customns);
};

Bezier.prototype.pull = function() {
	this.p1 = new Coord2D(this.get("x0", Alberti.customns), this.get("y0", Alberti.customns));
	this.p2 = new Coord2D(this.get("x1", Alberti.customns), this.get("y1", Alberti.customns));
	this.p3 = new Coord2D(this.get("x2", Alberti.customns), this.get("y2", Alberti.customns));
	
	Dbug.log(this);
};

Bezier.fromPoints = function(p1, p2, p3) {
	var b = new Bezier();
	b.p1.x = p1.x;
	b.p1.y = p1.y;
	b.p2.x = p2.x;
	b.p2.y = p2.y;
	b.p3.x = p3.x;
	b.p3.y = p3.y;
	
	return b;
};
