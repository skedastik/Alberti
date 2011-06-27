/*
 * ToolTip.js
 * 
 * Textual tool tips.
 * 
 * * */

ToolTip.hiPriorityTime = 0.75;      // High priority messages will display for a minimum of time (seconds)

function ToolTip(div) {
	this.div = div;                 // div element that holds tool tip text
	this.clearTimeoutId = null;
	this.lastHiPriorityCall = 0;
}

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
		
		this.div.innerHTML = text;
		
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

ToolTip.prototype.cancelAutoClear = function() {
	if (this.clearTimeoutId) {
		window.clearTimeout(this.clearTimeoutId);
		this.clearTimeoutId = null;
	}
};
