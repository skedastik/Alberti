/*
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
 * 'delegate' is a controller object that implements the action method with
 * name 'action'. This method is invoked when the user selects a menu item. It 
 * should take a single argument: the id attribute of the selected menu item 
 * (i.e. a <li> element).
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
 * Each child <li> and trigger element should have a unique id attribute.
 * 
 * * */

// Class name for opened menu item state, for styling purposes
GuiMenu.styleMenuItemOpened = "guiMenuItemOpened";

// Where to place the menu relative to its trigger element
GuiMenu.positionBelow = 1;
GuiMenu.positionAbove = 2;
GuiMenu.positionRight = 3;
GuiMenu.positionLeft  = 4;

// If the trigger button is held down beyond this amount of time (in seconds),
// the menu will automatically close once the mouse is released.
GuiMenu.heldMenuThreshold = 0.35;

// Menu-close fade animation length in seconds
GuiMenu.fadeLength = 0.15;
 
function GuiMenu(id, ulNode, delegate, action, triggerNode, position, parentMenu) {
	GuiMenu.baseConstructor.call(this, id, ulNode, delegate);
	this.action = action;
	this.ulNode = ulNode;
	this.triggerNode = triggerNode;
	this.position = position;
	
	this.subMenus = [];
	this.openedSubMenu = null;                    // Currently opened sub-menu
	this.parentMenu = parentMenu || null;
	                                              
	this.ulNode.style.display = "none";           // Menu is closed by default so hide it
	this.ulNode.style.position = "fixed";         // "Float" the menu above the document
	
	this.opened = false;
	this.openTime = 0;                            // Time at which menu was last opened
	
	this.fadeAnimation = null;
	
	if (parentMenu) {
		// This is a sub-menu, so open self when user hovers over trigger menu item
		this.registerListener("mouseover", document.getElementById(triggerNodeId), false);
	} else {
		// This is a root menu, so create a menu-trigger button
		this.triggerButton = new GuiButton("menu_btn", triggerNode, this, "open", false, "", "mousedown").enable();
	}
}
Util.extend(GuiMenu, GuiControl);

// Make the given GuiMenu a sub-menu of this menu
GuiMenu.prototype.addSubMenu = function(subMenu) {
	this.subMenus.push(subMenu);
};

// Open a menu, activating event listeners
GuiMenu.prototype.open = function() {
	if (!this.opened) {
		this.opened = true;
		
		this.ulNode.style.display = "";
		this.ulNode.style.pointerEvents = "all";
		this.registerListener("mousemove", this.ulNode, false);
	
		// Style the trigger node
		Util.addHtmlClass(this.triggerNode, GuiMenu.styleMenuItemOpened);
	
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
}

// Close the menu and its sub menus, deactivating event listeners. Optionally
// pass 'true' for 'noFade' to suppress fade animation.
GuiMenu.prototype.close = function(noFade) {
	if (this.opened) {
		this.opened = false;
	
		this.ulNode.style.pointerEvents = "none";
		this.unregisterListener("mousemove", this.ulNode, false);
	
		// Remove style from trigger node
		Util.removeHtmlClass(this.triggerNode, GuiMenu.styleMenuItemOpened);
	
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
	
		if (noFade) {
			this.ulNode.style.display = "none";
		} else {
			this.fadeAnimation = new Animation(GuiMenu.fadeLength, function() {
				this.ulNode.style.display = "none";
				this.ulNode.style.opacity = 1;
				this.fadeAnimation = null;
			}.bindTo(this));
		
			this.fadeAnimation.add(this.ulNode.style, "opacity", 1.0, 0);
			this.fadeAnimation.begin();
		}
	}
};

GuiMenu.prototype.isOpen = function() {
	return this.opened;
};

// Position the menu next to its trigger element
GuiMenu.prototype.updatePosition = function() {
	var origin = new Coord2D(Util.getClientX(this.triggerNode), Util.getClientY(this.triggerNode));
	
	switch (this.position) {
		case GuiMenu.positionLeft:
			origin.x -= this.ulNode.clientWidth;
			break;
			
		case GuiMenu.positionRight:
			origin.x += this.triggerNode.clientWidth;
			break;
			
		case GuiMenu.positionAbove:
			origin.y -= this.ulNode.clientHeight;
			break;
		
		default:
			origin.y += this.triggerNode.clientHeight;
			break;
	}
	
	this.ulNode.style.left = origin.x+"px";
	this.ulNode.style.top = origin.y+"px";
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
	evt.stopPropagation();
	
	if (Date.now() - this.openTime >= GuiMenu.heldMenuThreshold * 1000) {
		this.close();
	}
	
	if (this.hasElement(evt.target)) {
		this.invokeAction(this.action, evt.target.id);
	}
};

GuiMenu.prototype.mousedown = function(evt) {
	evt.stopPropagation();
	
	if (!this.menuTreeHasElement(evt.target)) {
		this.close();                              // Close menu if mousedown occurred outside menu
	}
};

GuiMenu.prototype.click = function(evt) {
	evt.stopPropagation();
};

GuiMenu.prototype.mouseover = function(evt) {
	this.open();
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
