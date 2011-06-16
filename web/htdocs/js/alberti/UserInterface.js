/*
 * UserInterface.js
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
 * * */

UserInterface.shiftKeyCode  = 16;
UserInterface.ctrlKeyCode   = 17;
UserInterface.altKeyCode    = 18;
UserInterface.escKeyCode    = 27;

UserInterface.enterKeyCode  = 13;

UserInterface.deleteKeyCode    = 46;
UserInterface.backspaceKeyCode = 8;

UserInterface.arrowUpKeyCode   = 38;
UserInterface.arrowDownKeyCode = 40;

UserInterface.number1KeyCode = 49;
UserInterface.number2KeyCode = 50;
UserInterface.number3KeyCode = 51;
UserInterface.number4KeyCode = 52;
UserInterface.number5KeyCode = 53;
UserInterface.number6KeyCode = 54;
UserInterface.number7KeyCode = 55;
UserInterface.number8KeyCode = 56;
UserInterface.number9KeyCode = 57;

UserInterface.lpCollapseKeyCode = 220;       // '\' - Collapse/reveal layer panel
UserInterface.snapKeyCode       = 70;        // 'f' - Activate snap-to-intersection
UserInterface.undoKeyCode       = 85;        // 'u'
UserInterface.redoKeyCode       = 82;        // 'r'
UserInterface.cutKeyCode        = 88;        // 'x'
UserInterface.pasteKeyCode      = 86;        // 'v'
UserInterface.saveKeyCode       = 83;        // 's' - Save the document

UserInterface.selectionTool = 0;
UserInterface.lineTool      = 1;
UserInterface.circleArcTool = 2;
UserInterface.defaultTool   = UserInterface.lineTool;

UserInterface.cursorDefault    = "cursorDefault";
UserInterface.cursorZoomAndPan = "cursorZoomAndPan";
UserInterface.cursorCrosshair  = "cursorCrosshair";

function UserInterface(albertiDoc, clipBoard, appController, saveHandler, loadHandler) {
	UserInterface.baseConstructor.call(this);
	this.clipBoard = clipBoard;
	this.appController = appController;
	this.saveHandler = saveHandler;
	this.loadHandler = loadHandler;
	
	this.prepareForDocument(albertiDoc);
	
	// Set default tool
	this.currentTool = null;
	this.setTool(UserInterface.defaultTool);
	
	this.leftMouseDown = false;
	
	// Set up listeners at the window level
	window.addEventListener("keydown", this, false);
	window.addEventListener("keyup", this, false);
	window.addEventListener("mousedown", this, false);
	window.addEventListener("mouseup", this, false);
	
	// Suppress the right-click context menu
	window.addEventListener("contextmenu", this, true);
	
	// Reveal the document body now that setup is complete
	document.body.style.display = "";
}
Util.extend(UserInterface, EventHandler);

