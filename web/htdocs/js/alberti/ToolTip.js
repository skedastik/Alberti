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
