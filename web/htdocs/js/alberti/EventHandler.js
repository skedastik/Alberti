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
	if (evt.type == "mousemove") {
		// Put a limit on how many mousemove events are processed per second
		if (Date.now() - this.lastMouseMove < Alberti.refreshms) {
			return;
		} else {
			this.lastMouseMove = Date.now();
		}
	} else if (evt.type == "mouseover" || evt.type == "mouseout") {
		// Discard bubbling mouseover and mouseout events
		if (evt.target != evt.currentTarget || Util.hasChild(evt.currentTarget, evt.relatedTarget)) {
			return;
		}
	}
	
	this[evt.type](evt);
};
