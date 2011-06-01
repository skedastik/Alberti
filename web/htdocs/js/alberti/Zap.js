/*
 * Zap.js
 * 
 * Handles user-controlled coordinate system scaling and translation (Zooming
 * and Panning) by manipulating the coordinate system of the master group.
 * 
 * NOTES
 * 
 * While panning is enabled, Zap captures mouse clicks and moves at the window
 * level, starting with the first mousedown that it detects. mouseup and 
 * mousemove events are then captured for the subsequent drag/pan operation.
 * 
 * * */

// An array of zoom factors, the default being zoom factor being 1.0.
Zap.zoomFactors = [1/10, 1/8, 1/5, 1/3, 1/2, 3/4, 1.0, 1.5, 2.0, 3, 4, 6, 8, 10];
Zap.minZoomLevel = Zap.zoomFactors.indexOf(1/5);
Zap.maxZoomLevel = Zap.zoomFactors.indexOf(4);
Zap.defaultZoomLevel = Zap.zoomFactors.indexOf(1/2);

Zap.zoomTransitionLength = 0.25;           // zoom transition length in seconds
Zap.zoomTransitionAccel = -1.0;           // transition animation acceleration

// Mouse wheel events are generated too quickly by the trackpad. Limit how 
// many mouse wheel events are processed per second.
Zap.maxWheelEvtPerSec = 30;
Zap.wheelEvtRefreshMs = Math.round(1000 / Zap.maxWheelEvtPerSec);

function Zap(masterGroup, autoScale, bertiDoc, toolTip) {
	DragHandler.baseConstructor.call(this);
	this.masterGroup = masterGroup;
	this.autoScale = autoScale;
	this.bertiDoc = bertiDoc;
	this.toolTip = toolTip;
	
	this.panningEnabled = false;
	this.zoomLevel = Zap.defaultZoomLevel;
	this.zoomAnimation = null;
	
	// Update AutoScale and layer manager's Intersection object with the default zoom level
	this.autoScale.update(Zap.zoomFactors[this.zoomLevel]);
	this.bertiDoc.layerManager.intersections.setSearchRadiusScale(Zap.zoomFactors[this.zoomLevel]);
	
	this.masterGroup.scale = Zap.zoomFactors[this.zoomLevel];
	this.masterGroup.push();
	
	// The underlay image is scaled and translated separately with hardware-acceleration.
	if (this.bertiDoc.underlayImage) {
		this.bertiDoc.underlayImage.scale = Zap.zoomFactors[this.zoomLevel];
		this.bertiDoc.underlayImage.x = this.masterGroup.position.x;
		this.bertiDoc.underlayImage.y = this.masterGroup.position.y;
		this.bertiDoc.underlayImage.update();
	}
	
	this.lastWheelEvent = 0;
	
	Alberti.svgRoot.addEventListener("mousewheel", this, false);          // opera, safari, ie9
	Alberti.svgRoot.addEventListener("DOMMouseScroll", this, false);      // mozilla
}
Util.extend(Zap, DragHandler);

/* * * * * * * * * * * * * Zoom methods below * * * * * * * * * * * * * * * */

Zap.prototype.handleWheel = function(direction, evt) {
	// Select new zoom level based on mousewheel direction
	var newZoomLevel = Util.minMax(this.zoomLevel + direction, Zap.minZoomLevel, Zap.maxZoomLevel);
	
	if (newZoomLevel != this.zoomLevel) {
		this.zoomLevel = newZoomLevel;
		this.stopZoomTransition();
		this.enableZoomPanOptimization();
		
		this.updateMagnificationTooltip(Zap.zoomFactors[this.zoomLevel]);
		
		// The point on the screen under the cursor must remain stationary 
		// throughout a zoom operation. This necessitates a simultaneous 
		// translation of the master group during the scale.
		var q = Zap.zoomFactors[this.zoomLevel] / this.masterGroup.scale - 1;
		var panX = this.masterGroup.position.x 
			+ (this.masterGroup.position.x - evt.clientX + Alberti.halfOriginalWindowWidth) * q;
		var panY = this.masterGroup.position.y
			+ (this.masterGroup.position.y - evt.clientY + Alberti.halfOriginalWindowHeight) * q;
		
		// Supply a per-frame callback that invokes Group::push and
		// AutoScale::update in order to update the workspace and maintain
		// consistent line and point widths every frame (see AutoScale.js for
		// details).
		this.zoomAnimation = new Animation(
			Zap.zoomTransitionLength,
			function() {
				this.zoomAnimation = null;
				if (!this.panningEnabled) {
					this.disableZoomPanOptimization();
				}
			}.bindTo(this),
			this.bertiDoc.underlayImage ?
				function() {
					this.autoScale.update(this.masterGroup.scale);
					this.bertiDoc.layerManager.intersections.setSearchRadiusScale(this.masterGroup.scale);
					this.masterGroup.push();
					this.bertiDoc.underlayImage.update();
				}.bindTo(this)
				:
				function() {
					this.autoScale.update(this.masterGroup.scale);
					this.bertiDoc.layerManager.intersections.setSearchRadiusScale(this.masterGroup.scale);
					this.masterGroup.push();
				}.bindTo(this));
		
		this.zoomAnimation.add(this.masterGroup, "scale", this.masterGroup.scale, Zap.zoomFactors[this.zoomLevel], Zap.zoomTransitionAccel);
		this.zoomAnimation.add(this.masterGroup.position, "x", this.masterGroup.position.x, panX, Zap.zoomTransitionAccel);
		this.zoomAnimation.add(this.masterGroup.position, "y", this.masterGroup.position.y, panY, Zap.zoomTransitionAccel);
		
		if (this.bertiDoc.underlayImage) {
			this.zoomAnimation.add(this.bertiDoc.underlayImage, "scale", this.bertiDoc.underlayImage.scale, Zap.zoomFactors[this.zoomLevel], Zap.zoomTransitionAccel);
			this.zoomAnimation.add(this.bertiDoc.underlayImage, "x", this.bertiDoc.underlayImage.x, panX, Zap.zoomTransitionAccel);
			this.zoomAnimation.add(this.bertiDoc.underlayImage, "y", this.bertiDoc.underlayImage.y, panY, Zap.zoomTransitionAccel);
		}
			
		this.zoomAnimation.begin();
	}
};

