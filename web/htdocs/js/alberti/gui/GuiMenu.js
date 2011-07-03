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
 * GuiMenu.js
 * extends GuiControl
 * 
 * Turn a <ul> element into a menu.
 * 
 * USAGE
 * 
 * Constructor
 * 
 * 'id' is an ID string that can be named at your convenience. It needn't be
 * unique. 'ulNode' is an unordered list element to be turned into a menu. 
 * 'controller' is a controller object that implements the action method with
 * name 'action'. This method is invoked when the user selects a menu item. It 
 * should take two arguments: the id attribute of the selected menu item (i.e.
 * a <li> element) and the associated click event.
 * 
 * 'triggerNode' is an element by which the menu will reside when it is
 * opened. A GuiButton should be created for the trigger node that opens the 
 * menu on mousedown. 'position' should be one of the GuiMenu position 
 * constants that determine where the menu is placed relative to its trigger 
 * element. You may optionally specify a parent GuiMenu to make this menu a 
 * sub-menu. In this case, triggerNode should be a child <li> element of the 
 * parent menu's <ul> element. A mouseover listener that opens the sub-menu 
 * will automatically be created for the trigger node.
 * 
 * 'offsetX' and 'offsetY' is are optional arguments used to offset the 
 * position of the menu.
 * 
 * If optional 'delayedOpen' argument is true, user must hold mouse down on
 * trigger node for a short span of time in order for menu to open (only has 
 * effect on root menus), or alternatively, use right-click.
 * 
 * Each child <li> and trigger element should have a unique id attribute.
 * 
 * * */

// Class name for opened menu item state, for styling purposes
GuiMenu.styleMenuItemOpened = "guiMenuOpened";
GuiMenu.styleMenuItemDisabled = "guiMenuDisabled";

// Where to place the menu relative to its trigger element
GuiMenu.positionBelow = 1;
GuiMenu.positionAbove = 2;
GuiMenu.positionRight = 3;
GuiMenu.positionLeft  = 4;

GuiMenu.fadeLength = 0.15;    // Menu-close fade animation length in seconds
GuiMenu.openDelay  = 0.2;     // For delayed-open menus, length of open delay in seconds
 
function GuiMenu(id, ulNode, controller, action, triggerNode, position, parentMenu, offsetX, offsetY, delayOpen) {
	GuiMenu.baseConstructor.call(this, id, ulNode, controller, action);
	this.triggerNode = triggerNode;
	this.position = position || GuiMenu.positionBelow;
	this.offsetX = offsetX;
	this.offsetY = offsetY;
	this.delayOpen = delayOpen || false;
	
	this.subMenus = [];
	this.openedSubMenu = null;                    // Currently opened sub-menu
	this.parentMenu = parentMenu || null;
	
	this.disabledMenuItems = [];                  // id attributes of disabled menu items
	
	this.htmlNode.style.display = "none";           // Menu is closed by default so hide it.
	this.htmlNode.style.position = "fixed";
	
	this.opened = false;
	this.openTime = 0;                            // Time at which menu was last opened
	
	this.fadeAnimation = null;
	
	if (this.parentMenu) {
		this.parentMenu.addSubMenu(this);
	} else {
		if (this.delayOpen) {
			this.openTimeoutId = null;
		}
		
		// This is a root menu, so listen for mousedowns on trigger node
		this.registerListener("mousedown", this.triggerNode, false);
	}
}
Util.extend(GuiMenu, GuiControl);

// Make the given GuiMenu a sub-menu of this menu
GuiMenu.prototype.addSubMenu = function(subMenu) {
	this.subMenus.push(subMenu);
	
	// Open self on menu item mouseover
	subMenu.registerListener("mouseover", subMenu.triggerNode, false);
};

GuiMenu.prototype.delayedOpen = function() {
	if (!this.openTimeoutId) {
		this.openTimeoutId = setTimeout(function() {
			this.mouseup();
			this.open();
		}.bindTo(this), GuiMenu.openDelay * 1000);
	
		this.registerListener("mouseup", window, false);
	}
};

// Open a menu, activating event listeners
GuiMenu.prototype.open = function() {
	if (!this.opened) {
		this.opened = true;
		
		this.htmlNode.style.display = "";
		
		if (this.parentMenu) {
			this.parentMenu.openedSubMenu = this;
		}
		
		// Style the trigger node
		Util.addHtmlClass(this.triggerNode, GuiMenu.styleMenuItemOpened);
		
		this.registerListener("mousemove", this.htmlNode, false);
	
		// If a menu does not have a parent menu, it is responsible for closing
		// itself and all sub-menus.
		if (!this.parentMenu) {
			this.registerListener("mousedown", window, true);
			this.registerListener("click", window, true);
			this.registerListener("DOMMouseScroll", window, true);
			this.registerListener("mousewheel", window, true);
			this.registerListener("keydown", window, true);
		
			// Record time at which menu was opened
			this.openTime = Date.now();
		}
	
		// Position the menu next to its trigger element
		this.updatePosition();
	
		if (this.fadeAnimation) {
			this.fadeAnimation.stop();
			this.htmlNode.style.opacity = 1;
		}
	}
}

