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
 * Tool for drawing elliptical arcs inscribed within convex quadrilaterals.
 * 
 * * */
 
function ToolEllipticalArc(uiObjects) {
	ToolEllipticalArc.baseConstructor.call(this, -1, 6, false, uiObjects);
	
	this.quadPoints = [];            // Contains points of quadrilateral
}
Util.extend(ToolEllipticalArc, ToolArc);

ToolEllipticalArc.prototype.executeStep = function(stepNum, gx, gy) {
	switch (stepNum) {
		
		case 0:
		case 1:
		case 2:
			var mouseCoord = new Coord2D(gx, gy);
			
			if (stepNum != 0 && mouseCoord.isEqual(this.quadPoints[stepNum - 1])) {
				// Do not advance to next step if quad point is same as previous step's
				this.decrementStep();
			} else {
				var p = Point.fromCoord(mouseCoord).generate();
			
				this.quadPoints[stepNum] = p.coord;
				this.registerShape(p, "quad_point"+stepNum);
			}
			break;
		
		case 3:
		 	this.quadPoints[3] = new Coord2D(gx, gy);
			var hull = Coord2D.convexHull(this.quadPoints);
			
			if (hull.length == 4) {
				var pq = Point.fromCoord(this.quadPoints[3]).generate();
				var e = EllipticalShape.projectToQuad(new Ellipse(), hull[0], hull[1], hull[2], hull[3]).generate();
				var pc = Point.fromCoord(e.center).generate();
				var l1 = Line.fromPoints(hull[0], hull[1]).generate();
				var l2 = Line.fromPoints(hull[1], hull[2]).generate();
				var l3 = Line.fromPoints(hull[2], hull[3]).generate();
				var l4 = Line.fromPoints(hull[3], hull[0]).generate();
				var lr = Line.fromPoints(e.center, e.center).generate();
				
				this.registerShape(pq, "quad_point"+stepNum);
				this.registerShape(pc, "center_point");
				this.registerShape(l1, "quad_line1", true);
				this.registerShape(l2, "quad_line2", true);
				this.registerShape(l3, "quad_line3", true);
				this.registerShape(l4, "quad_line4", true);
				this.registerShape(e, "ellipse_guide", true);
				this.registerShape(lr, "line_radius");
			} else {
				// Do not advance to the next step if the convex hull has 
				// less than four points as this indicates the quadrilateral 
				// was not, in fact, convex.
				this.decrementStep();
				this.displayTip("Invalid point. Quad must be convex.", true, true);
			}
			break;
		
		default:
			var keyCoord = new Coord2D(gx, gy);
			var e = this.getShape("ellipse_guide");
			var p = Point.fromCoord(keyCoord).generate();
			var l = Line.fromPoints(e.center, keyCoord).generate();
			
			switch ((stepNum - 3) % 2) {
				
				case 0:
					if (!Util.equals(this.getShape("arc"+(stepNum - 1)).da, 0)) {
						this.registerShape(l, "line_delta_angle"+stepNum, true);
						this.registerShape(p, "point_delta_angle"+stepNum);
						this.bakeShape("arc"+(stepNum - 1));
					} else {
						// Do not advance to next step if arc's delta angle is 0
						this.decrementStep();
					}
					break;
				
				case 1:
					var ea = EllipticalArc.fromEllipse(this.getShape("ellipse_guide")).generate();
					ea.sa = l.getAngle();
					ea.coeffs = e.coeffs;
				
					this.registerShape(ea, "arc"+stepNum);
					this.registerShape(l, "line_start_angle"+stepNum, true);
					this.registerShape(p, "point_start_angle"+stepNum);
					break;
			}
			break;
	}
};

ToolEllipticalArc.prototype.mouseMoveDuringStep = function(stepNum, gx, gy, constrain) {
	if (stepNum > 2) {
		var e = this.getShape("ellipse_guide");
		var lr = this.getShape("line_radius");
		var mouseCoord = new Coord2D(gx, gy);
		var mouseAngle = e.center.angleTo(mouseCoord);
		
		if (constrain) {
			// Constrain to quarter degrees
			mouseAngle = Util.degToRad(Util.roundToMultiple(Util.radToDeg(mouseAngle), 0.25));
		}
		
		var p = e.getPointGivenAngle(mouseAngle);
		
		// Calculate point on ellipse for next step regardless of constrain
		this.setConstrainCoords(p);
		
		lr.p2.x = p.x;
		lr.p2.y = p.y;
		lr.push();
		
		if ((stepNum - 3) % 2 == 1) {
			ea = this.getShape("arc"+stepNum);
			
			var newDeltaAngle = Util.angleRelativeTo(mouseAngle, ea.sa);
			
			ea.da = this.getClockDirection(newDeltaAngle) > 0 ? newDeltaAngle : newDeltaAngle - twoPi;
			ea.push();
		}
	}
};

ToolEllipticalArc.prototype.complete = function(stepNum, constrain) {
	// Nothing to be done
};
