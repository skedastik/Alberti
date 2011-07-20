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

Zap.autoPanTransitionLength = 0.35;        // Auto-pan transition length in seconds
Zap.zoomTransitionLength = 0.25;           // Zoom transition length in seconds
Zap.zoomTransitionAccel = -1.0;            // Transition animation acceleration

// Mouse wheel events are generated too quickly by the trackpad. Limit how 
// many mouse wheel events are processed per second.
Zap.maxWheelEvtPerSec = 30;
Zap.wheelEvtRefreshMs = Math.round(1000 / Zap.maxWheelEvtPerSec);

function Zap(masterGroup, autoScale, layerManager, underlayImage, toolTip) {
	Zap.baseConstructor.call(this);
	this.masterGroup = masterGroup;
	this.autoScale = autoScale;
	this.layerManager = layerManager;
	this.underlayImage = underlayImage;
	this.toolTip = toolTip;
	
	this.panningEnabled = false;
	this.zoomLevel = Zap.defaultZoomLevel;
	this.zapAnimation = null;
	
	this.center();
	
	// Update AutoScale and layer manager's SnapPoints object with the default zoom level
	this.autoScale.update(Zap.zoomFactors[this.zoomLevel]);
	this.layerManager.snapPoints.setSnapRadiusScale(Zap.zoomFactors[this.zoomLevel]);
	
	this.masterGroup.scale = Zap.zoomFactors[this.zoomLevel];
	this.masterGroup.push();
	
	// The underlay image is scaled and translated separately with hardware-acceleration.
	this.updateUnderlayImage();
	
	// Last position manually panned to by user
	this.lastPanPosition = new Coord2D(0, 0);
	
	this.lastWheelEvent = 0;
	
	this.registerListener("mousewheel", Alberti.svgRoot, false);          // opera, safari, ie9
	this.registerListener("DOMMouseScroll", Alberti.svgRoot, false);      // mozilla
}
Util.extend(Zap, DragHandler);

Zap.prototype.handleWheel = function(direction, evt) {
	// Select new zoom level based on mousewheel direction
	var newZoomLevel = Util.minMax(this.zoomLevel + direction, Zap.minZoomLevel, Zap.maxZoomLevel);
	
	if (newZoomLevel != this.zoomLevel) {
		this.zoomRelative(newZoomLevel, evt.clientX, evt.clientY);
		this.updateMagnificationTooltip(Zap.zoomFactors[newZoomLevel]);
	}
};

// Smoothly zoom relative to the given global coordinates at the specified zoom level
Zap.prototype.zoomRelative = function(zoomLevel, x, y) {
	this.zoomLevel = zoomLevel;
	this.stopZoomTransition();
	this.enableZoomPanOptimization();
	
	var z = Zap.zoomFactors[this.zoomLevel];
	
	// The point (x,y) must remain stationary in the window throughout a zoom 
	// operation. This necessitates a simultaneous translation of the master 
	// group during the scale.
	var q = z / this.masterGroup.scale - 1;
	var panX = this.masterGroup.position.x 
		+ (this.masterGroup.position.x - x + Alberti.halfOriginalWindowWidth) * q;
	var panY = this.masterGroup.position.y
		+ (this.masterGroup.position.y - y + Alberti.halfOriginalWindowHeight) * q;
	
	// Supply a per-frame callback that invokes Group::push and
	// AutoScale::update in order to update the workspace and maintain
	// consistent line and point widths every frame (see AutoScale.js for
	// details).
	this.zapAnimation = new Animation(
		Zap.zoomTransitionLength,
		function() {
			this.zapAnimation = null;
			this.layerManager.resetCurrentMarker();
			
			if (!this.panningEnabled) {
				this.disableZoomPanOptimization();
			}
		}.bindTo(this),
		!this.underlayImage.isHidden() ?
			function() {
				this.autoScale.update(this.masterGroup.scale);
				this.layerManager.snapPoints.setSnapRadiusScale(this.masterGroup.scale);
				this.masterGroup.push();
				this.lastPanPosition.x = -this.masterGroup.position.x / z;
				this.lastPanPosition.y = -this.masterGroup.position.y / z;
				this.underlayImage.update();
			}.bindTo(this)
			:
			function() {
				this.autoScale.update(this.masterGroup.scale);
				this.layerManager.snapPoints.setSnapRadiusScale(this.masterGroup.scale);
				this.masterGroup.push();
				this.lastPanPosition.x = -this.masterGroup.position.x / z;
				this.lastPanPosition.y = -this.masterGroup.position.y / z;
			}.bindTo(this)
	);
	
	this.zapAnimation.add(this.masterGroup, "scale", this.masterGroup.scale, Zap.zoomFactors[this.zoomLevel], Zap.zoomTransitionAccel);
	this.zapAnimation.add(this.masterGroup.position, "x", this.masterGroup.position.x, panX, Zap.zoomTransitionAccel);
	this.zapAnimation.add(this.masterGroup.position, "y", this.masterGroup.position.y, panY, Zap.zoomTransitionAccel);
	
	if (!this.underlayImage.isHidden()) {
		this.zapAnimation.add(this.underlayImage, "scale", this.underlayImage.scale, Zap.zoomFactors[this.zoomLevel], Zap.zoomTransitionAccel);
		this.zapAnimation.add(this.underlayImage, "x", this.underlayImage.x, panX, Zap.zoomTransitionAccel);
		this.zapAnimation.add(this.underlayImage, "y", this.underlayImage.y, panY, Zap.zoomTransitionAccel);
	}
		
	this.zapAnimation.begin();
};

