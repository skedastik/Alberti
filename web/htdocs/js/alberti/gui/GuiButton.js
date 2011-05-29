/*
 * GuiButton.js
 * 
 * Turn an HTML element into a generic GUI button.
 * 
 * USAGE
 * 
 * The constructor expects an id string for the button (it need not be 
 * unique). Argument 'elt' should be an HTML element that will serve as the 
 * button. Event listeners will be registered on this element when the button 
 * is enabled. If the 'autoToggle' argument is set to true, the button will 
 * automatically toggle on/off each time it is clicked. The 'delegate' 
 * argument is a reference to a controller object, and 'action' is a method 
 * name belonging to that object. This method will be invoked each time the 
 * button is clicked. Two arguments will be passed to the action method, the 
 * first being a reference to the clicked button, the second being a 
 * javascript event object. Finally, you may optionally pass true for the
 * 'respondMouseDown' argument if the button should respond to mousedown 
 * events rather than click events.
 * 
 * Buttons are disabled by default. Call GuiButton::enable to enable them.
 * Conversely, call GuiButton::disable to disable them.
 * 
 * A button's id may be fetched with GuiButton::getId. To determine if a
 * button is toggled on, use GuiButton::isToggled.
 * 
 * * */

// class names for various button states, for styling purposes
GuiButton.styleDisabled = "guiBtnDisabled";
GuiButton.styleToggled = "guiBtnToggled";

function GuiButton(id, elt, autoToggle, delegate, action, respondMouseDown) {
	GuiButton.baseConstructor.call(this);
	this.id = id;
	this.htmlNode = elt;
	this.autoToggle = autoToggle;
	this.delegate = delegate;
	this.action = action;
	this.respondMouseDown = respondMouseDown;
	
	this.toggleOn = false;
	this.enabled = true;
	this.disable();
}
Util.extend(GuiButton, EventHandler);

GuiButton.prototype.getId = function() {
	return this.id;
};

// Returns true if button is toggled to 'on' state, false otherwise.
GuiButton.prototype.isToggled = function() {
	return this.toggleOn;
};

// Start receiving mouse input. Returns self.
GuiButton.prototype.enable = function() {
	if (!this.enabled) {
		this.enabled = true;
		Util.removeHtmlClass(this.htmlNode, GuiButton.styleDisabled);
		this.htmlNode.addEventListener(this.respondMouseDown ? "mousedown" : "click", this, false);
	}
	
	return this;
};

// Stop receiving mouse input. Returns self.
GuiButton.prototype.disable = function() {
	if (this.enabled) {
		this.enabled = false;
		Util.addHtmlClass(this.htmlNode, GuiButton.styleDisabled);
		this.htmlNode.removeEventListener(this.respondMouseDown ? "mousedown" : "click", this, false);
	}
	
	return this;
};

// Pass true to toggle the button to its 'on' state, false for 'off'.
GuiButton.prototype.toggle = function(toggleFlag) {
	if (toggleFlag != this.toggleOn) {
		if ((this.toggleOn = toggleFlag)) {
			Util.addHtmlClass(this.htmlNode, GuiButton.styleToggled);
		} else {
			Util.removeHtmlClass(this.htmlNode, GuiButton.styleToggled);
		}
	}
};

// GuiButton can respond to both click or mousedown events
GuiButton.prototype.click = GuiButton.prototype.mousedown = function(evt) {
	if (this.autoToggle) {
		this.toggle(!this.toggleOn);
	}
	
	// Invoke the delegate object's action method
	this.delegate[this.action](this, evt);
};
