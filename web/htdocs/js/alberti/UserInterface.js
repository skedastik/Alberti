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
 * UserInterface.js
 * extends EventHandler
 * 
 * Prepares the window for mouse and keyboard input.
 * 
 * NOTES
 * 
 * If the user clicks in an empty portion of the workspace, one of two 
 * interactions will be initiated:
 * 
 * (1) If the alt-key was down at the time of the click, a panning operation 
 * takes place
 * 
 * (2) The alt-key was not down. The current tool is activated.
 * 
 * USAGE
 * 
 * The constructor expects a reference to an AlbertiDocument object and
 * ClipBoard object. 'appController' must be a reference to an object that
 * serves as the application controller and implements new-document, save-
 * document, and load-document handler methods (whose names must be provided 
 * in the last three args). The new-doc handler takes no arguments. The save 
 * handler must take a single string argument denoting the export format 
 * (supported formats listen in AlbertiDocument.js). The load handler must 
 * take a string argument containing the XML data of the document to load, and 
 * a string argument containing the filename of the document.
 * 
 * When loading another document, UserInterface::prepareForDocument should be
 * called in order to update the interface with the contents of the new doc.
 * 
 * * */

UserInterface.defaultTool   = "lineTool";

UserInterface.cursorDefault    = "cursorDefault";
UserInterface.cursorZoomAndPan = "cursorZoomAndPan";
UserInterface.cursorCrosshair  = "cursorCrosshair";

function UserInterface(clipBoard, appController, newDocHandler, saveHandler, loadHandler) {
	UserInterface.baseConstructor.call(this);
	this.clipBoard = clipBoard;
	this.appController = appController;
	this.newDocHandler = newDocHandler;
	this.saveHandler = saveHandler;
	this.loadHandler = loadHandler;
	
	this.toolTip = new ToolTip(document.getElementById("tooltip"));
	
	// Initialization broken up into methods below; order is sensitive
	this.initSvg();
	this.initAutoScale();
	this.initLayerPanel();
	this.initMenuBar();
	this.initToolBar();
	this.initToolSet();
	this.initFileImporters();
	
	// Set up listeners at the window level
	this.registerListener("keydown", window, false);
	this.registerListener("keyup", window, false);
	
	// Suppress the right-click context menu
	this.registerListener("contextmenu", window, true);
	
	// Warn user about unsaved data before leaving page
	window.onbeforeunload = function(evt) {
		if (!this.umDelegate.stateIsClean()) {
			var msg = "There are unsaved changes to this document.";
			evt.returnValue = msg;
			return msg;
		}
	}.bindTo(this);
}
Util.extend(UserInterface, EventHandler);

// Prepares the interface for the given Alberti document
UserInterface.prototype.prepareForDocument = function(albertiDoc) {
	this.underlayImage = albertiDoc.underlayImage;
	this.umDelegate = new UndoManagerDelegate(albertiDoc.undoManager, this);
	
	if (!this.underlayImage.isHidden()) {
		this.hideHud();
		this.ulSlider.show();
		this.ulMenu.enableMenuItem("mi_remove_ul");       // Enable "Remove Underlay" menu item
		this.ulSlider.setValue(1.0);                      // Reset slider to full opacity
	} else {
		this.showHud();
		this.ulSlider.hide();
		this.ulMenu.disableMenuItem("mi_remove_ul");      // Disable "Remove Underlay" menu item
	}
	
	// Clean up zoom & pan event listeners
	if (this.zap) {
		this.zap.killAllListeners();
	}
	
	// Create controller for layer panel and connect it to layer panel
	this.lpController = new LayerPanelController(this.layerPanel);
	this.layerPanel.setController(this.lpController);
	
	// Create layer manager delegate and connect it to layer panel controller
	this.lmDelegate = new LayerManagerDelegate(albertiDoc.layerManager, this.lpController, this);
	this.lpController.setLayerManagerDelegate(this.lmDelegate);
	
	// Tell layer panel controller to populate layer panel with data
	this.lpController.populateLayerPanel();
	
	// Enable our own zooming and panning mechanism
	this.zap = new Zap(this.masterGroup, this.autoScale, this.lmDelegate, this.underlayImage, this.toolTip);
	
	// Update tools w/ new managers
	for (var toolName in this.toolIndex) {
		this.toolIndex[toolName].tool.setManagers(this.lmDelegate, this.umDelegate);
	}
	
	if (this.currentTool === null) {
		this.setTool(UserInterface.defaultTool);
	}
	
	// Update menus
	this.updateUndoMenuItems();
	this.updateClippingMenuItems();
	
	// So that all changes to model are propagated to view...
	albertiDoc.connectDelegates(this.lmDelegate, this.umDelegate);
};

