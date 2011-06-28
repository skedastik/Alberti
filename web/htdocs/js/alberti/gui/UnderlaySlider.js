/*
 * UnderlaySlider.js
 * extends GuiControl
 * 
 * Underlay opacity slider and cabinet. Action method should take two 
 * arguments, the first being a reference to the UnderlaySlider object, the
 * second, the new slider value.
 * 
 * * */

UnderlaySlider.fxLength = 0.25;      // Length of cabinet hide/show animation in seconds

function UnderlaySlider(id, rangeInput, delegate, action, cabinetDiv) {
	UnderlaySlider.baseConstructor.call(this, id, rangeInput, delegate);
	this.action = action;
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
