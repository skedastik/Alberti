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
