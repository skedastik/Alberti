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
 * ToolEllipticalArc.js
 * extends ToolArc
 * 
 * Tool for drawing elliptical arcs inscribed within quadrilaterals.
 * 
 * * */
 
function ToolEllipticalArc(uiObjects) {
	ToolEllipticalArc.baseConstructor.call(this, -1, 6, false, uiObjects);
}
Util.extend(ToolEllipticalArc, ToolArc);

ToolEllipticalArc.prototype.executeStep = function(stepNum, gx, gy) {
	switch (stepNum) {
		
		case 0:
		case 1:
		case 2:
			var p = Point.fromCoord(new Coord2D(gx, gy)).generate();
			this.registerShape(p, "quad_point"+stepNum);
			break;
		
		case 3:
			
	}
};

ToolEllipticalArc.prototype.mouseMoveDuringStep = function(stepNum, gx, gy, constrain) {
	switch (stepNum) {
		
	}
};
