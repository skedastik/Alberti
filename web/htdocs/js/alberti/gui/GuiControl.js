/*
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
