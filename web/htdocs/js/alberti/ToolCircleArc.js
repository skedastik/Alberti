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
 * ToolCircleArc.js
 * extends ToolArc
 * 
 * Tool for drawing circle arcs.
 * 
 * * */
 
function ToolCircleArc(uiObjects) {
	ToolCircleArc.baseConstructor.call(this, -1, 4, false, uiObjects);

	this.lastRadius = 0;           // Last radius of a completed arc
}
Util.extend(ToolCircleArc, ToolArc);

ToolCircleArc.prototype.executeStep = function(stepNum, gx, gy) {
	switch (stepNum) {
		
		case 0:
			var p = Point.fromCoord(new Coord2D(gx, gy)).generate();
			var c = new Circle().generate();
			c.center.x = gx;
			c.center.y = gy;
			c.radius = 0;
			
			this.registerShape(p, "start_point");
			this.registerShape(c, "radius_circle");
			break;
			
		case 1:
			var c = this.getShape("radius_circle");
			
			if (c.radius > 0) {
				// The radius has been selected, save it for future use
				this.lastRadius = c.radius;

				var l = Line.fromPoints(c.center, c.center).generate();
			
				this.registerShape(l, "radius_line");
				this.sendShapeToUnderlay("radius_circle");
			} else {
				// Do not advance to next step if radius is 0
				this.decrementStep();
				break;
			}
			
		default:
			var radius = this.getShape("radius_line").getLength();
			var centerCoord = this.getKeyCoordFromStep(0);
			var angleCoord = this.getKeyCoordFromStep(stepNum);
			
			switch ((stepNum - 2) % 2) {
				
				case 0:
					var saLine = Line.fromPoints(centerCoord, angleCoord).generate().setLength(radius);
					var saPoint = Point.fromCoord(saLine.p2).generate();
					var arc = new CircleArc().generate();
					
					arc.center = centerCoord.clone();
					arc.radius = radius;
					arc.sa = saLine.getAngle();
					
					this.registerShape(saPoint, "start_angle_point"+stepNum);
					this.registerShape(saLine, "start_angle_line"+stepNum, true);
					this.registerShape(arc, "arc"+stepNum);
					break;
					
				case 1:
					if (!Util.equals(this.getShape("arc"+(stepNum - 1)).da, 0, 1e-4)) {
						var daLine = Line.fromPoints(centerCoord, angleCoord).generate().setLength(radius);
						var daPoint = Point.fromCoord(daLine.p2).generate();
					
						this.registerShape(daPoint, "delta_angle_point"+stepNum);
						this.registerShape(daLine, "delta_angle_line"+stepNum, true);
					
						this.bakeShape("arc"+(stepNum - 1));
					} else {
						// Do not advance to next step if delta angle is 0
						this.decrementStep();
					}
					break;
			}
			break;
	}
};

ToolCircleArc.prototype.mouseMoveDuringStep = function(stepNum, gx, gy, constrain) {
	switch (stepNum) {
		
		case 0:
			var c = this.getShape("radius_circle");
			
			if (constrain && this.lastRadius != 0) {
				var l = Line.fromPoints(c.center, new Coord2D(gx, gy)).setLength(this.lastRadius);
				this.setConstrainCoords(l.p2);
				
				c.radius = this.lastRadius;
			} else {
				c.radius = c.center.distanceTo(new Coord2D(gx, gy));
			}

			c.push();
			
			this.displayTip("Radius: "+Util.roundToDecimal(c.radius, 2));
			break;
			
		default:
			var l = this.getShape("radius_line");
			var c = this.getShape("radius_circle");
			var mouseCoord = new Coord2D(gx, gy);
			var mouseAngle = Util.radToDeg(c.center.angleTo(mouseCoord));
			
			if (constrain) {
				// Constrain to quarter degrees
				mouseAngle = Util.roundToMultiple(mouseAngle, 0.25);
				l.setAngle(Util.degToRad(mouseAngle));
				
				mouseCoord.x = l.p2.x;
				mouseCoord.y = l.p2.y;
				
				this.setConstrainCoords(l.p2);
			} else {
				l.p2.x = gx;
				l.p2.y = gy;
				l.setLength(c.radius);
			}
			
			l.push();
			
			switch ((stepNum - 1) % 2) {
				
				case 0:
					this.displayTip("Angle: "+Util.roundToDecimal(mouseAngle, 2)+"&#176;");
					break;
				
				case 1:
					var sa = this.getShape("start_angle_line"+(stepNum));
					var ca = this.getShape("arc"+stepNum);
					
					var newDeltaAngle = c.center.angleToRelative(mouseCoord, sa.getAngle());
					
					// Invert the delta angle applied to the circle arc if user is mousing counter-clockwise
					ca.da = this.getClockDirection(newDeltaAngle) > 0 ? newDeltaAngle : newDeltaAngle - twoPi;
			
					ca.push();
			
					this.displayTip(
						"Delta: "+Util.roundToDecimal(Util.radToDeg(Math.abs(ca.da)), 2)+"&#176;"
					);
					break;
			}
			break;
	}
};

ToolCircleArc.prototype.complete = function(stepNum, constrain) {
	// Nothing to be done.
};
