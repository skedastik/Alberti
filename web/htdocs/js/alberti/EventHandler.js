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
	// Put a limit on how many mousemove events are processed per second
	if (evt.type == "mousemove") {
		if (Date.now() - this.lastMouseMove < Alberti.refreshms) {
			return;
		} else {
			this.lastMouseMove = Date.now();
		}
	}
	
	this[evt.type](evt);
};
