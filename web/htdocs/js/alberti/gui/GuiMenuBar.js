/*
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
