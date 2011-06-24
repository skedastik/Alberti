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
 * opened. A GuiButton should be created for the trigger node that opens the 
 * menu on mousedown. 'position' should be one of the GuiMenu position 
 * constants that determine where the menu is placed relative to its trigger 
 * element. You may optionally specify a parent GuiMenu to make this menu a 
 * sub-menu. In this case, triggerNode should be a child <li> element of the 
 * parent menu's <ul> element. A mouseover listener that opens the sub-menu 
 * will automatically be created for the trigger node.
 * 
 * Each child <li> and trigger element should have a unique id attribute.
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

// Menu-close fade animation length in seconds
GuiMenu.fadeLength = 0.15;
 
function GuiMenu(ulNode, triggerNode, position, parentMenu) {
	GuiMenu.baseConstructor.call(this);
	this.ulNode = ulNode;
	this.triggerNode = triggerNode;
	this.position = position;
	
	this.subMenus = [];
	this.openedSubMenu = null;                    // Currently opened sub-menu
	this.parentMenu = parentMenu || null;
	                                              
	this.ulNode.style.display = "none";           // Menu is closed by default so hide it
	this.ulNode.style.position = "fixed";         // "Float" the menu above the document
	
	this.openTime = 0;                            // Time at which menu was last opened
	
	this.fadeAnimation = null;
	
	if (parentMenu) {
		this.registerListener("mouseover", document.getElementById(triggerNodeId), false);
	} else {
		// Create the menu-trigger button
		this.triggerButton = new GuiButton("menu_btn", triggerNode, this, "open", false, "", "mousedown").enable();
	}
}
Util.extend(GuiMenu, EventHandler);

// Make the given GuiMenu a sub-menu of this menu, using element w/ given id 
// as trigger. Typically this element should be a child <li> element of this 
// menu's <ul> element.
GuiMenu.prototype.addSubMenu = function(subMenu) {
	this.subMenus[triggerNodeId] = subMenu;
};

// Open a menu, activating event listeners
GuiMenu.prototype.open = function() {
	this.ulNode.style.display = "";
	this.registerListener("mousemove", this.ulNode, false);
	
	// If a menu does not have a parent menu, it is responsible for closing
	// itself and all sub-menus.
	if (!this.parentMenu) {
		this.registerListener("mouseup", window, true);
		this.registerListener("mousedown", window, true);
		this.registerListener("click", window, true);
		this.registerListener("DOMMouseScroll", window, true);
		this.registerListener("mousewheel", window, true);
		this.registerListener("keydown", window, false);
		
		// Record time at which menu was opened
		this.openTime = Date.now();
	}
	
	// Position the menu next to its trigger element
	this.updatePosition();
	
	if (this.fadeAnimation) {
		this.fadeAnimation.stop();
		this.ulNode.style.opacity = 1;
	}
}

// Close the menu and its sub menus, deactivating event listeners
GuiMenu.prototype.close = function() {
	this.unregisterListener("mousemove", this.ulNode, false);
	
	if (!this.parentMenu) {
		this.unregisterListener("mouseup", window, true);
		this.unregisterListener("mousedown", window, true);
		this.unregisterListener("click", window, true);
		this.unregisterListener("DOMMouseScroll", window, true);
		this.unregisterListener("mousewheel", window, true);
		this.unregisterListener("keydown", window, false);
	}
	
	if (this.openedSubMenu) {
		this.closeSubMenu();
	}
	
	this.fadeAnimation = new Animation(GuiMenu.fadeLength, function() {
		this.ulNode.style.display = "none";
		this.ulNode.style.opacity = 1;
		this.fadeAnimation = null;
	}.bindTo(this));
	
	this.fadeAnimation.add(this.ulNode.style, "opacity", 1.0, 0);
	this.fadeAnimation.begin();
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

// Returns true if given element belongs to this menu or its sub-menus, false otherwise.
GuiMenu.prototype.menuTreeHasElement = function(element) {
	var isChild = this.hasElement(element);
	
	for (var i = 0, len = this.subMenus.length; i < len && isChild; i++) {
		isChild = this.subMenus[i].hasElement(element);
	}
	
	return isChild;
};

// Returns true if given element belongs to this menu, false otherwise.
GuiMenu.prototype.hasElement = function(element) {
	return (this.ulNode === element || Util.hasChild(this.ulNode, element));
};

GuiMenu.prototype.mousemove = function(evt) {
	if (this.openedSubMenu
		&& evt.target !== this.openedSubMenu.triggerNode
	) {
		// If user mouses over menu item not corresponding to currently open
		// sub-menu, close the currently open sub-menu.
		this.closeSubMenu();
	}
};

GuiMenu.prototype.mouseup = function(evt) {
	if (Date.now() - this.openTime >= GuiMenu.heldMenuThreshold * 1000) {
		this.close();
	}
	
	evt.stopPropagation();
};

GuiMenu.prototype.mousedown = function(evt) {
	if (!this.menuTreeHasElement(evt.target)) {
		// Close menu if mousedown occurred outisde menu
		this.close();
	}
	
	evt.stopPropagation();
};

GuiMenu.prototype.click = function(evt) {
	evt.stopPropagation();
};

GuiMenu.prototype.keydown = function(evt) {
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