UserInterface.prototype.setTool = function(toolName) {
	if (this.toolIndex[toolName] && toolName != this.currentTool) {
		if (this.currentTool !== null) {
			this.toolIndex[this.currentTool].tool.deactivate();
		}
		
		this.currentTool = toolName;
		this.toolIndex[this.currentTool].tool.activate();
		this.setCursorToCurrentTool();
	}
};

UserInterface.prototype.setCursorToCurrentTool = function() {
	this.setCursor(this.toolIndex[this.currentTool].cursor);
};

UserInterface.prototype.setCursor = function(cursorClass) {
	this.rootGroup.set("class", cursorClass);
};

UserInterface.prototype.showHud = function() {
	this.hudGroup.set("display", "");
};

UserInterface.prototype.hideHud = function() {
	this.hudGroup.set("display", "none");
};

UserInterface.prototype.initSvg = function() {
	// staticUnderlayGroup contains non-interactive HUD elements, rendered 
	// below all other groups, unaffected by dynamic coordinate system 
	// transformations. It's origin is in the upper-left corner of the window.
	this.staticUnderlayGroup = new Group(document.getElementById("static_underlay"));
	
	// The root group is used to center the Alberti coordinate system's origin in the window
	this.rootGroup = new Group(document.getElementById("root"));
	
	if (Alberti.crispLines) {
		this.rootGroup.positionAbsolute(Alberti.halfOriginalWindowWidth, Alberti.halfOriginalWindowHeight);
	} else {
		this.rootGroup.positionAbsolute(Alberti.halfOriginalWindowWidth + 0.5, Alberti.halfOriginalWindowHeight + 0.5);
	}
	
	this.rootGroup.push();
	
	// staticOverlayGroup contains non-interactive HUD elements, rendered 
	// above all other groups, unaffected by dynamic coordinate system 
	// transformations. Its origin is in the upper left corner of the window.
	this.staticOverlayGroup = new Group(document.getElementById("static_overlay"));
	
	// masterGroup contains interactive elements and is used to perform 
	// dynamic coordinate system transformations (namely, for panning and 
	// zooming purposes)
	this.masterGroup = new Group(document.getElementById("master"));
	
	if (Alberti.crispLines) {
		this.masterGroup.set("class", "optimized");
	}
	
	// underlayGroup contains UI elements that should be rendered beneath the
	// workspace group, and beneath the center HUD
	this.underlayGroup = new Group(document.getElementById("underlay"));
	
	// overlayGroup contains UI elements that should be rendered above the 
	// workspace group
	this.overlayGroup = new Group(document.getElementById("overlay"));
	
	// The hud group contains the center HUD--an 'X' displayed at the center 
	// of the workspace at all times.
	this.hudGroup = new Group(document.getElementById("hud"));
};

UserInterface.prototype.initToolSet = function() {
	var uiObjects = {
		masterGroup:   this.masterGroup,
		overlayGroup:  this.overlayGroup,
		underlayGroup: this.underlayGroup,
		toolTip:       this.toolTip
	};
	
	this.toolIndex = {
		selectionTool:     {tool: new ToolSelection(uiObjects),     cursor: UserInterface.cursorDefault},
		lineTool:          {tool: new ToolLine(uiObjects),          cursor: UserInterface.cursorCrosshair },
		circularArcTool:   {tool: new ToolCircleArc(uiObjects),     cursor: UserInterface.cursorCrosshair },
		ellipticalArcTool: {tool: new ToolEllipticalArc(uiObjects), cursor: UserInterface.cursorCrosshair }
	};
	
	// Map tool button id strings to above tool indices
	this.tbButtonMap = {
		select_tool_btn:   "selectionTool",
		line_tool_btn:     "lineTool",
		carc_tool_btn:     "circularArcTool",
		earc_tool_btn:     "ellipticalArcTool"
	}
	
	// Map key codes to toolbar buttons
	this.tbHotKeys = {
		49: this.selectToolBtn,                     // '1'
		50: this.lineToolBtn,                       // '2'
		51: this.circularArcToolBtn,                // '3'
		52: this.ellipticalArcToolBtn               // '4'
	}
	
	this.currentTool = null;
};

