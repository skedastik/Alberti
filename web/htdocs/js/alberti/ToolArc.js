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
 * ToolArc.js
 * 
 * Abstract arc-drawing tool. Features functions for tracking clock direction 
 * of an arc being sweeped by the user.
 * 
 * * */
 
function ToolArc(numSteps, minSteps, mouseupFlag, uiObjects) {
	ToolArc.baseConstructor.call(this, numSteps, minSteps, mouseupFlag, uiObjects);
	this.clockDirection = 1;
	this.lastDeltaAngle = 0;
}
Util.extend(ToolArc, Tool);

// Updates the current clock direction w/ the given angle and returns 1 if 
// clock direction is clockwise, -1 otherwise. A clock direction of -1 
// indicates that the delta angle applied to an arc should subtracted by 
// 2pi.
ToolArc.prototype.getClockDirection = function(newDeltaAngle) {
	var diff = newDeltaAngle - this.lastDeltaAngle;
	
	// The clock direction inverts whenever the delta angle changes by 180
	// degrees or more (the mouse has crossed the zero angle), but only if the
	// difference in delta angle has the same sign as the clock direction.
	if (Math.abs(diff) > halfPi && Util.sign(diff) == this.clockDirection) {
		this.clockDirection *= -1;
	}
	
	this.lastDeltaAngle = newDeltaAngle;
	
	return this.clockDirection;
};
