/*
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
		this.control.htmlNode.addEventListener("mouseover", this, false);
		this.control.htmlNode.addEventListener("mouseout", this, false);
		this.control.htmlNode.addEventListener("mousemove", this, false);
	}
};

// Deactivate event listeners. Invoked by GuiDropTargetFamily.
GuiDropTarget.prototype.deactivate = function() {
	if (this.active) {
		this.active = false;
		this.control.htmlNode.removeEventListener("mouseover", this, false);
		this.control.htmlNode.removeEventListener("mouseout", this, false);
		this.control.htmlNode.removeEventListener("mousemove", this, false);
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