UserInterface.prototype.initAutoScale = function() {
	// SVG has no shape element for individual points, so we use a special SVG
	// group as a template. This group must be auto-scaled.
	var pointTemplate = new SvgContainer(document.getElementById(Point.templateId));
	
	// Register the center HUD, the master group, the Point template, and
	// dashed-line styles for auto-scaling (see AutoScale.js for details).
	this.autoScale = new AutoScale();
	this.autoScale.registerObject(this.masterGroup, AutoScale.lineWidth, Alberti.defaultLineWidth);
	this.autoScale.registerObject(pointTemplate, AutoScale.scale, 1.0);
	this.autoScale.registerObject(this.hudGroup, AutoScale.scale, 1.0);
	this.autoScale.registerStyle(document.styleSheets[0].cssRules[0].style, AutoScale.dashArray, 4);
};

UserInterface.prototype.initFileImporters = function() {
	// Create file importer for loading Alberti documents, and one for loading underlay images, passing self as controller
	this.docImporter = new FileImporter(
		document.getElementById("fi"), "image/svg+xml", true, this.appController, "handleOpenDocument", "svg"
	);
	
	this.ulImgImporter = new FileImporter(
		document.getElementById("uii"),
		"image/gif,image/jpeg,image/png,image/tiff",
		false,
		this,
		"handleImportUlImage", "jpg|jpeg|png|tiff|tif|gif"
	);
};

UserInterface.prototype.initLayerPanel = function() {
	var mainDiv = document.getElementById("layer_panel");
	var dynamicDiv = document.getElementById("layer_panel_dynamic");
	var cstripDiv = document.getElementById("layer_panel_control_strip");
	
	var insertMarkDiv = document.createElement("div");
	insertMarkDiv.id = "insertmark";
	document.body.appendChild(insertMarkDiv);
	
	this.layerPanel = new LayerPanel(mainDiv, dynamicDiv, cstripDiv, insertMarkDiv);
};

// Initialize the menu bar
UserInterface.prototype.initMenuBar = function() {
	this.fileMenu = new GuiMenu("file_menu",
		document.getElementById("file_menu"), this, "handleMenu",
		document.getElementById("file_menu_btn")
	);
	
	this.editMenu = new GuiMenu("edit_menu",
		document.getElementById("edit_menu"), this, "handleMenu",
		document.getElementById("edit_menu_btn")
	);
	
	this.ulMenu = new GuiMenu("ul_menu",
		document.getElementById("ul_menu"), this, "handleMenu",
		document.getElementById("ul_menu_btn")
	);
	
	this.editMenu.disableMenuItem("mi_paste");
	this.ulMenu.disableMenuItem("mi_remove_ul");
	
	this.menuBar = new GuiMenuBar();
	this.menuBar.addMenu(this.fileMenu);
	this.menuBar.addMenu(this.editMenu);
	
	this.ulSlider = new UnderlaySlider("ul_slider", document.getElementById("ul_opac_slider"),
		this, "handleUlSlider", document.getElementById("ul_slider_cab")
	);
};

UserInterface.prototype.initToolBar = function() {
	this.selectToolBtn = new GuiButton("select_tool_btn", document.getElementById("select_tool_btn"), 
		this, "handleToolBar", false, "Selection Tool [1]", "", true
	).enable();
	
	this.lineToolBtn = new GuiButton("line_tool_btn", document.getElementById("line_tool_btn"), 
		this, "handleToolBar", false, "Line Tool [2]", "", true
	).enable();
	
	this.circularArcToolBtn = new GuiButton("carc_tool_btn", document.getElementById("carc_tool_btn"), 
		this, "handleToolBar", false, "Circular Arc Tool [3]", "", true
	).enable();
	
	this.ellipticalArcToolBtn = new GuiButton("earc_tool_btn", document.getElementById("earc_tool_btn"), 
		this, "handleToolBar", false, "Perspective Arc Tool [4]", "", true
	).enable();
	
	this.tbButtonFamily = new GuiButtonFamily();
	this.tbButtonFamily.addButton(this.selectToolBtn);
	this.tbButtonFamily.addButton(this.lineToolBtn);
	this.tbButtonFamily.addButton(this.circularArcToolBtn);
	this.tbButtonFamily.addButton(this.ellipticalArcToolBtn);
	
	this.tbButtonFamily.toggleButton(this.lineToolBtn);
};

