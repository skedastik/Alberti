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
 * ToolBezier.js
 * 
 * Quadratic bezier tool.
 * 
 * * */

function ToolBezier(uiObjects) {
	ToolBezier.baseConstructor.call(this, 3, 3, false, uiObjects);
}
Util.extend(ToolBezier, Tool);

ToolBezier.prototype.executeStep = function(stepNum, gx, gy) {
	var mouseCoord = new Coord2D(gx, gy);
	
	switch (stepNum) {
		
		case 0:
			var b = Bezier.fromPoints(mouseCoord, mouseCoord, mouseCoord).generate();
			var p = Point.fromCoord(mouseCoord).generate();
			
			this.registerShape(p, "p1");
			this.registerShape(b, "bezier");
			break;
		
		case 1:
			var p = Point.fromCoord(mouseCoord).generate();
			
			this.registerShape(p, "p3");
			break;
	}
};

ToolBezier.prototype.mouseMoveDuringStep = function(stepNum, gx, gy) {
	var b = this.getShape("bezier");
	
	switch (stepNum) {
		
		case 0:
			b.p3.x = gx;
			b.p3.y = gy;
			
			// Bezier remains a straight line throughout step 0
			b.p2.x = (b.p1.x + b.p3.x) / 2;
			b.p2.y = (b.p1.y + b.p3.y) / 2;
			
			b.push();
			break;
		
		case 1:
			b.p2.x = gx;
			b.p2.y = gy;
			
			b.push();
			break;
	}
};

ToolBezier.prototype.complete = function(stepNum) {
	this.bakeShape("bezier");
};
