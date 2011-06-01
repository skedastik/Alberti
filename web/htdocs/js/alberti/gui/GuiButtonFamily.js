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
	this.lastToggledButton = null;
}

// Expects a previously-added GuiButton object. Toggles it 'on'.
GuiButtonFamily.prototype.toggleButton = function(button) {
	Util.assert(this.buttons.indexOf(button) >= 0, "Invalid GuiButton object passed to GuiButtonFamily::toggleButton.");
	
	// If a previous button in the family was toggled on, toggle it off
	if (this.lastToggledButton) {
		this.lastToggledButton.toggle(false);
	}
	
	button.toggle(true);
	this.lastToggledButton = button;
};

GuiButtonFamily.prototype.addButton = function(button) {
	Util.assert(
		this.buttons.indexOf(button) < 0,
		"Duplicate GuiButton object passed to GuiButtonFamily::addButton."
	);
	
	this.buttons.push(button);
};

GuiButtonFamily.prototype.removeButton = function(button) {
	var index = this.buttons.indexOf(button);
	
	Util.assert(index >= 0, "Invalid GuiButton object passed to GuiButtonFamily::removeButton.");
	
	this.buttons.splice(index, 1);
	
	// The currently toggled button is being removed, so set lastToggledButton to null
	if (this.lastToggledButton == button) {
		this.lastToggledButton = null;
	}
};
