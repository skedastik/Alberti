/*
 * ToolTip.js
 * 
 * Textual tool tips.
 * 
 * TODO
 * 
 * - Move window resizing awareness into UserInterface.
 * 
 * * */

ToolTip.hiPriorityTime = 0.75;      // High priority messages will display for a minimum of time (seconds)

function ToolTip(staticOverlayGroup) {
	ToolTip.baseConstructor.call(this);
	this.staticOverlayGroup = staticOverlayGroup;
	
	this.clearTimeoutId = null;
	
	this.lastHiPriorityCall = 0;
	
	this.tipText = new Text().generate();
	this.updateTextPosition();
	this.staticOverlayGroup.attachChild(this.tipText);
	
	this.registerListener("resize", window, false);
}
Util.extend(ToolTip, EventHandler);

// If autoClear is true, the text will automatically clear after a period of
// time determined by text word count. If hiPriority is set to true, future
// calls to setText will not take effect unless a minimum amount of time
// has passed since the high priority tip was displayed, or another high
// priority call is made.
ToolTip.prototype.setText = function(text, autoClear, hiPriority) {
	if (Alberti.showToolTips && (hiPriority || Date.now() - this.lastHiPriorityCall >= ToolTip.hiPriorityTime * 1000)) {
		this.cancelAutoClear();
			
		if (hiPriority && text != "") {
			// Only record high priority time if tooltip string is non-empty
			this.lastHiPriorityCall = Date.now();
		}
		
		this.tipText.textData = text;
		this.tipText.push();
		
		if (autoClear && text) {
			var wordCount = text.match(/\S+/g).length;
			var clearTime = (wordCount * 0.24) + 1;
		
			this.clearTimeoutId = window.setTimeout(
				function() {
					this.clearText();
					this.clearTimeoutId = null;
				}.bindTo(this),
				clearTime * 1000
			);
		}
	}
};

ToolTip.prototype.clearText = function() {
	this.cancelAutoClear();
	this.setText("", false, true);
};

ToolTip.prototype.updateTextPosition = function() {
	// this.tipText.anchor.x = Math.round(window.innerWidth / 2);
	// this.tipText.anchor.y = window.innerHeight - 8;
	this.tipText.anchor.x = 7;
	this.tipText.anchor.y = 15;
	this.tipText.push();
};

ToolTip.prototype.resize = function() {
	this.updateTextPosition();
};

ToolTip.prototype.cancelAutoClear = function() {
	if (this.clearTimeoutId) {
		window.clearTimeout(this.clearTimeoutId);
		this.clearTimeoutId = null;
	}
};
