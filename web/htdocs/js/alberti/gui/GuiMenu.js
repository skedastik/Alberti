/*
 * GuiMenu.js
 * extends EventHandler
 * 
 * Turn a <ul> element into a menu.
 * 
 * USAGE
 * 
 * 'ulNode' is an unordered list element to be turned into a menu. 
 * 'triggerNode' is an element by which the menu will reside when it is
 * opened. A mousedown on this element opens the menu (a GuiButton is 
 * automatically generated for this purpose). 'position' should be one of the 
 * GuiMenu position constants that determine where the menu is placed relative 
 * to its trigger element.
 * 
 * Each child <li> element should have a unique id attribute.
 * 
 * * */

// Where to place the menu relative to its trigger element
GuiMenu.below = 1;
GuiMenu.above = 2;
GuiMenu.right = 3;
GuiMenu.left  = 4;

// If the trigger button is held down beyond this amount of time (in seconds),
// the menu will automatically close once the mouse is released.
GuiMenu.heldMenuThreshold = 0.35;
 
function GuiMenu(ulNode, triggerNode, position) {
	GuiMenu.baseConstructor.call(this);
	this.ulNode = ulNode;
	this.triggerNode = triggerNode;
	this.position = position;
	
	this.enabled = true;
	
	this.subMenus = {};                           // Index of sub-menus
	this.openedSubMenu = null;                    // Currently opened sub-menu
	this.parentMenu = null;
	                                              
	this.ulNode.style.display = "none";           // Menu is closed by default so hide it
	this.ulNode.style.position = "fixed";         // "Float" the menu above the document
	
	this.openTime = 0;                            // Time at which menu was last opened
	
	// Create the menu-trigger button
	this.triggerButton = new GuiButton("menu_btn", triggerNode, this, "open", false, "", "mousedown").enable();
}
Util.extend(GuiMenu, EventHandler);

GuiMenu.prototype.enable = function() {
	if (!this.enabled) {
		this.enabled = true;
		this.triggerButton.enable();
	}
};

GuiMenu.prototype.disable = function() {
	if (this.enabled) {
		this.enabled = false;
		this.triggerButton.disable();
	}
};

// Make the given GuiMenu a sub-menu of this menu, using element w/ given id 
// as trigger. Typically this element should be a child <li> element of this 
// menu's <ul> element.
GuiMenu.prototype.addSubMenu = function(subMenu, triggerNodeId) {
	subMenu.parentMenu = this;
	this.subMenus[triggerNodeId] = subMenu;
	this.registerListener("mouseover", document.getElementById(triggerNodeId), false);
};

// Open a menu, activating event listeners
GuiMenu.prototype.open = function() {
	this.ulNode.style.display = "";
	this.registerListener("mousemove", this.ulNode, false);
	
	// If a menu does not have a parent menu, it is responsible for closing
	// itself and all sub-menus on the next mouse click.
	if (!this.parentMenu) {
		this.registerListener("mouseup", window, true);
		this.registerListener("mousedown", window, true);
		this.registerListener("mouseclick", window, true);
	}
	
	// Position the menu next to its trigger element
	this.updatePosition();
	
	// Record time at which menu was opened
	this.openTime = Date.now();
}

// Close the menu and its sub menus, deactivating event listeners
GuiMenu.prototype.close = function() {
	this.ulNode.style.display = "none";
	this.unregisterListener("mousemove", this.ulNode, false);
	
	if (!this.parentMenu) {
		this.unregisterListener("mouseup", window, true);
		this.unregisterListener("mousedown", window, true);
		this.unregisterListener("mouseclick", window, true);
	}
	
	if (this.openedSubMenu) {
		this.closeSubMenu();
	}
};

// Position the menu next to its trigger element
GuiMenu.prototype.updatePosition = function() {
	
};

GuiMenu.prototype.openSubMenu = function(subMenu) {
	this.openedSubMenu = subMenu;
	this.openedSubMenu.open();
};

// Close the currently opened sub-menu. Will produce an error if no sub-menu open.
GuiMenu.prototype.closeSubMenu = function() {
	this.openedSubMenu.close();
	this.openedSubMenu = null;
};

// Return id of given sub-menu or null if sub-menu not found
GuiMenu.prototype.getSubMenuId = function(subMenu) {
	for (var id in this.subMenus) {
		if (subMenu === this.subMenus[id]) {
			return id;
		}
	}
	
	return null;
};

GuiMenu.prototype.mousemove = function(evt) {
	if (this.openedSubMenu
		&& (evt.target == this.ulNode || Util.hasChild(this.ulNode, evt.target))
		&& evt.target.id != this.getSubMenuId(this.openedSubMenu)
	) {
		// If user mouses over menu item not corresponding to currently open
		// sub-menu, close the currently open sub-menu.
		this.closeSubMenu();
	}
};

GuiMenu.prototype.mouseover = function(evt) {
	this.openSubMenu(this.subMenus[evt.target.id])
};

GuiMenu.prototype.mouseup = function(evt) {
	if (Date.now() - this.openTime >= GuiMenu.heldMenuThreshold * 1000) {
		this.close();
	}
};

GuiMenu.prototype.mousedown = function(evt) {
	// TODO: Absorb mouse event if necessary
};

GuiMenu.prototype.mouseclick = function(evt) {
	// TODO: Absorb mouse event if necessary
};
