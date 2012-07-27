/*  
 *  Copyright (C) 2011, Alaric Holloway <alaric.holloway@gmail.com>
 *  
 *  This file is part of Alberti.
 *
 *  Alberti is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  Alberti is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with Alberti.  If not, see <http://www.gnu.org/licenses/>.
 *  
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * EventHandler.js
 * 
 * Implementation of the DOM EventListener interface.
 * 
 * * */

EventHandler.numListeners = 0;

// Safari has an absurdly high repeat rate for the escape key. (just tapping 
// the escape key can result in hundreds of keydown events). Limit the repeat 
// rate to this value (in ms).
EventHandler.escKeyRepeatRate = 150;

function EventHandler() {
	this.lastMouseMove = Date.now();
	this.lastEscapeKeydown = Date.now();
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
			
			if (evt.keyCode == KeyCode.esc) {
				if (Date.now() - this.lastEscapeKeydown < EventHandler.escKeyRepeatRate) {
					return;      // Throttle repeat rate of escape key
				} else {
					this.lastEscapeKeydown = Date.now();
				}
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
