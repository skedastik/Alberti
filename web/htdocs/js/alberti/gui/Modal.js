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
 * Modal.js
 * extends EventHandler
 * 
 * A modal in-page popup box.
 * 
 * USAGE
 * 
 * 'popupDiv' is a div element containing the popup. 'closeBoxDiv' is a div
 * that should be clicked to close the popup (this div must be contained by 
 * the popup div).
 * 
 * * */

Modal.curtainOpacity = 0.6;               // Opacity of modal curtain

function Modal(popupDiv, closeBoxDiv) {
	Modal.baseConstructor.call(this);
	this.popupDiv = popupDiv;
	this.closeBoxDiv = closeBoxDiv;
	this.curtainDiv = null;               // Full screen div that covers page for modality
	
	this.popupDiv.style.display = "none";
}
Util.extend(Modal, EventHandler);

Modal.prototype.show = function() {
	this.curtainDiv = document.createElement("div");
	this.curtainDiv.style.position = "fixed";
	this.curtainDiv.style.width = "100%";
	this.curtainDiv.style.height = "100%";
	this.curtainDiv.style.background = "#000";
	this.curtainDiv.style.opacity = Modal.curtainOpacity;
	
	document.body.appendChild(this.curtainDiv);
	this.popupDiv.parentNode.removeChild(this.popupDiv);      // Place popup div above curtain
	document.body.appendChild(this.popupDiv);
	this.popupDiv.style.display = "";
	
	this.registerListener("mousedown", this.closeBoxDiv, false);
	this.registerListener("keydown", window, false);
};

Modal.prototype.hide = function() {
	this.unregisterListener("mousedown", this.closeBoxDiv, false);
	this.unregisterListener("keydown", window, false);
	
	this.popupDiv.style.display = "none";
	this.curtainDiv.parentNode.removeChild(this.curtainDiv);
	this.curtainDiv = null;
};

Modal.prototype.mousedown = function(evt) {
	this.hide();
};

Modal.prototype.keydown = function(evt) {
	if (evt.keyCode == KeyCode.esc) {
		this.hide();
	}
};
