/*
 * JsColorPicker.js
 * extends GuiControl
 * 
 * Wraps Jan Odvárko's jscolor color picker in a GuiControl class. Three 
 * arguments are passed to the controller's action method: a reference to the 
 * JsColorPicker object, and a hashed RGB color string.
 * 
 * * */

function JsColorPicker(id, elt, controller, action, inputElement) {
	JsColorPicker.baseConstructor.call(this, id, elt, controller, action);
	this.inputElement = inputElement;
	
	this.jscolor = new jscolor.color(this.inputElement, {
		hash: true,
		caps: false,
		pickerOnfocus: false,
		pickerPosition: "top",
		pickerFace: 3,
		pickerBorder: 0,
		pickerFaceColor: "black",
		pickerInsetColor: "white"
	});
	
	this.originalColor = null;          // color at activation
	this.lastColor = null;              // last picked color
}
Util.extend(JsColorPicker, GuiControl);

JsColorPicker.prototype.activate = function() {
	this.originalColor = this.getColor();
	this.jscolor.showPicker();
	
	this.registerListener("mousedown", window, true);
	this.registerListener("click", window, true);
	this.registerListener("keydown", window, true);
	this.registerListener("change", this.inputElement, false);
};

JsColorPicker.prototype.deactivate = function() {
	this.jscolor.hidePicker();
	
	this.unregisterListener("mousedown", window, true);
	this.unregisterListener("click", window, true);
	this.unregisterListener("keydown", window, true);
	this.unregisterListener("change", this.inputElement, false);
};

JsColorPicker.prototype.setColor = function(color) {
	this.lastColor = color;
	this.jscolor.fromString(color);
};

JsColorPicker.prototype.getColor = function() {
	return this.inputElement.value;
};

JsColorPicker.prototype.mousedown = function(evt) {
	// Absorb mousedown event if outside picker
	if (!this.clickWasInPicker(evt)) {
		evt.stopPropagation();
	}
};

JsColorPicker.prototype.clickWasInPicker = function(evt) {
	return Util.hasChild(jscolor.picker.boxB, evt.target);
};

// Update controller with the given color
JsColorPicker.prototype.updateController = function(color) {
	// Do not invoke controller action if color has not changed
	if (color != this.lastColor) {
		this.lastColor = color;
		this.invokeAction(this.action, this, color);
	}
};

JsColorPicker.prototype.keydown = function(evt) {
	switch (evt.keyCode) {
		case KeyCode.esc:
			// If user hit 'escape' key, reset color
			this.updateController(this.originalColor);
			
		case KeyCode.enter:
			this.deactivate();
			evt.stopPropagation();
			break;
	}
};

JsColorPicker.prototype.change = function(evt) {
	// Update workspace colors with each pick
	this.updateController(this.getColor());
};

JsColorPicker.prototype.click = function(evt) {
	// If click wasn't directed at color picker, deactivate picker, and absorb event.
	if (!this.clickWasInPicker(evt)) {
		this.deactivate();
		evt.stopPropagation();
	}
};
