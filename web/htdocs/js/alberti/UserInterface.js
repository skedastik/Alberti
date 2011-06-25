/*
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

UserInterface.selectionTool = 0;
UserInterface.lineTool      = 1;
UserInterface.circleArcTool = 2;
UserInterface.defaultTool   = UserInterface.lineTool;

UserInterface.menuItemNewDoc = "mi_new_doc";
UserInterface.menuItemOpenDoc = "mi_open_doc";
UserInterface.menuItemSaveDoc = "mi_save_doc";
UserInterface.menuItemUndo = "mi_undo";
UserInterface.menuItemRedo = "mi_redo";
UserInterface.menuItemCut = "mi_cut";
UserInterface.menuItemPaste = "mi_paste";

UserInterface.cursorDefault    = "cursorDefault";
UserInterface.cursorZoomAndPan = "cursorZoomAndPan";
UserInterface.cursorCrosshair  = "cursorCrosshair";

function UserInterface(albertiDoc, clipBoard, appController, newDocHandler, saveHandler, loadHandler) {
	UserInterface.baseConstructor.call(this);
	this.clipBoard = clipBoard;
	this.appController = appController;
	this.newDocHandler = newDocHandler;
	this.saveHandler = saveHandler;
	this.loadHandler = loadHandler;
	
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
	
	// SVG has no shape element for individual points, so we use a special SVG
	// group as a template.
	var pointTemplate = new SvgContainer(document.getElementById(Point.templateId));
	
	// Register the center HUD, the master group, the Point template, and
	// dashed-line styles for auto-scaling (see AutoScale.js for details).
	this.autoScale = new AutoScale();
	this.autoScale.registerObject(this.masterGroup, AutoScale.lineWidth, Alberti.defaultLineWidth);
	this.autoScale.registerObject(pointTemplate, AutoScale.scale, 1.0);
	this.autoScale.registerObject(this.hudGroup, AutoScale.scale, 1.0);
	this.autoScale.registerStyle(document.styleSheets[0].cssRules[0].style, AutoScale.dashArray, 4);
	
	// The layer panel provides an interface for the manipulation of layers
	this.layerPanel = this.initLayerPanel();
	
	// Initialize the menu bar
	this.initMenuBar();
	
	// Create textual tool tips object
	this.toolTip = new ToolTip(this.staticOverlayGroup);
	
	// Initialize the toolset
	this.tools = [
		{"tool" : new ToolSelection(this.masterGroup, null, null, this.overlayGroup, this.underlayGroup, this.toolTip),
			"cursor" : UserInterface.cursorDefault },
		{"tool" : new ToolLine(this.masterGroup, null, null, this.overlayGroup, this.underlayGroup, this.toolTip),
			"cursor" : UserInterface.cursorCrosshair },
		{"tool" : new ToolCircleArc(this.masterGroup, null, null, this.overlayGroup, this.underlayGroup, this.toolTip),
			"cursor" : UserInterface.cursorCrosshair }
	];
	
	// Set default tool
	this.currentTool = null;
	this.setTool(UserInterface.defaultTool);
	
	this.leftMouseDown = false;
	
	// Set up listeners at the window level
	this.registerListener("keydown", window, false);
	this.registerListener("keyup", window, false);
	this.registerListener("mousedown", window, false);
	this.registerListener("mouseup", window, false);
	
	// Suppress the right-click context menu
	this.registerListener("contextmenu", window, true);
	
	// Create file importer for loading Alberti documents, and one for loading underlay images, passing self as controller
	this.docImporter = new FileImporter(
		document.getElementById("fi"), "image/svg+xml", true, this.appController, "handleOpenDocument"
	);
	
	this.ulImgImporter = new FileImporter(document.getElementById("uii"),
		"image/gif,image/jpeg,image/png,image/tiff", false, this, "handleImportUlImage"
	);
	
	// Warn user about unsaved data before leaving page
	window.onbeforeunload = function(evt) {
		if (!this.albertiDoc.undoManager.stateIsClean()) {
			var msg = "There are unsaved changes to this document.";
			evt.returnValue = msg;
			return msg;
		}
	}.bindTo(this);
}
Util.extend(UserInterface, EventHandler);

// Prepares the interface for the given Alberti document
UserInterface.prototype.prepareForDocument = function(albertiDoc) {
	this.albertiDoc = albertiDoc;
	
	// Hide the center HUD if an underlay image exists.
	if (!this.albertiDoc.underlayImage.isHidden()) {
		this.hideHud();
	} else {
		this.showHud();
	}
	
	// Clean up zoom & pan event listeners
	if (this.zap) {
		this.zap.killAllListeners();
	}
	
	// Enable our own zooming and panning mechanism
	this.zap = new Zap(this.masterGroup, this.autoScale, this.albertiDoc, this.toolTip);
	
	// Create controller for layer panel and connect it to layer panel
	this.lpController = new LayerPanelController(this.layerPanel);
	this.layerPanel.setController(this.lpController);
	
	// Create layer manager delegate and connect it to layer panel controller
	this.lmDelegate = new LayerManagerDelegate(this.albertiDoc.layerManager, this.lpController);
	this.lpController.setLayerManagerDelegate(this.lmDelegate);
	
	// Tell layer panel controller to populate layer panel with data
	this.lpController.populateLayerPanel();
	
	// Update tools to manipulate new document
	for (var i = 0, len = this.tools.length; i < len; i++) {
		this.tools[i].tool.setManagers(this.lmDelegate, this.albertiDoc.undoManager);
	}
};

UserInterface.prototype.setTool = function(toolNumber) {
	if (this.tools[toolNumber] && toolNumber != this.currentTool) {
		if (this.currentTool !== null) {
			this.tools[this.currentTool].tool.deactivate();
		}
		
		this.currentTool = toolNumber;
		this.tools[this.currentTool].tool.activate();
		this.setCursorToCurrentTool();
	}
};

UserInterface.prototype.setCursorToCurrentTool = function() {
	this.setCursor(this.tools[this.currentTool].cursor);
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

// Create and return layer panel
UserInterface.prototype.initLayerPanel = function() {
	var mainDiv = document.getElementById("layer_panel");
	var dynamicDiv = document.getElementById("layer_panel_dynamic");
	var cstripDiv = document.getElementById("layer_panel_control_strip");
	
	var insertMarkDiv = document.createElement("div");
	insertMarkDiv.id = "insertmark";
	document.body.appendChild(insertMarkDiv);
	
	return new LayerPanel(mainDiv, dynamicDiv, cstripDiv, insertMarkDiv);
};

// Initialize the menu bar
UserInterface.prototype.initMenuBar = function() {
	var fileMenuBtnDiv = document.getElementById("file_menu_btn");
	this.fileMenu = new GuiMenu(
		"file_menu", document.getElementById("file_menu"), this, "handleMenu", fileMenuBtnDiv, GuiMenu.positionBelow
	);
	
	var editMenuBtnDiv = document.getElementById("edit_menu_btn");
	this.editMenu = new GuiMenu(
		"edit_menu", document.getElementById("edit_menu"), this, "handleMenu", editMenuBtnDiv, GuiMenu.positionBelow
	);
	
	var menuBar = new GuiMenuBar();
	menuBar.addMenu(this.fileMenu);
	menuBar.addMenu(this.editMenu);
};

UserInterface.prototype.handleImportUlImage = function(imgDataUrl) {
	this.albertiDoc.setUnderlayImageSrc(imgDataUrl);
	this.albertiDoc.underlayImage.opacity = 1;          // Set underlay image to fully opaque on import
	this.zap.updateUnderlayImage();                     // Update underlay image to match current zoom & pan
	this.albertiDoc.underlayImage.show();
	
	this.hideHud();                                     // Hide the HUD
};

UserInterface.prototype.handleMenu = function(itemId) {
	switch (itemId) {
		
		// New document
		case UserInterface.menuItemNewDoc:
			var createNewDoc = true;
			
			// Warn the user of unsaved changes before creating a new document
			if (!this.albertiDoc.undoManager.stateIsClean()) {
				createNewDoc = confirm("There are unsaved changes to this document. Are you sure you want to discard these changes and create a new document?");
			}
			
			if (createNewDoc) {
				this.appController[this.newDocHandler]();        // Invoke app controller's new document handler
			}
			break;
		
		// Open document
		case UserInterface.menuItemOpenDoc:
			var loadPrompt = true;
			
			// Warn the user of unsaved changes before opening another document
			if (!this.albertiDoc.undoManager.stateIsClean()) {
				loadPrompt = confirm("There are unsaved changes to this document. Are you sure you want to discard these changes and open another document?");
			}
			
			if (loadPrompt) {
				this.docImporter.prompt();                         // Prompt the user to open a file
			}
			break;
		
		// Save document
		case UserInterface.menuItemSaveDoc:
			this.appController[this.saveHandler]();          // Invoke app controller's save document handler
			break;
		
		case UserInterface.menuItemUndo:
			this.albertiDoc.undoManager.undo();
			break;
			
		case UserInterface.menuItemRedo:
			this.albertiDoc.undoManager.redo();
			break;
			
		case UserInterface.menuItemCut:
			this.clipBoard.copy(this.lmDelegate.getSelectedShapes());
			this.lmDelegate.deleteSelectedShapes();
			break;
			
		case UserInterface.menuItemPaste:
			this.albertiDoc.undoManager.recordStart();      // Buffer pasted-shape insertions into a single undo
			this.clipBoard.paste(this.lmDelegate);
			this.albertiDoc.undoManager.recordStop();
			
			// Pasting the same content multiple times makes no sense in 
			// Alberti, so clear the clip board after a paste.
			this.clipBoard.clear();
			break;
	}
};

UserInterface.prototype.keydown = function(evt) {
	switch (evt.keyCode) {
		
		// Activate panning
		case KeyCode.alt:
			if (!this.leftMouseDown) {
				// Enable panning while the alt-key and no other keys are pressed
				this.zap.enablePanning();
				this.setCursor(UserInterface.cursorZoomAndPan);
				
				// Disable tool while panning is enabled
				this.tools[this.currentTool].tool.disable();
			}
			break;
		
		// Delete shape(s)
		case KeyCode.del:
		case KeyCode.backspace:
			this.lmDelegate.deleteSelectedShapes();
			
			// Attempt to suppress backspace-key navigation.
			evt.preventDefault();
			break;
			
		// Undo
		case KeyCode.undo:
			this.handleMenu(UserInterface.menuItemUndo);
			break;
		
		// Redo
		case KeyCode.redo:
			this.handleMenu(UserInterface.menuItemRedo);
			break;
		
		// Cut shape(s)
		case KeyCode.cut:
			this.handleMenu(UserInterface.menuItemCut);
			break;
		
		// Paste shape(s)
		case KeyCode.paste:
			this.handleMenu(UserInterface.menuItemPaste);
			break;
		
		// Import an underlay image
		case KeyCode.loadUlImg:
			this.ulImgImporter.prompt();                       // Prompt the user to open an image file
			break;
		
		// Tool selection keys 0-9
		case KeyCode.number1:
		case KeyCode.number2:
		case KeyCode.number3:
		case KeyCode.number4:
		case KeyCode.number5:
		case KeyCode.number6:
		case KeyCode.number7:
		case KeyCode.number8:
		case KeyCode.number9:
			this.setTool(evt.keyCode - 49);
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
	}
	
	if (evt.shiftKey) {
		switch (evt.keyCode) {
			
			// Create a new document
			case KeyCode.newDoc:
				this.handleMenu(UserInterface.menuItemNewDoc);
				break;

			// Save document
			case KeyCode.save:
				this.handleMenu(UserInterface.menuItemSaveDoc);
				break;

			// Open document
			case KeyCode.load:
				this.handleMenu(UserInterface.menuItemOpenDoc);
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
			this.tools[this.currentTool].tool.enable();
			break;
	}
};

UserInterface.prototype.mousedown = function(evt) {
	if (evt.button == 0) {
		this.leftMouseDown = true;
	}
};

UserInterface.prototype.mouseup = function(evt) {
	if (evt.button == 0) {
		this.leftMouseDown = false;
	}
};

UserInterface.prototype.contextmenu = function(evt) {
	evt.preventDefault();
};