// Stops zoom level transition animation if it is currently taking place
Zap.prototype.stopZoomTransition = function() {
	if (this.zoomAnimation !== null) {
		this.zoomAnimation.stop(false);
		this.zoomAnimation = null;
	}
};

Zap.prototype.updateMagnificationTooltip = function(scale) {
	this.toolTip.setText("Magnification: "+Util.roundToDecimal((scale * 100), 1)+"%", true, true);
};

Zap.prototype.mousewheel = function(evt) {
	if (Date.now() - this.lastWheelEvent >= Zap.wheelEvtRefreshMs) {
		this.lastWheelEvent = Date.now();
		evt.preventDefault();
		
		// normalize to +-1 zoom level at a time
		this.handleWheel(Util.minMax(evt.wheelDelta, -1, 1), evt);
	}
};

Zap.prototype.DOMMouseScroll = function(evt) {
	evt.preventDefault();
	
	if (typeof evt.axis === undefined || evt.VERTICAL_AXIS) {
		// normalize to +-1, and negate because mousewheel-up means increase zoom
		this.handleWheel(-Util.minMax(evt.detail, -1, 1), evt);
	}
};

/* * * * * * * * * * * * * Pan methods below * * * * * * * * * * * * * * * */

// Start capturing mouse input. Has no effect if called while panning is 
// already enabled.
Zap.prototype.enablePanning = function() {
	if (!this.panningEnabled) {
		this.panningEnabled = true;
		Alberti.svgRoot.addEventListener("mousedown", this, true);
		this.enableZoomPanOptimization();
	}
};

// Stop capturing mouse input. Has no effect if called while panning is
// already disabled.
Zap.prototype.disablePanning = function() {
	if (this.panningEnabled) {
		this.panningEnabled = false;
		Alberti.svgRoot.removeEventListener("mousedown", this, true);
		this.disableZoomPanOptimization();
	}
};

// Enable rendering optimization to make zoom/pan operations smoother. This
// means disabling anti-aliasing and increasing line widths so that they are
// rendered 2 pixels wide. For whatever reason, SVG rendering speed drops
// drastically when rendering single-pixel width non-anti-aliased lines.
Zap.prototype.enableZoomPanOptimization = function() {
	this.autoScale.setLineWidthAdjustment(Alberti.lineWidthDeltaOptimized);
	this.autoScale.update(this.masterGroup.scale);
	if (!Alberti.crispLines) {
		this.masterGroup.set("class", Alberti.optimizedClassName);
	}
};

// Disable rendering optimization
Zap.prototype.disableZoomPanOptimization = function() {
	this.autoScale.setLineWidthAdjustment(0);
	this.autoScale.update(this.masterGroup.scale);
	if (!Alberti.crispLines) {
		this.masterGroup.set("class", "");
	}
};

Zap.prototype.onDragBegin = function(evt) {
	// Absorb the event so that underlying objects are not activated
	evt.stopPropagation();
	
	// Stop zoom transition animation if the user starts panning
	this.stopZoomTransition();
};

Zap.prototype.onDrag = function(dx, dy, evt) {
	this.masterGroup.translateRelative(dx, dy);
	this.masterGroup.push();
	
	if (this.bertiDoc.underlayImage) {
		this.bertiDoc.underlayImage.translateRelative(dx, dy);
		this.bertiDoc.underlayImage.update();
	}
};