// If hasUndos is true, enables Undo menu item, otherwise disables it. 
// Likewise for hasRedos.
UserInterface.prototype.updateUndoMenuItems = function(hasUndos, hasRedos) {
	if (hasUndos) {
		this.editMenu.enableMenuItem("mi_undo");
	} else {
		this.editMenu.disableMenuItem("mi_undo");
	}
	
	if (hasRedos) {
		this.editMenu.enableMenuItem("mi_redo");
	} else {
		this.editMenu.disableMenuItem("mi_redo");
	}
};

// If shapesAreSelected is true, enables appropriate clip board menu items,
// otherwise disables them.
UserInterface.prototype.updateClippingMenuItems = function(shapesAreSelected) {
	if (shapesAreSelected) {
		this.editMenu.enableMenuItem("mi_cut");
		this.editMenu.enableMenuItem("mi_delete");
	} else {
		this.editMenu.disableMenuItem("mi_cut");
		this.editMenu.disableMenuItem("mi_delete");
	}
};

// Asks user to confirm discarding of unsaved changes. Returns true without
// prompting user if there are no unsaved changes, or if the user chooses to 
// discard the unsaved changes. Otherwise returns false.
UserInterface.prototype.discardUnsavedChanges = function() {
	if (!this.umDelegate.stateIsClean()) {
		return confirm("There are unsaved changes to this document. Are you sure you want to discard these changes and open another document?");
	}
	
	return true;
};

UserInterface.prototype.handleImportUlImage = function(imgDataUrl) {
	this.underlayImage.setSourceToDataUrl(imgDataUrl);
	this.underlayImage.opacity = 1;                     // Set underlay image to fully opaque on import
	this.zap.updateUnderlayImage();                     // Update underlay image to match current zoom & pan
	this.underlayImage.show();

	this.hideHud();                                     // Hide the HUD

	this.ulMenu.enableMenuItem("mi_remove_ul");         // Enable "Remove Underlay" menu item
	this.ulSlider.show();                               // Show the underlay opacity slider
	this.ulSlider.setValue(1.0);                        // Reset slider to full opacity
};

UserInterface.prototype.handleMenu = function(itemId) {
	switch (itemId) {
		
		// New document
		case "mi_new_doc":
			var createNewDoc = true;
			
			// Warn the user of unsaved changes before creating a new document
			if (!this.umDelegate.stateIsClean()) {
				createNewDoc = confirm("There are unsaved changes to this document. Are you sure you want to discard these changes and create a new document?");
			}
			
			if (createNewDoc) {
				this.appController[this.newDocHandler]();        // Invoke app controller's new document handler
			}
			break;
		
		// Open document
		case "mi_open_doc":
			if (this.discardUnsavedChanges()) {
				this.docImporter.prompt();                         // Prompt the user to open a file
			}
			break;
		
		// Save document
		case "mi_save_doc":
			this.appController[this.saveHandler]();          // Invoke app controller's save document handler
			break;
		
		case "mi_undo":
			this.umDelegate.undo();
			break;
			
		case "mi_redo":
			this.umDelegate.redo();
			break;
			
		case "mi_cut":
			var selectedShapes = this.lmDelegate.getSelectedShapes();
			
			if (selectedShapes.length > 0) {
				this.clipBoard.copy(selectedShapes);
				this.lmDelegate.deleteSelectedShapes();
				
				this.editMenu.enableMenuItem("mi_paste");
			}
			break;
			
		case "mi_paste":
			if (!this.clipBoard.isEmpty()) {
				this.umDelegate.recordStart();      // Buffer pasted-shape insertions into a single undo
				this.clipBoard.paste(this.lmDelegate);
				this.umDelegate.recordStop();
			
				// Pasting the same content multiple times makes no sense in 
				// Alberti, so clear the clip board after a paste.
				this.clipBoard.clear();
				
				this.editMenu.disableMenuItem("mi_paste");
			}
			break;
		
		case "mi_delete":
			this.lmDelegate.deleteSelectedShapes();
			break;
		
		case "mi_select_all":
			this.lmDelegate.setSelection(this.lmDelegate.getShapesInCurrentLayer());
			break;
		
		case "mi_import_ul":
			this.ulImgImporter.prompt();
			break;
		
		case "mi_remove_ul":
			this.underlayImage.hide();
			this.ulMenu.disableMenuItem("mi_remove_ul");      // Disable "Remove Underlay" menu item
			this.ulSlider.hide();                             // Hide the underlay opacity slider
			this.showHud();
			break;
	}
};

