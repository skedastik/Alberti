/*
 * ToolCircleArc.js
 * extends Tool
 * 
 * Tool for drawing circle arcs.
 * 
 * * */
 
function ToolCircleArc() {
	ToolCircleArc.baseConstructor.call(this, -1, 4);
	
	this.clockDirection = 1;            // 1 if the user is mousing clockwise, -1 otherwise
	this.lastDeltaAngle = 0;            // Helps determine mouse clock direction

	this.lastRadius = 0;           // Last radius of a completed arc
}
Util.extend(ToolCircleArc, Tool);

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

				var l = new Line().generate();
				l.p1.x = l.p2.x = c.center.x;
				l.p1.y = l.p2.y = c.center.y;
			
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
					var start_angle_line = Line.fromPoints(centerCoord, angleCoord).generate().setLength(radius);
					var start_angle_point = Point.fromCoord(start_angle_line.p2).generate();
					var arc = new CircleArc().generate();
					
					arc.center = centerCoord.clone();
					arc.radius = radius;
					arc.startAngle = arc.endAngle = start_angle_line.getAngleFromHorizontal();
					
					// Default to clockwise
					this.clockDirection = 1;
					this.lastDeltaAngle = 0;
					
					this.registerShape(start_angle_point, "start_angle_point"+stepNum);
					this.registerShape(start_angle_line, "start_angle_line"+stepNum, true);
					this.registerShape(arc, "arc"+stepNum);
					break;
					
				case 1:
					if (this.getShape("arc"+(stepNum - 1)).deltaAngle != 0) {
						var deltaAngleLine = Line.fromPoints(centerCoord, angleCoord).generate().setLength(radius);
						var deltaAnglePoint = Point.fromCoord(deltaAngleLine.p2).generate();
					
						this.registerShape(deltaAnglePoint, "delta_angle_point"+stepNum);
						this.registerShape(deltaAngleLine, "delta_angle_line"+stepNum, true);
					
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
			
			switch ((stepNum - 1) % 2) {
				
				case 1:
					var sa = this.getShape("start_angle_line"+(stepNum));
					var ca = this.getShape("arc"+stepNum);
					
					var newDeltaAngle = c.center.angleToRelative(new Coord2D(gx, gy), sa.getAngleFromHorizontal());
					this.updateClockDirection(newDeltaAngle);
					
					// Invert the delta angle applied to the circle arc if user is mousing counter-clockwise
					ca.deltaAngle = this.clockDirection > 0 ? newDeltaAngle : newDeltaAngle - Util.twoPi;
			
					ca.push();
			
					this.displayTip("Angle: "+Util.roundToDecimal(Util.radToDeg(Math.abs(ca.deltaAngle)), 2));
				
				default:
					l.p2.x = gx;
					l.p2.y = gy;
					l.setLength(c.radius);

					l.push();
					break;
			}
			break;
	}
};

ToolCircleArc.prototype.complete = function(stepNum, constrain) {
	// Nothing to be done.
};

// Updates the current mouse clock direction.
ToolCircleArc.prototype.updateClockDirection = function(newDeltaAngle) {
	var diff = newDeltaAngle - this.lastDeltaAngle;
	
	// The clock direction has changed if the delta angle suddenly jumps by a
	// 180 degrees (the mouse has crossed the zero angle), but only if the
	// difference in delta angle has the same sign as the clock direction.
	if (Math.abs(diff) > Util.degToRad(180) && Util.sign(diff) == this.clockDirection) {
		this.clockDirection *= -1;
	}
	
	this.lastDeltaAngle = newDeltaAngle;
};
