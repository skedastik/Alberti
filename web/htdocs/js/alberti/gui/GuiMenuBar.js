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
 * GuiMenuBar.js
 * extends EventHandler
 * 
 * A family of root GuiMenus (menus without sub-menus). Allows related menus
 * to be opened via mouseover instead of mousedown.
 * 
 * * */

function GuiMenuBar() {
	GuiMenuBar.baseConstructor.call(this);
	this.menuMap = {};                       // Maps trigger node id's to GuiMenus
	this.openMenu = null;                    // Currently opened menu
}
Util.extend(GuiMenuBar, EventHandler);

GuiMenuBar.prototype.addMenu = function(guiMenu) {
	this.menuMap[guiMenu.triggerNode.id] = guiMenu;
	this.registerListener("mousedown", guiMenu.triggerNode, false);
};

// Start responding to mouseovers
GuiMenuBar.prototype.activate = function() {
	for (var id in this.menuMap) {
		this.registerListener("mouseover", this.menuMap[id].triggerNode, false);
	}
};

// Stop responding to mouseovers
GuiMenuBar.prototype.deactivate = function() {
	if (this.openMenu) {
		this.openMenu.close();
		this.openMenu = null;
		
		for (var id in this.menuMap) {
			this.unregisterListener("mouseover", this.menuMap[id].triggerNode, false);
		}
	}
};

GuiMenuBar.prototype.mouseover = function(evt) {
	var menu = this.menuMap[evt.target.id];
	
	if (this.openMenu.isOpen()) {
		if (menu != this.openMenu) {
			menu.open();
	
			this.openMenu.close(true);
			this.openMenu = menu;
		}
	} else {
		this.deactivate();      // Last opened menu closed prior to mouseover, so deactivate listeners
	}
};

GuiMenuBar.prototype.mousedown = function(evt) {
	this.openMenu = this.menuMap[evt.target.id];
	this.activate();
}