// Smoothly pan to the given global coordinates (a Coord2D). You may 
// optionally pass true for savePosition to use this position as the last 
// manually-panned position.
Zap.prototype.panTo = function(coord, savePosition) {
	this.stopZoomTransition();
	this.enableZoomPanOptimization();
	
	if (savePosition) {
		this.lastPanPosition = coord;
		this.layerManager.resetCurrentMarker();
	}
	
	this.zapAnimation = new Animation(
		Zap.autoPanTransitionLength,
		function() {
			this.zapAnimation = null;
			if (!this.panningEnabled) {
				this.disableZoomPanOptimization();
			}
		}.bindTo(this),
		!this.underlayImage.isHidden() ?
			function() {
				this.masterGroup.push();
				this.underlayImage.update();
			}.bindTo(this)
			:
			function() {
				this.masterGroup.push();
			}.bindTo(this)
	);
	
	var z = Zap.zoomFactors[this.zoomLevel];
	
	this.zapAnimation.add(this.masterGroup.position, "x", this.masterGroup.position.x, -coord.x * z, Zap.zoomTransitionAccel);
	this.zapAnimation.add(this.masterGroup.position, "y", this.masterGroup.position.y, -coord.y * z, Zap.zoomTransitionAccel);
	
	if (!this.underlayImage.isHidden()) {
		this.zapAnimation.add(this.underlayImage, "x", this.underlayImage.x, -coord.x * z, Zap.zoomTransitionAccel);
		this.zapAnimation.add(this.underlayImage, "y", this.underlayImage.y, -coord.y * z, Zap.zoomTransitionAccel);
	}
		
	this.zapAnimation.begin();
};

Zap.prototype.getLastPanPosition = function() {
	return this.lastPanPosition.clone();
};

// Stops zoom level transition animation if it is currently taking place
Zap.prototype.stopZoomTransition = function() {
	if (this.zapAnimation !== null) {
		// To eliminate stutter, force a redraw before stopping the animation
		this.zapAnimation.forceUpdate();
		
		// Zoom animation may have concluded after above call to forceUpdate,
		// so check before calling stop unnecessarily.
		if (this.zapAnimation) {
			this.zapAnimation.stop(false);
			this.zapAnimation = null;
		}
	}
};

Zap.prototype.updateUnderlayImage = function() {
	this.underlayImage.scale = Zap.zoomFactors[this.zoomLevel];
	this.underlayImage.x = this.masterGroup.position.x;
	this.underlayImage.y = this.masterGroup.position.y;
	this.underlayImage.update();
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
	if (Date.now() - this.lastWheelEvent >= Zap.wheelEvtRefreshMs) {
		this.lastWheelEvent = Date.now();
		evt.preventDefault();
	
		if (typeof evt.axis === undefined || evt.VERTICAL_AXIS) {
			// normalize to +-1, and negate because mousewheel-up means increase zoom
			this.handleWheel(-Util.minMax(evt.detail, -1, 1), evt);
		}
	}
};

// Center the coordinate space in the window
Zap.prototype.center = function() {
	this.masterGroup.position.x = this.masterGroup.position.y = 0;
	this.masterGroup.push();
};

// Start capturing mouse input. Has no effect if called while panning is 
// already enabled.
Zap.prototype.enablePanning = function() {
	if (!this.panningEnabled) {
		this.panningEnabled = true;
		this.registerListener("mousedown", Alberti.svgRoot, true);
		this.enableZoomPanOptimization();
	}
};

// Stop capturing mouse input. Has no effect if called while panning is
// already disabled.
Zap.prototype.disablePanning = function() {
	if (this.panningEnabled) {
		this.panningEnabled = false;
		this.unregisterListener("mousedown", Alberti.svgRoot, true);
		this.disableZoomPanOptimization();
		this.cancelDrag();
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
	
	var z = Zap.zoomFactors[this.zoomLevel];
	
	this.lastPanPosition.x = -this.masterGroup.position.x / z;
	this.lastPanPosition.y = -this.masterGroup.position.y / z;
	
	if (!this.underlayImage.isHidden()) {
		this.underlayImage.translateRelative(dx, dy);
		this.underlayImage.update();
	}
};

Zap.prototype.onDrop = function(evt) {
	this.layerManager.resetCurrentMarker();
};
