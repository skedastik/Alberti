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
 * GuiControl.js
 * extends EventHandler
 * 
 * A generic GUI control class.
 * 
 * USAGE
 * 
 * The constructor expects four arguments: 'id' is an ID string. 'elt' is an 
 * HTML element representing the control. 'controller' is a reference to a 
 * controller object. 'action' is a method belonging to the controller and
 * defines the default action of the GuiControl.
 * 
 * * */
 
function GuiControl(id, elt, controller, action) {
	GuiControl.baseConstructor.call(this);
	this.id = id;
	this.htmlNode = elt;
	this.controller = controller;
	this.action = action;
}
Util.extend(GuiControl, EventHandler);

GuiControl.prototype.getId = function() {
	return this.id;
};

// Connect a GuiControl to a controller object and default action. Returns self.
GuiControl.prototype.connect = function(controller, action) {
	this.controller = controller;
	this.action = action;
	
	return this;
};

// Invoke the given action with following arguments. Returns result of action method.
GuiControl.prototype.invokeAction = function(action) {
	if (this.controller[action]) {
		var args = Array.prototype.slice.call(arguments, 1);
		return this.controller[action].apply(this.controller, args);
	}
};

// Returns position of control's HTML element relative top-left of page as a Coord2D
GuiControl.prototype.getClientPosition = function() {
	return new Coord2D(Util.getClientX(this.htmlNode), Util.getClientY(this.htmlNode));
};
