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
 * UnderlaySlider.js
 * extends GuiControl
 * 
 * Underlay opacity slider and cabinet. Action method should take two 
 * arguments, the first being a reference to the UnderlaySlider object, the
 * second, the new slider value.
 * 
 * * */

UnderlaySlider.fxLength = 0.25;      // Length of cabinet hide/show animation in seconds

function UnderlaySlider(id, rangeInput, controller, action, cabinetDiv) {
	UnderlaySlider.baseConstructor.call(this, id, rangeInput, controller, action);
	this.cabinetDiv = cabinetDiv;
	
	// Extremely hacky method of obtaining offsetWidth of element that has just loaded
	setTimeout(function() {
		this.cabinetDiv.style.display = "block";
		this.cabinetWidth = this.cabinetDiv.offsetWidth + "px";
		this.cabinetDiv.style.display = "none";
	}.bindTo(this), 0);
	
	this.hidden = true;
	this.animation = null;
	
	// Cabinet is hidden by default. In order to prevent flicker on load, must
	// set "display:none" here even though above timeout sets it.
	this.cabinetDiv.style.display = "none";
	
	this.registerListener("change", this.htmlNode, false);
}
Util.extend(UnderlaySlider, GuiControl);

UnderlaySlider.prototype.show = function() {
	if (this.hidden) {
		this.hidden = false;
		this.cabinetDiv.style.display = "";
		
		if (this.animation) {
			this.animation.stop();
		}
	
		this.animation = new Animation(UnderlaySlider.fxLength);
	
		this.animation.add(this.cabinetDiv.style, "width", "1px", this.cabinetWidth, -1.0);
		this.animation.begin();
	}
};

UnderlaySlider.prototype.hide = function() {
	if (!this.hidden) {
		this.hidden = true;
		
		if (this.animation) {
			this.animation.stop();
		}
		
		this.animation = new Animation(UnderlaySlider.fxLength, function() {
			this.cabinetDiv.style.display = "none";
		}.bindTo(this));
	
		this.animation.add(this.cabinetDiv.style, "width", this.cabinetWidth, "1px", -1.0);
		this.animation.begin();
	}
};

UnderlaySlider.prototype.setValue = function(value) {
	this.htmlNode.value = value;
};

UnderlaySlider.prototype.change = function(evt) {
	this.invokeAction(this.action, this, this.htmlNode.value);
};
