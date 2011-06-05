/*
 * JsColorPicker.js
 * extends GuiControl
 * 
 * Wraps Jan Odvárko's jscolor color picker in a GuiControl class. Three 
 * arguments are passed to the delegate's action method: a reference to the 
 * JsColorPicker object, and a hashed RGB color string.
 * 
 * * */

function JsColorPicker(id, elt, delegate, action, inputElement) {
	JsColorPicker.baseConstructor.call(this, id, elt, delegate);
	this.action = action;
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
	
	window.addEventListener("mousedown", this, true);
	window.addEventListener("click", this, true);
	window.addEventListener("keydown", this, true);
	this.inputElement.addEventListener("change", this, false);
};

JsColorPicker.prototype.deactivate = function() {
	this.jscolor.hidePicker();
	
	window.removeEventListener("mousedown", this, true);
	window.removeEventListener("click", this, true);
	window.removeEventListener("keydown", this, true);
	this.inputElement.removeEventListener("change", this, false);
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
	return evt.target.compareDocumentPosition(jscolor.picker.boxB) & Node.DOCUMENT_POSITION_CONTAINS;
};

// Update delegate with the given color
JsColorPicker.prototype.updateDelegate = function(color) {
	// Do not invoke delegate action if color has not changed
	if (color != this.lastColor) {
		this.lastColor = color;
		this.invokeAction(this.action, this, color);
	}
};

JsColorPicker.prototype.keydown = function(evt) {
	switch (evt.keyCode) {
		case UserInterface.escKeyCode:
			// If user hit 'escape' key, reset color
			this.updateDelegate(this.originalColor);
			
		case UserInterface.enterKeyCode:
			this.deactivate();
			evt.stopPropagation();
			break;
	}
};

JsColorPicker.prototype.change = function(evt) {
	// Update workspace colors with each pick
	this.updateDelegate(this.getColor());
};

JsColorPicker.prototype.click = function(evt) {
	// If click wasn't directed at color picker, deactivate picker, and absorb event.
	if (!this.clickWasInPicker(evt)) {
		this.deactivate();
		evt.stopPropagation();
	}
};