// Close the menu and its sub menus, deactivating event listeners. Optionally
// pass 'true' for 'noFade' to suppress fade animation.
GuiMenu.prototype.close = function(noFade) {
	if (this.opened) {
		this.opened = false;
		
		this.unregisterListener("mousemove", this.htmlNode, false);
	
		if (!this.parentMenu) {
			this.unregisterListener("mousedown", window, true);
			this.unregisterListener("click", window, true);
			this.unregisterListener("DOMMouseScroll", window, true);
			this.unregisterListener("mousewheel", window, true);
			this.unregisterListener("keydown", window, true);
		}
		
		if (this.openedSubMenu) {
			this.closeSubMenu(noFade);
		}
		
		var resetMenu = function() {
			this.htmlNode.style.display = "none";
			Util.removeHtmlClass(this.triggerNode, GuiMenu.styleMenuItemOpened);      // Remove style from trigger node
		}.bindTo(this);
	
		if (noFade) {
			resetMenu();
		} else {
			this.fadeAnimation = new Animation(GuiMenu.fadeLength, function() {
				resetMenu();
				this.htmlNode.style.opacity = 1;
				this.fadeAnimation = null;
			}.bindTo(this));
		
			this.fadeAnimation.add(this.htmlNode.style, "opacity", 1.0, 0);
			this.fadeAnimation.begin();
		}
	}
};

GuiMenu.prototype.isOpen = function() {
	return this.opened;
};

// Enable menu item whose <li> has the given id attribute
GuiMenu.prototype.enableMenuItem = function(id) {
	var index = this.disabledMenuItems.indexOf(id);
	
	if (index > -1) {
		Util.removeHtmlClass(document.getElementById(id), GuiMenu.styleMenuItemDisabled);
		this.disabledMenuItems.splice(index, 1);
	}
};

// Disable menu item whose <li> has the given id attribute
GuiMenu.prototype.disableMenuItem = function(id) {
	if (this.disabledMenuItems.indexOf(id) == -1) {
		Util.addHtmlClass(document.getElementById(id), GuiMenu.styleMenuItemDisabled);
		this.disabledMenuItems.push(id);
	}
};

// Position the menu next to its trigger element
GuiMenu.prototype.updatePosition = function() {
	var origin = new Coord2D(Util.getClientX(this.triggerNode), Util.getClientY(this.triggerNode));
	
	switch (this.position) {
		case GuiMenu.positionLeft:
			origin.x -= this.htmlNode.clientWidth;
			break;
			
		case GuiMenu.positionRight:
			origin.x += this.triggerNode.clientWidth;
			break;
			
		case GuiMenu.positionAbove:
			origin.y -= this.htmlNode.clientHeight;
			break;
		
		default:
			origin.y += this.triggerNode.clientHeight;
			break;
	}
	
	this.htmlNode.style.left = (origin.x + (this.offsetX ? this.offsetX : 0))+"px";
	this.htmlNode.style.top = (origin.y + (this.offsetY ? this.offsetY : 0))+"px";
};

// Close the currently opened sub-menu. Will produce an error if no sub-menu 
// open. Optionally pass 'true' for 'noFade' to suppress fade animation.
GuiMenu.prototype.closeSubMenu = function(noFade) {
	this.openedSubMenu.close(noFade);
	this.openedSubMenu = null;
};

// Returns true if given element belongs to this menu or its sub-menus, false otherwise.
GuiMenu.prototype.menuTreeHasElement = function(element) {
	var isChild = this.hasElement(element);
	
	for (var i = 0, len = this.subMenus.length; i < len && !isChild; i++) {
		isChild = this.subMenus[i].menuTreeHasElement(element);
	}
	
	return isChild;
};

// Returns true if given element belongs to this menu, false otherwise.
GuiMenu.prototype.hasElement = function(element) {
	return (this.htmlNode === element || Util.hasChild(this.htmlNode, element));
};

GuiMenu.prototype.mousemove = function(evt) {
	if (this.openedSubMenu && evt.target !== this.openedSubMenu.triggerNode) {
		// If user mouses over menu item not corresponding to currently open
		// sub-menu, close the currently open sub-menu.
		this.closeSubMenu(true);
	}
};

GuiMenu.prototype.mouseup = function() {
	if (this.openTimeoutId) {
		clearTimeout(this.openTimeoutId);
		this.openTimeoutId = null;
		this.unregisterListener("mouseup", window, false);
	}
};

GuiMenu.prototype.mousedown = function(evt) {
	if (evt.currentTarget === this.triggerNode) {
		if (this.delayOpen && evt.button == 0) {
			this.delayedOpen();
		} else {
			this.open();
		}
	} else {
		evt.stopPropagation();
		
		if (!this.menuTreeHasElement(evt.target)) {
			this.close();                              // Close menu if mousedown occurred outside menu
		}
	}
};

GuiMenu.prototype.click = function(evt) {
	evt.stopPropagation();
	
	if (evt.target !== this.triggerNode) {
		// Close the menu only if the click occurred somewhere other than the 
		// trigger node (reason being that the mousedown that triggered the 
		// menu to open in the first place will always be followed by a click 
		// event in the trigger node).
		this.close();
	}
	
	// If click occurred within menu, and selected menu item is not disabled,
	// invoke the menu item action. Menu item action can return true in order
	// to prevent menu from closing.
	if (this.menuTreeHasElement(evt.target) && this.disabledMenuItems.indexOf(evt.target.id) == -1) {
		// Invoke the action after the menu fade animation has completed
		setTimeout(function() {
			this.invokeAction(this.action, evt.target.id, evt);
		}.bindTo(this), (GuiMenu.fadeLength + .05) * 1000);
	}
};

GuiMenu.prototype.mouseover = function(evt) {
	if (!this.parentMenu || this.parentMenu.opened) {
		this.open();                                       // Only open self if parent is open        
	}
};

GuiMenu.prototype.keydown = function(evt) {
	evt.stopPropagation();
	
	if (evt.keyCode == KeyCode.esc) {
		this.close();                          // Close menu if esc key pressed
	}
};

GuiMenu.prototype.mousewheel = function(evt) {
	evt.stopPropagation();
	evt.preventDefault();
};

GuiMenu.prototype.DOMMouseScroll = function(evt) {
	evt.stopPropagation();
	evt.preventDefault();
};
