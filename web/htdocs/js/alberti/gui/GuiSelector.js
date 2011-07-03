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
 * GuiSelector.js
 * 
 * A selector is comprised of a GuiButton and a GuiMenu. Whenever a menu item
 * is selected, the button's state is updated with the selected menu item.
 * 
 * USAGE
 * 
 * The constructor expects a reference to an existing GuiButton and GuiMenu
 * (the GuiMenu should have been constructed with null 'controller' and 
 * 'action' arguments), and an object mapping menu item id strings to button 
 * state strings, e.g.:
 * 
 *    var selector = new GuiSelector(guiButton, guiMenu, {
 *       mi_foo: foo_state,
 *       mi_bar: bar_state
 *    });
 * 
 * Now, whenever a menu item belonging to guiMenu is selected, guiButton will
 * have its state updated with the mapped button state string.
 * 
 * * */
 
function GuiSelector(guiButton, guiMenu, stateMap) {
	this.guiButton = guiButton;
	this.guiMenu = guiMenu;
	this.stateMap = stateMap;
	
	this.guiMenu.connect(this, "handleMenu");
}

GuiSelector.prototype.handleMenu = function(itemId) {
	this.guiButton.setState(this.stateMap[itemId]);
};
