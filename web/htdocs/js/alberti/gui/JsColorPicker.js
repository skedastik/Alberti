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
	JsColorPicker.baseConstructor.call(this, id, elt, delegate, action);
	this.inputElement = inputElement;
	this.jscolor = new jscolor.color(this.inputElement, {
		hash: true,
		pickerOnfocus: false,
		pickerPosition: "top",
		pickerFace: 3,
		pickerBorder: 0,
		pickerFaceColor: "black",
		pickerInsetColor: "white"
	});
	
	this.originalColor = null;        // Color at beginning of activation
}
Util.extend(JsColorPicker, GuiControl);

JsColorPicker.prototype.activate = function() {
	this.jscolor.showPicker();
	this.originalColor = this.getColor();
	
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
	this.jscolor.fromString(color);
};

JsColorPicker.prototype.getColor = function() {
	return this.inputElement.value;
};

JsColorPicker.prototype.mousedown = function(evt) {
	// Absorb mousedown event if outside picker
	if (!this.clickedPicker(evt)) {
		evt.stopPropagation();
	}
};

JsColorPicker.prototype.clickedPicker = function(evt) {
	return evt.target.compareDocumentPosition(jscolor.picker.boxB) & Node.DOCUMENT_POSITION_CONTAINS;
};

// Invoke delegate action with the given color
JsColorPicker.prototype.finalizeColor = function(color) {
	// Do not invoke delegate action if color has not changed
	if (this.getColor != this.originalColor) {
		this.invokeAction(this, color);
	}
	
	this.deactivate();
};

JsColorPicker.prototype.click = function(evt) {
	// If click wasn't directed at color picker, notify delegate of new color 
	// selection, deactivate picker, and absorb click event.
	if (!this.clickedPicker(evt)) {
		this.finalizeColor(this.getColor());
		evt.stopPropagation();
	}
};

JsColorPicker.prototype.keydown = function(evt) {
	switch (evt.keyCode) {
		case UserInterface.enterKeyCode:
		case UserInterface.escKeyCode:
			// If user hit 'escape' key, reset color
			this.finalizeColor(evt.keyCode == UserInterface.escKeyCode ? this.originalColor : this.getColor());
			evt.stopPropagation();
			break;
	}
};

JsColorPicker.prototype.change = function(evt) {
	this.invokeAction(this, this.getColor(), true);
};
