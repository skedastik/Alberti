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
 * GuiDropTargetFamily.js
 * 
 * A family of related drop targets.
 * 
 * * */
 
function GuiDropTargetFamily() {
	this.dropTargets = [];
}

GuiDropTargetFamily.prototype.addDropTarget = function(guiDropTarget) {
	Util.assert(this.dropTargets.indexOf(guiDropTarget) < 0,
		"Duplicate drop target passed to GuiDropTargetFamily::addDropTarget"
	);
	
	this.dropTargets.push(guiDropTarget);
};

GuiDropTargetFamily.prototype.removeDropTarget = function(guiDropTarget) {
	var index = this.dropTargets.indexOf(guiDropTarget);
	
	Util.assert(index >= 0, "Unrecognized drop target passed to GuiDropTargetFamily::removeDropTarget");
	
	this.dropTargets.splice(index, 1);
};

// Activate all drop targets belonging to this family
GuiDropTargetFamily.prototype.activate = function() {
	for (var i = 0, len = this.dropTargets.length; i < len; i++) {
		this.dropTargets[i].activate();
	}
};

// Deactivate all drop targets belonging to this family
GuiDropTargetFamily.prototype.deactivate = function() {
	for (var i = 0, len = this.dropTargets.length; i < len; i++) {
		this.dropTargets[i].deactivate();
	}
};
