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
 * ToolMarker.js
 * 
 * A tool for placing markers (usually vanishing points) that allow the user
 * to rapidly navigate the workspace.
 * 
 * * */
 
function ToolMarker(uiObjects) {
	ToolMarker.baseConstructor.call(this, 1, 1, false, uiObjects);
}
Util.extend(ToolMarker, Tool);

ToolMarker.prototype.executeStep = function(stepNum, gx, gy) {
	var p = Point.fromCoord(new Coord2D(gx, gy)).generate();
	
	this.registerShape(p, "marker");
};

ToolMarker.prototype.complete = function(stepNum, gx, gy) {
	this.bakeShape("marker");
};
