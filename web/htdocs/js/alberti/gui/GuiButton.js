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
 * GuiButton.js
 * extends GuiControl
 * 
 * Turn an HTML element into a generic GUI button.
 * 
 * USAGE
 * 
 * The constructor expects an ID string for the button (it need not be 
 * unique). Argument 'elt' should be an HTML element that will serve as the 
 * button. Event listeners will be registered on this element when the button 
 * is enabled. If the 'autoToggle' argument is set to true, the button will 
 * automatically toggle on/off each time it is clicked. The 'controller' 
 * argument is a reference to a controller object, and 'action' is a method 
 * name belonging to that object. This method will be invoked each time the 
 * button is clicked. Two arguments will be passed to the action method, the 
 * first being a reference to the clicked button, the second being a 
 * javascript event object. 'toolTip' is an optional argument that expects a
 * string to display as a native tooltip (use empty string if no tool tip). 
 * If you specify a comma-separate tool tip string, the first string will be
 * used as the tool tip for the 'on' state, the second for the 'off' state.
 * You may optionally pass the mouse event type that the button should respond 
 * to (e.g. "mouseup", "dblclick", etc.) via the 'eventType' argument 
 * (defaults to "click"). Finally, you may pass 'true' for the
 * 'respondsToBubbledEvents' argument if the button should respond to events
 * bubbling up from children of the button's HTML element.
 * 
 * Buttons are disabled by default. Call GuiButton::enable to enable them.
 * Conversely, call GuiButton::disable to disable them.
 * 
 * Auto-toggle buttons are toggled off by default. Call GuiButton::toggle
 * passing 'true' to toggle the button on. To determine if a button is toggled 
 * on, use GuiButton::isToggled.
 * 
 * A button's id may be fetched with GuiButton::getId.
 * 
 * * */

// Class names for various button states, for styling purposes
GuiButton.styleDisabled = "guiBtnDisabled";
GuiButton.styleToggled = "guiBtnToggled";

function GuiButton(id, elt, controller, action, autoToggle, tooltip, eventType, respondsToBubbledEvents) {
	GuiButton.baseConstructor.call(this, id, elt, controller, action);
	this.autoToggle = autoToggle;
	this.eventType = eventType ? eventType : "click";
	this.respondsToBubbledEvents = respondsToBubbledEvents;
	
	this.tooltipOn = "";
	this.tooltipOff = "";
	
	if (tooltip) {
		var tokens = tooltip.toString().match(/^\s*([^,]+?)\s*(,\s*(.+?)\s*)?$/);
		
		Util.assert(tokens !== null, "Invalid tool tip string passed to GuiButton constructor.");
		
		this.tooltipOn = tokens[1];
		this.tooltipOff = tokens[3] ? tokens[3] : this.tooltipOn;
	}
	
	// Generate event handler method for button's event type
	this[this.eventType] = this.respond;
	
	this.enabled = true;
	this.toggleOn = true;
	
	this.disable();
	this.toggle(false);
}
Util.extend(GuiButton, GuiControl);

// Returns true if button is toggled to 'on' state, false otherwise.
GuiButton.prototype.isToggled = function() {
	return this.toggleOn;
};

// Start receiving mouse input. Returns self.
GuiButton.prototype.enable = function() {
	if (!this.enabled) {
		this.enabled = true;
		Util.removeHtmlClass(this.htmlNode, GuiButton.styleDisabled);
		this.registerListener(this.eventType, this.htmlNode, false);
	}
	
	return this;
};

// Stop receiving mouse input. Returns self.
GuiButton.prototype.disable = function() {
	if (this.enabled) {
		this.enabled = false;
		Util.addHtmlClass(this.htmlNode, GuiButton.styleDisabled);
		this.unregisterListener(this.eventType, this.htmlNode, false);
	}
	
	return this;
};

// Pass true to toggle the button to its 'on' state, false for 'off'. If no
// 'toggleFlag' arg is supplied, simply inverts toggle state. Returns self.
GuiButton.prototype.toggle = function(toggleFlag) {
	if (toggleFlag === undefined) {
		toggleFlag = !this.toggleOn;
	}
	
	if (toggleFlag != this.toggleOn) {
		if ((this.toggleOn = toggleFlag)) {
			// Update button's appearance to its 'on' state
			Util.addHtmlClass(this.htmlNode, GuiButton.styleToggled);
			
			if (this.tooltipOn) {
				this.htmlNode.title = this.tooltipOn;
			}
		} else {
			// Update button's appearance to its 'off' state
			Util.removeHtmlClass(this.htmlNode, GuiButton.styleToggled);
			
			if (this.tooltipOff) {
				this.htmlNode.title = this.tooltipOff;
			}
		}
	}
	
	return this;
};

// A button can have a state defined by a string. This state string will also
// be added to the class attribute of the button's HTML node, and the previous
// state removed.
GuiButton.prototype.setState = function(stateString) {
	if (this.state) {
		Util.removeHtmlClass(this.htmlNode, this.state);
	}
	
	this.state = stateString;
	
	Util.addHtmlClass(this.htmlNode, this.state);
};

GuiButton.prototype.clearState = function() {
	if (this.state) {
		Util.removeHtmlClass(this.htmlNode, this.state);
		delete this.state;
	}
};

GuiButton.prototype.getState = function() {
	return this.state;
};

// Respond to the given mouse event
GuiButton.prototype.respond = function(evt) {
	// Only invoke controller's action if button div itself was clicked, or
	// if the button responds to bubbling events. Do not respond to any events
	// with prevented defaults. Allow for spoofed events (e.g. calling click()
	// on a GuiButton instance), in which case evt would be undefined.
	if (!evt || (!evt.defaultPrevented && (evt.target === this.htmlNode || this.respondsToBubbledEvents))) {
		if (this.autoToggle) {
			this.toggle();
		}
	
		this.invokeAction(this.action, this, evt);
	}
};
