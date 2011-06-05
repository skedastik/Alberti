/*
 * GuiControl.js
 * extends EventHandler
 * 
 * An abstract GUI control class. The constructor expects four arguments. 'id' 
 * is an ID string. 'elt' is an HTML element representing the control. The 
 * 'delegate' argument is a reference to a controller object, and 'action' is
 * a method name belonging to that object.
 * 
 * * */
 
function GuiControl(id, elt, delegate) {
	GuiControl.baseConstructor.call(this);
	this.id = id;
	this.htmlNode = elt;
	this.delegate = delegate;
}
Util.extend(GuiControl, EventHandler);

GuiControl.prototype.getId = function() {
	return this.id;
};

// Invoke the given action with following arguments
GuiControl.prototype.invokeAction = function(action) {
	if (this.delegate[action]) {
		var args = Array.prototype.slice.call(arguments, 1);
		this.delegate[action].apply(this.delegate, args);
	}
};
