/*
 * EventHandler.js
 * 
 * Implementation of the DOM EventListener interface.
 * 
 * * */

EventHandler.numListeners = 0;

function EventHandler() {
	this.lastMouseMove = Date.now();
	this.listeners = [];
}

EventHandler.prototype.registerListener = function(type, target, useCapture) {
	if (this.getListenerIndex(type, target, useCapture) == -1) {
		EventHandler.numListeners++;
		
		this.listeners.push({"type":type, "target":target, "useCapture":useCapture});
		
		if (target.addEventListener) {
			target.addEventListener(type, this, useCapture);
		} else {
			target["on"+type] = this[type].bindTo(this);
		}
	}
};

EventHandler.prototype.unregisterListener = function(type, target, useCapture) {
	var index = this.getListenerIndex(type, target, useCapture);
	
	if (index > -1) {
		EventHandler.numListeners--;
		
		this.listeners.splice(index, 1);
		
		if (target.removeEventListener) {
			target.removeEventListener(type, this, useCapture);
		} else {
			delete target["on"+type];
		}
	}
};

EventHandler.prototype.killAllListeners = function() {
	for (var i = 0, len = this.listeners.length; i < len; i++) {
		EventHandler.numListeners--;
		
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
		
		case "click":
			if (evt.detail == 0) {
				return;      // If detail was 0, event was spoofed. Allow default to handle it.
			}
			break;
	}
	
	this[evt.type](evt);
};
