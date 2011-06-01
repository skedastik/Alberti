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
 
function GuiControl(id, elt, delegate, action) {
	GuiControl.baseConstructor.call(this);
	this.id = id;
	this.htmlNode = elt;
	this.delegate = delegate;
	this.action = action;
}
Util.extend(GuiControl, EventHandler);

GuiControl.prototype.getId = function() {
	return this.id;
};

// Invoke the delegate's action method with the given arguments
GuiControl.prototype.invokeAction = function() {
	this.delegate[this.action].apply(this.delegate, arguments);
};
