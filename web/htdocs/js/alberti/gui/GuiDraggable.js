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
	
	// Absorb click events during dragging so child elements don't get activated
	this.control.htmlNode.addEventListener("click", this, true);
	this.control.htmlNode.addEventListener("dblclick", this, true);
};

GuiDraggable.prototype.onDrag = function(dx, dy, evt) {
	this.control.invokeAction(this.dragAction, this.control, dx, dy, evt);
};

GuiDraggable.prototype.onDrop = function(evt) {
	GuiDraggable.motiveDraggable = null;
	this.control.invokeAction(this.dropAction, this.control, this.currentDropTarget, evt);
	
	// Dragging stopped, so restore control's pointer-events property to "all"
	this.control.htmlNode.style.pointerEvents = "all";
	
	// Stop absorbing click events after a short timeout. The timeout is
	// necessary because clicks and double clicks occur after a mouseup.
	window.setTimeout(function() {
		this.control.htmlNode.removeEventListener("click", this, true);
		this.control.htmlNode.removeEventListener("dblclick", this, true);
	}.bindTo(this), 1);
};

// Automatically invoked by GuiDropTarget
GuiDraggable.prototype.setDropTarget = function(control) {
	this.currentDropTarget = control;
};

GuiDraggable.prototype.click =
GuiDraggable.prototype.dblclick = function(evt) {
	evt.stopPropagation();                           // Absorb click on children
	evt.preventDefault();                            // Absorb click on self
};

GuiDraggable.prototype.mousedown = function(evt) {
	// Don't initiate dragging if mousedown started in a text input
	if (evt.target.tagName != "input") {
		GuiDraggable.superclass.mousedown.call(this, evt);
	}
};
