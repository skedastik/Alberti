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
 * GuiDropTarget.js
 * extends EventHandler
 * 
 * Make a GuiControl a drop target. Works in tandem with GuiDraggable and
 * GuiDropTargetFamily.
 * 
 * REQUIRES
 * 
 * GuiDraggable.js
 * 
 * USAGE
 * 
 * Disabled by default; call enable() to enable.
 * 
 * * */

function GuiDropTarget(guiControl, mouseOverAction, mouseOutAction, mouseMoveAction) {
	GuiDropTarget.baseConstructor.call(this);
	this.control = guiControl;
	this.mouseOverAction = mouseOverAction;
	this.mouseOutAction = mouseOutAction;
	this.mouseMoveAction = mouseMoveAction;
	
	this.active = false;
	this.enabled = false;
}
Util.extend(GuiDropTarget, EventHandler);

// Enable drop. Returns self.
GuiDropTarget.prototype.enable = function() {
	this.enabled = true;
	return this;
};

// Disable drop. Returns self.
GuiDropTarget.prototype.disable = function() {
	this.enabled = false;
	return this;
};

// Activate event listeners. Invoked by GuiDropTargetFamily.
GuiDropTarget.prototype.activate = function() {
	if (this.enabled && !this.active) {
		this.active = true;
		this.registerListener("mouseover", this.control.htmlNode, false);
		this.registerListener("mouseout", this.control.htmlNode, false);
		this.registerListener("mousemove", this.control.htmlNode, false);
	}
};

// Deactivate event listeners. Invoked by GuiDropTargetFamily.
GuiDropTarget.prototype.deactivate = function() {
	if (this.active) {
		this.active = false;
		this.unregisterListener("mouseover", this.control.htmlNode, false);
		this.unregisterListener("mouseout", this.control.htmlNode, false);
		this.unregisterListener("mousemove", this.control.htmlNode, false);
	}
};

GuiDropTarget.prototype.mouseover = function(evt) {
	if (GuiDraggable.motiveDraggable) {
		GuiDraggable.motiveDraggable.setDropTarget(this.control);
		this.control.invokeAction(this.mouseOverAction, this.control, evt);
	}
};

GuiDropTarget.prototype.mouseout = function(evt) {
	if (GuiDraggable.motiveDraggable) {
		GuiDraggable.motiveDraggable.setDropTarget(null);
		this.control.invokeAction(this.mouseOutAction, this.control, evt);
	}
};

GuiDropTarget.prototype.mousemove = function(evt) {
	if (GuiDraggable.motiveDraggable) {
		GuiDraggable.motiveDraggable.setDropTarget(this.control);
		
		// Calculate mouse position relative to position of drop target
		var pos = this.control.getClientPosition();
		var dx = evt.clientX - pos.x;
		var dy = evt.clientY - pos.y;
		
		this.control.invokeAction(this.mouseMoveAction, this.control, dx, dy, evt);
	}
};
