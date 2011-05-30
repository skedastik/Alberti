/*
 * GuiButtonFamily.js
 * 
 * A family of related GuiButtons. Only one button in each GuiButtonFamily can
 * be toggled to its 'on' state at a time. GuiButtonFamily handles this
 * toggling automatically via its toggleButton method.
 * 
 * * */
 
function GuiButtonFamily() {
	this.buttons = [];
	this.currentToggled = -1;         // The currently toggled button's index
}

// Expects a previously-added GuiButton object. Toggles it 'on'.
GuiButtonFamily.prototype.toggleButton = function(button) {
	var index = this.buttons.indexOf(button);
	
	Util.assert(index >= 0, "Invalid GuiButton object passed to GuiButtonFamily::toggleButton.");
	
	if (this.currentToggled >= 0) {
		this.buttons[this.currentToggled].toggle(false);
	}
	
	this.buttons[index].toggle(true);
	this.currentToggled = index;
};

GuiButtonFamily.prototype.addButton = function(button) {
	if (this.buttons.indexOf(button) < 0) {
		this.buttons.push(button);
	}
};

GuiButtonFamily.prototype.removeButton = function(button) {
	var index = this.buttons.indexOf(button);
	
	if (index >= 0) {
		this.buttons.splice(index, 1);
	}
};
