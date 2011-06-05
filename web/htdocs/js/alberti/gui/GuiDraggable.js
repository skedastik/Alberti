/*
 * GuiDraggable.js
 * extends DragHandler
 * 
 * Make a GuiControl draggable. Disabled by default; call enable() to enable.
 * 
 * * */
 
function GuiDraggable(guiControl, beginDragAction, dragAction, dropAction, dragThreshold) {
	GuiDraggable.baseConstructor.call(this, dragThreshold);
	this.control = guiControl;
	this.beginDragAction = beginDragAction;
	this.dragAction = dragAction;
	this.dropAction = dropAction;
	this.dragThreshold = dragThreshold;
	
	this.enabled = true;
	this.disable();
}
Util.extend(GuiDraggable, DragHandler);

// Enable dragging. Returns self.
GuiDraggable.prototype.enable = function() {
	if (!this.enabled) {
		this.enabled = true;
		this.control.htmlNode.addEventListener("mousedown", this, false);
	}
	
	return this;
};

// Disable dragging. Returns self.
GuiDraggable.prototype.disable = function() {
	if (this.enabled) {
		this.enabled = false;
		this.control.htmlNode.removeEventListener("mousedown", this, false);
	}
	
	return this;
};

GuiDraggable.prototype.onDragBegin = function(evt) {
	this.control.invokeAction(this.beginDragAction, this, evt);
};

GuiDraggable.prototype.onDrag = function(dx, dy, evt) {
	this.control.invokeAction(this.dragAction, this, dx, dy, evt);
};

GuiDraggable.prototype.onDrop = function(evt) {
	this.control.invokeAction(this.dropAction, this, evt);
};
