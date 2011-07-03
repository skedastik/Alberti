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
 * ToolLine.js
 * extends Tool
 * 
 * Tool for drawing lines.
 * 
 * * */
 
function ToolLine(uiObjects) {
	ToolLine.baseConstructor.call(this, 4, 2, false, uiObjects);
}
Util.extend(ToolLine, Tool);

ToolLine.prototype.executeStep = function(stepNum, gx, gy) {
	switch (stepNum) {
		
		// Step 0: Display the line and start point.
		case 0:
			var c = new Coord2D(gx, gy);
			
			var p = Point.fromCoord(c).generate();
			var l = Line.fromPoints(c, c).generate();
			
			this.registerShape(p, "start_point");
			this.registerShape(l, "line");
			break;
			
		// Step 1: Display line's midpoint and endpoint, as well as a guide 
		// line extending through midpoint to infinity.
		case 1:
			var l = this.getShape("line");
			var sp = this.getShape("start_point")
			
			l.p1 = this.getKeyCoordFromStep(0);
			l.p2 = this.getKeyCoordFromStep(1);
			
			if (l.getLength() > 0) {
				var gl = l.extendToInfinity().generate();
				var ep = Point.fromCoord(l.p2).generate();
				var mp = Point.fromCoord(l.p2).generate();
			
				mp.innerColor = "none";
				sp.innerColor = "black";
				this.sendShapeToOverlay("start_point");
			
				this.registerShape(gl, "line_guide", true);
				this.registerShape(mp, "midpoint", true);
				this.registerShape(ep, "endpoint1");
			} else {
				this.decrementStep();
			}
			
			break;
		
		case 2:
			var l = this.getShape("line");
			var sp = this.getShape("start_point");
			var ep = Point.fromCoord(l.p2).generate();
			
			sp.innerColor = "none";
			this.sendShapeToUnderlay("start_point");
			
			this.registerShape(ep, "endpoint2");
			break;
	}
};

ToolLine.prototype.mouseMoveDuringStep = function(stepNum, gx, gy, constrain) {
	switch (stepNum) {
		
		// Step 0: Update the line's endpoint to match the mouse location. If 
		// the shift key is down, constrain the line's angle to intervals of 
		// 45 degrees.
		case 0:
			var l = this.getShape("line");
			
			if (constrain) {
				l.p2.x = gx;
				l.p2.y = gy;
				l.setAngleFromHorizontal(Util.roundToMultiple(l.getAngleFromHorizontal(), Util.quarterPi));
				l.p2 = l.getNearestCoincident(new Coord2D(gx, gy));
				this.setConstrainCoords(l.p2);
			} else {
				l.p2.x = gx;
				l.p2.y = gy;
			}
			
			l.push();

			this.displayTip("Length: "+Util.roundToDecimal(l.getLength(), 2));
			break;
			
		// Step 1: Update the line's endpoint to match the mouse location, 
		// constrained to the guide line.
		case 1:
			var gl = this.getShape("line_guide");
			var nearp = gl.getNearestCoincident(new Coord2D(gx, gy));
			var l = this.getShape("line");
			var ep = this.getShape("endpoint1");
			
			l.p2.x = ep.coord.x = nearp.x;
			l.p2.y = ep.coord.y = nearp.y;
			
			l.push();
			ep.push();
			
			this.displayTip("Length: "+Util.roundToDecimal(l.getLength(), 2));
			break;
		
		// Step 2: Repeat the same with the other endpoint.
		case 2:
			var l = this.getShape("line");
			var gl = this.getShape("line_guide");
			var nearp = gl.getNearestCoincident(new Coord2D(gx, gy));
			var ep = this.getShape("endpoint2");
			
			l.p1.x = ep.coord.x = nearp.x;
			l.p1.y = ep.coord.y = nearp.y;
			
			l.push();
			ep.push();
			
			this.displayTip("Length: "+Util.roundToDecimal(l.getLength(), 2));
			break;
	}
};

ToolLine.prototype.complete = function(stepNum, constrain) {
	var l = this.getShape("line");
	
	if (stepNum == 1) {
		// If user short-circuited at step 1, place line's endpoint at key 
		// coordinate of step 1.
		l.p2 = this.getKeyCoordFromStep(1);
	} else if (stepNum == 2) {
		// If user short-circuited at step 2, place line's endpoint at key 
		// coordinate of step 1.
		var ep = this.getShape("endpoint1");
		l.p1 = this.getKeyCoordFromStep(0);
		l.p2 = ep.coord.clone();
	}
	
	// Do not bake the line if the endpoints are too close together!
	if (!(Util.equals(l.p1.x, l.p2.x) && Util.equals(l.p1.y, l.p2.y))) {
		this.bakeShape("line");
	}
};
