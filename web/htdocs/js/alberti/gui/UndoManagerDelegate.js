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
 * UndoManagerDelegate.js
 * 
 * Propagates UndoManager mutations to a UserInterface object.
 * 
 * * */
 
function UndoManagerDelegate(undoManager, ui) {
	UndoManagerDelegate.baseConstructor.call(this, undoManager);
	this.ui = ui;
	
	this.mapMethod("push", null, "pushDelegate");
	this.mapMethod("recordStop", null, "pushDelegate");
	
	this.mapMethod("undo", null, "undoDelegate");
	this.mapMethod("redo", null, "undoDelegate");
}
Util.extend(UndoManagerDelegate, Delegate);

UndoManagerDelegate.prototype.pushDelegate = function() {
	// For efficiency's sake, do not invoke the undo delegate for every push 
	// recorded to a buffered action. Only the last call to recordStop is 
	// significant (and only then will bufferLevel == 0).
	if (this.enabled && this.bufferLevel == 0) {
		this.undoDelegate();
	}
};

UndoManagerDelegate.prototype.undoDelegate = function() {
	this.ui.updateUndoMenuItems(this.undoStack.length > 0, this.redoStack.length > 0);
};