UserInterface.prototype.handleToolBarItemId = function(btnId) {
	this.setTool(this.tbButtonMap[btnId]);
};

UserInterface.prototype.handleToolBar = function(button) {
	this.handleToolBarItemId(button.getId());
	this.tbButtonFamily.toggleButton(button);
};

UserInterface.prototype.handleUlSlider = function(ulSlider, value) {
	if (value > 0) {
		this.underlayImage.show();
		this.underlayImage.opacity = value;
		this.underlayImage.update();
		this.hideHud();
	} else {
		this.underlayImage.hide();
		this.showHud();
	}
};

UserInterface.prototype.keydown = function(evt) {
	if (!evt.shiftKey) {
		switch (evt.keyCode) {
		
			// Activate panning
			case KeyCode.alt:
				// Enable panning while the alt-key and no other keys are pressed
				this.zap.enablePanning();
				this.setCursor(UserInterface.cursorZoomAndPan);
			
				// Disable tool while panning is enabled
				this.toolIndex[this.currentTool].tool.disable();
				break;
		
			// Delete shape(s)
			case KeyCode.del:
			case KeyCode.backspace:
				this.handleMenu("mi_delete");
			
				// Attempt to suppress backspace-key navigation.
				evt.preventDefault();
				break;
			
			case KeyCode.selectAll:
				this.handleMenu("mi_select_all");
				break;
			
			// Undo
			case KeyCode.undo:
				this.handleMenu("mi_undo");
				break;
		
			// Redo
			case KeyCode.redo:
				this.handleMenu("mi_redo");
				break;
		
			// Cut shape(s)
			case KeyCode.cut:
				this.handleMenu("mi_cut");
				break;
		
			// Paste shape(s)
			case KeyCode.paste:
				this.handleMenu("mi_paste");
				break;
		
			// Collapse/reveal layer panel
			case KeyCode.lpCollapse:
				this.layerPanel.toggleCollapse();
				break;
		
			// Select next highest visible layer
			case KeyCode.arrowUp:
				this.lmDelegate.switchToVisibleLayerAboveCurrentLayer();
				this.toolTip.setText("Select layer: "+this.lmDelegate.getCurrentLayer().name, true);
				break;
		
			// Select next lowest visible layer
			case KeyCode.arrowDown:
				this.lmDelegate.switchToVisibleLayerBelowCurrentLayer();
				this.toolTip.setText("Select layer: "+this.lmDelegate.getCurrentLayer().name, true);
				break;
		
			default:
				// If toolbar hotkey was pressed, click corresponding toolbar button
				var tbButton = this.tbHotKeys[evt.keyCode.toString()];
				if (tbButton) {
					tbButton.click();
				}
				break;
		}
	} else {
		switch (evt.keyCode) {
			
			// Create a new document
			case KeyCode.newDoc:
				this.handleMenu("mi_new_doc");
				break;

			// Save document
			case KeyCode.save:
				this.handleMenu("mi_save_doc");
				break;

			// Open document
			case KeyCode.load:
				if (this.discardUnsavedChanges()) {
					this.docImporter.prompt();                         // Prompt the user to open a file
				}
				break;
		}
	}
};

UserInterface.prototype.keyup = function(evt) {
	switch(evt.keyCode) {
		case KeyCode.alt:
			// stop panning when alt-key is released
			this.zap.disablePanning();
			this.setCursorToCurrentTool();
			
			// enable tool while panning is disabled
			this.toolIndex[this.currentTool].tool.enable();
			break;
	}
};

UserInterface.prototype.contextmenu = function(evt) {
	evt.preventDefault();
};
