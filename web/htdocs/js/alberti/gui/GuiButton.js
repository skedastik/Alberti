/*
 * GuiButton.js
 * 
 * A generic button class.
 * 
 * * */

function GuiButton(div, imageName, togglable) {
	GuiButton.baseConstructor.call(this);
	this.divNode = div;
	this.imageName = imageName;
	this.togglable = togglable;
	
	this.toggleOn = false;
}
Util.extend(GuiButton, EventHandler);

GuiButton.prototype.mousedown = function(evt) {
	
};

GuiButton.prototype.mouseup = function(evt) {
	this.toggleOn = this.togglable && !this.toggleOn;
};
