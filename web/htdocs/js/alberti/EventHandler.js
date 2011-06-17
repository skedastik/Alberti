/*
 * EventHandler.js
 * 
 * Implementation of the DOM EventListener interface.
 * 
 * * */

function EventHandler() {
	this.lastMouseMove = Date.now();
}

EventHandler.prototype.handleEvent = function(evt) {
	switch (evt.type) {
		
		case "mousemove":
			if (Date.now() - this.lastMouseMove < Alberti.refreshms) {
				return;      // Put a limit on how many mousemove events are processed per second
			} else {
				this.lastMouseMove = Date.now();
			}
			break;
		
		case "mouseover":
		case "mouseout":
			if (evt.relatedTarget == evt.currentTarget || Util.hasChild(evt.currentTarget, evt.relatedTarget)) {
				return;      // Discard mouseouts from children to other children or self
			}
			break;
		
		case "keydown":
			if (evt.ctrlKey || evt.metaKey) {
				return;      // Do not respond to control and metakey combinations
			}
			break;
	}
	
	this[evt.type](evt);
};
