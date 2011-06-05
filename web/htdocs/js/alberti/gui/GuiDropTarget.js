/*
 * GuiDropTarget.js
 * extends EventHandler
 * 
 * Make a GuiControl a drop target. Works in tandem with GuiDraggable.
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

function GuiDropTarget(guiControl, mouseOverAction, mouseOutAction, mouseMoveAction, dropTargetClass) {
	GuiDropTarget.baseConstructor.call(this);
	this.control = guiControl;
	this.mouseOverAction = mouseOverAction;
	this.mouseOutAction = mouseOutAction;
	this.mouseMoveAction = mouseMoveAction;
	this.dropTargetClass = dropTargetClass;
	
	this.enabled = true;
	this.disable();
}
Util.extend(GuiDropTarget, EventHandler);

// Enable drop. Returns self.
GuiDropTarget.prototype.enable = function() {
	if (!this.enabled) {
		this.enabled = true;
		this.control.htmlNode.addEventListener("mouseover", this, false);
		this.control.htmlNode.addEventListener("mouseout", this, false);
		this.control.htmlNode.addEventListener("mousemove", this, false);
	}
	
	return this;
};

// Disable drop. Returns self.
GuiDropTarget.prototype.disable = function() {
	if (this.enabled) {
		this.enabled = false;
		this.control.htmlNode.removeEventListener("mouseover", this, false);
		this.control.htmlNode.removeEventListener("mouseout", this, false);
		this.control.htmlNode.removeEventListener("mousemove", this, false);
	}
	
	return this;
};

// Returns true if the currently dragged GuiDraggable has the same drop target class.
GuiDropTarget.prototype.motiveDraggableIsValid = function() {
	return (
		GuiDraggable.motiveDraggable 
		&& GuiDraggable.motiveDraggable.control != this.control                   // exclude self
		&& GuiDraggable.motiveDraggable.dropTargetClass == this.dropTargetClass
	);
};

GuiDropTarget.prototype.mouseover = function(evt) {
	if (this.motiveDraggableIsValid()) {
		GuiDraggable.motiveDraggable.setDropTarget(this.control);
		this.control.invokeAction(this.mouseOverAction, this.control, evt);
	}
};

GuiDropTarget.prototype.mouseout = function(evt) {
	if (this.motiveDraggableIsValid()) {
		GuiDraggable.motiveDraggable.setDropTarget(null);
		this.control.invokeAction(this.mouseOutAction, this.control, evt);
	}
};

GuiDropTarget.prototype.mousemove = function(evt) {
	if (this.motiveDraggableIsValid()) {
		// The mouse position relative to the position of the drop target
		var dx = evt.clientX - Util.getGlobalX(this.control.htmlNode);
		var dy = evt.clientY - Util.getGlobalY(this.control.htmlNode);
		
		this.control.invokeAction(this.mouseMoveAction, this.control, dx, dy, evt);
	}
};
