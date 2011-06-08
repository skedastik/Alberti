/*
 * GuiDraggable.js
 * extends DragHandler
 * 
 * Make a GuiControl draggable. Use in tandem with GuiDropTarget for drag/drop
 * functionality.
 * 
 * USAGE
 * 
 * The constructor expects a reference to an existing GuiControl. The next 
 * three args should be handler method names belonging to the GuiControl's
 * delegate object. 'dragThreshold' is the minimum pixel distance before the
 * begin-drag action is triggered. 'dropTargetClass' is optional. It is a
 * string denoting the class of drop targets the GuiDraggable should activate
 * (see GuiDropTarget.js for details). GuiDraggable instances are disabled by 
 * default; call enable() to enable.
 * 
 * Handler Methods
 * 
 * beginDragAction - Invoked when the control is dragged. Arguments: the 
 * GuiControl being dragged, and the mousemove event object that triggered
 * dragging.
 * 
 * dragAction - Invoked every mousemove during dragging. Arguments: the 
 * GuiControl being dragged, drag-delta X, drag-delta Y, and the mousemove 
 * event.
 * 
 * dropAction - Invoked when the control is dropped. Arguments: the GuiControl
 * being dropped, the GuiControl drop target (null if the control was not
 * dropped onto a target), and the mouseup event that triggered the drop.
 * 
 * IMPORTANT
 * 
 * GuiDraggable should be enabled _before_ its corresponding GuiControl so 
 * that it is the first to receive events directed at the control's HTML node.
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
	
	this.absorbClicks = false;        // Absorb clicks on child elements and self?
	
	this.enabled = true;
	this.disable();
}
Util.extend(GuiDraggable, DragHandler);

// Enable drag. Returns self.
GuiDraggable.prototype.enable = function() {
	if (!this.enabled) {
		this.enabled = true;
		this.control.htmlNode.addEventListener("mousedown", this, false);
		this.control.htmlNode.addEventListener("click", this, false);        // For absorbing clicks
		this.control.htmlNode.addEventListener("dblclick", this, false);     // For absorbing dblclicks
	}
	
	return this;
};

// Disable drag. Returns self.
GuiDraggable.prototype.disable = function() {
	if (this.enabled) {
		this.enabled = false;
		this.control.htmlNode.removeEventListener("mousedown", this, false);
		this.control.htmlNode.removeEventListener("click", this, false);
		this.control.htmlNode.removeEventListener("dblclick", this, false);
	}
	
	return this;
};

GuiDraggable.prototype.onDragBegin = function(evt) {
	GuiDraggable.motiveDraggable = this;
	this.control.invokeAction(this.beginDragAction, this.control, evt);
	
	// Absorb click events during dragging so child elements (and self) aren't activated
	this.absorbClicks = true;
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
		this.absorbClicks = false;
	}.bindTo(this), 1);
};

// Automatically invoked by GuiDropTarget
GuiDraggable.prototype.setDropTarget = function(control) {
	this.currentDropTarget = control;
};

GuiDraggable.prototype.click =
GuiDraggable.prototype.dblclick = function(evt) {
	if (this.absorbClicks) {
		evt.stopPropagation();                           // Absorb click on children
		evt.preventDefault();                            // Absorb click on self
	}
};

GuiDraggable.prototype.mousedown = function(evt) {
	// Don't initiate dragging if mousedown started in a text input
	if (evt.target.tagName != "input") {
		GuiDraggable.superclass.mousedown.call(this, evt);
	}
};
