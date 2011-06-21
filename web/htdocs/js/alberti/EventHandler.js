/*
 * EventHandler.js
 * 
 * Implementation of the DOM EventListener interface.
 * 
 * * */

function EventHandler() {
	this.lastMouseMove = Date.now();
	this.listeners = [];
}

EventHandler.prototype.registerListener = function(type, target, useCapture) {
	if (this.getListenerIndex(type, target, useCapture) == -1) {
		this.listeners.push({"type":type, "target":target, "useCapture":useCapture});
		target.addEventListener(type, this, useCapture);
	}
};

EventHandler.prototype.unregisterListener = function(type, target, useCapture) {
	var index = this.getListenerIndex(type, target, useCapture);
	
	if (index > -1) {
		this.listeners.splice(index, 1);
		target.removeEventListener(type, this, useCapture);
	}
};

EventHandler.prototype.killAllListeners = function() {
	for (var i = 0, len = this.listeners.length; i < len; i++) {
		var rec = this.listeners[i];
		rec.target.removeEventListener(rec.type, this, rec.useCapture);
	}
	
	this.listeners = [];
};

// Returns index of given listener record, or -1 if not found
EventHandler.prototype.getListenerIndex = function(type, target, useCapture) {
	for (var i = 0, len = this.listeners.length; i < len; i++) {
		var rec = this.listeners[i];
		if (type == rec.type && target == rec.target && useCapture == rec.useCapture) {
			return i;
		}
	}
	
	return -1;
};

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
