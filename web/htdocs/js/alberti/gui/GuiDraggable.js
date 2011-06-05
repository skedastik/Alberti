/*
 * GuiDraggable.js
 * extends DragHandler
 * 
 * Make a GuiControl draggable. Use in tandem with GuiDropTarget for drag/drop
 * functionality.
 * 
 * USAGE
 * 
 * Disabled by default; call enable() to enable.
 * 
 * * */

GuiDraggable.motiveDraggable = null;        // GuiDraggable currently being dragged
 
function GuiDraggable(guiControl, beginDragAction, dragAction, dropAction, dragThreshold, dropTargetClass) {
	GuiDraggable.baseConstructor.call(this, dragThreshold);
	this.control = guiControl;
	this.beginDragAction = beginDragAction;
	this.dragAction = dragAction;
	this.dropAction = dropAction;
	this.dragThreshold = dragThreshold;
	
	// Control can be dropped onto drop targets of this class
	this.dropTargetClass = dropTargetClass ? dropTargetClass : null;
	this.currentDropTarget = null;
	
	this.enabled = true;
	this.disable();
}
Util.extend(GuiDraggable, DragHandler);

// Enable drag. Returns self.
GuiDraggable.prototype.enable = function() {
	if (!this.enabled) {
		this.enabled = true;
		this.control.htmlNode.addEventListener("mousedown", this, false);
	}
	
	return this;
};

// Disable drag. Returns self.
GuiDraggable.prototype.disable = function() {
	if (this.enabled) {
		this.enabled = false;
		this.control.htmlNode.removeEventListener("mousedown", this, false);
	}
	
	return this;
};

GuiDraggable.prototype.onDragBegin = function(evt) {
	GuiDraggable.motiveDraggable = this;
	this.control.invokeAction(this.beginDragAction, this.control, evt);
};

GuiDraggable.prototype.onDrag = function(dx, dy, evt) {
	this.control.invokeAction(this.dragAction, this.control, dx, dy, evt);
};

GuiDraggable.prototype.onDrop = function(evt) {
	GuiDraggable.motiveDraggable = null;
	this.control.invokeAction(this.dropAction, this.control, this.currentDropTarget, evt);
	
	// Clear current drop target when the control is dropped
	this.currentDropTarget = null;
};

// Automatically invoked by GuiDropTarget
GuiDraggable.prototype.setDropTarget = function(control) {
	this.currentDropTarget = control;
};