// Prepares the interface for the given Alberti document
UserInterface.prototype.prepareForDocument = function(albertiDoc) {
	this.albertiDoc = albertiDoc;
	
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
	
	// The hud group contains the center HUD--an 'X' displayed at the center 
	// of the workspace at all times.
	this.hudGroup = new Group(document.getElementById("hud"));
	
	// Hide the center HUD if an underlay image exists.
	if (this.albertiDoc.underlayImage) {
		this.hideHud();
	}
	
	// overlayGroup contains UI elements that should be rendered above the 
	// workspace group
	this.overlayGroup = new Group(document.getElementById("overlay"));
	
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
	
	// Create textual tool tips object
	this.toolTip = new ToolTip(this.staticOverlayGroup);
	
	// Enable our own zooming and panning mechanism
	this.zap = new Zap(this.masterGroup, this.autoScale, this.albertiDoc, this.toolTip);
	
	// The layer panel provides an interface for the manipulation of layers
	this.layerPanel = this.createLayerPanel();
	
	// Create controller for layer panel connect it to layer panel
	this.lpController = new LayerPanelController(this.layerPanel);
	this.layerPanel.setController(this.lpController);
	
	// Create layer manager delegate and connect it to layer panel controller
	this.lmDelegate = new LayerManagerDelegate(this.albertiDoc.layerManager, this.lpController);
	this.lpController.setLayerManagerDelegate(this.lmDelegate);
	
	// Tell layer panel controller to populate layer panel with data
	this.lpController.populateLayerPanel();
	
	// Initialize the toolset, and select the default tool
	this.tools = [
		{"tool" : new ToolSelection(this.masterGroup, this.lmDelegate, this.albertiDoc.undoManager, this.overlayGroup, this.underlayGroup, this.toolTip),
			"cursor" : UserInterface.cursorDefault },
		{"tool" : new ToolLine(this.masterGroup, this.lmDelegate, this.albertiDoc.undoManager, this.overlayGroup, this.underlayGroup, this.toolTip),
			"cursor" : UserInterface.cursorCrosshair },
		{"tool" : new ToolCircleArc(this.masterGroup, this.lmDelegate, this.albertiDoc.undoManager, this.overlayGroup, this.underlayGroup, this.toolTip),
			"cursor" : UserInterface.cursorCrosshair }
	];
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
UserInterface.prototype.createLayerPanel = function() {
	var mainDiv = document.getElementById("layer_panel");
	var dynamicDiv = document.getElementById("layer_panel_dynamic");
	var cstripDiv = document.getElementById("layer_panel_control_strip");
	
	var insertMarkDiv = document.createElement("div");
	insertMarkDiv.id = "insertmark";
	document.body.appendChild(insertMarkDiv);
	
	return new LayerPanel(mainDiv, dynamicDiv, cstripDiv, insertMarkDiv);
};

UserInterface.prototype.keydown = function(evt) {
	switch (evt.keyCode) {
		
		case UserInterface.altKeyCode:
			if (!evt.ctrlKey && !evt.metaKey && !this.leftMouseDown) {
				// Enable panning while the alt-key and no other keys are pressed
				this.zap.enablePanning();
				this.setCursor(UserInterface.cursorZoomAndPan);
				
				// Disable tool while panning is enabled
				this.tools[this.currentTool].tool.disable();
			}
			break;
		
		case UserInterface.deleteKeyCode:
		case UserInterface.backspaceKeyCode:
			this.lmDelegate.deleteSelectedShapes();
			
			// Attempt to suppress backspace-key navigation.
			evt.preventDefault();
			break;
			
		case UserInterface.undoKeyCode:
			this.albertiDoc.undoManager.undo();
			break;
		
		case UserInterface.redoKeyCode:
			this.albertiDoc.undoManager.redo();
			break;
		
		case UserInterface.cutKeyCode:
			this.clipBoard.copy(this.lmDelegate.getSelectedShapes());
			this.lmDelegate.deleteSelectedShapes();
			break;
		
		case UserInterface.pasteKeyCode:
			this.albertiDoc.undoManager.recordStart();      // Buffer pasted-shape insertions into a single undo
			this.clipBoard.paste(this.lmDelegate);
			this.albertiDoc.undoManager.recordStop();
			
			// Pasting the same content multiple times makes no sense in 
			// Alberti, so clear the clip board after a paste.
			this.clipBoard.clear();
			break;
		
		case UserInterface.saveKeyCode:
			this.appController[this.saveHandler]();      // Invoke app controller's save document handler
			break;
		
		// Tool selection keys 0-9
		case UserInterface.number1KeyCode:
		case UserInterface.number2KeyCode:
		case UserInterface.number3KeyCode:
		case UserInterface.number4KeyCode:
		case UserInterface.number5KeyCode:
		case UserInterface.number6KeyCode:
		case UserInterface.number7KeyCode:
		case UserInterface.number8KeyCode:
		case UserInterface.number9KeyCode:
			this.setTool(evt.keyCode - 49);
			break;
		
		case UserInterface.lpCollapseKeyCode:
			this.layerPanel.toggleCollapse();
			break;
		
		case UserInterface.arrowUpKeyCode:
			this.lmDelegate.switchToVisibleLayerAboveCurrentLayer();
			break;
		
		case UserInterface.arrowDownKeyCode:
			this.lmDelegate.switchToVisibleLayerBelowCurrentLayer();
			break;
	}
};

UserInterface.prototype.keyup = function(evt) {
	switch(evt.keyCode) {
		case UserInterface.altKeyCode:
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
