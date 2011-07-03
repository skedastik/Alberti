/*
 * ToolSelection.js
 * 
 * Tool for selecting Shapes.
 * 
 * * */
 
function ToolSelection(uiObjects) {
	ToolSelection.baseConstructor.call(this, 2, 2, true, uiObjects);
}
Util.extend(ToolSelection, Tool);

ToolSelection.prototype.executeStep = function(stepNum, gx, gy) {
	switch (stepNum) {
		
		case 0:
			var selectRect = new Rectangle().generate();
			
			selectRect.rect = Rect2D.fromPoints(new Coord2D(gx, gy), new Coord2D(gx, gy));
			selectRect.set("id", "selectionBox");
			
			this.registerShape(selectRect, "select_rect");
			break;
	}
};

ToolSelection.prototype.mouseMoveDuringStep = function(stepNum, gx, gy, constrain) {
	switch (stepNum) {
		
		case 0:
			var selectRect = this.getShape("select_rect");
			
			var p1 = this.getKeyCoordFromStep(0);
			var p2 = new Coord2D(gx, gy);
			
			selectRect.rect = Rect2D.fromPoints(p1, p2);
			
			selectRect.push();
			break;
	}
};

ToolSelection.prototype.complete = function(stepNum, constrain) {
	var selectRect = this.getShape("select_rect");
	var shapes;
	
	// If the selection rectangle is very small, the user clicked without
	// dragging so he probably intended to select whatever is under the mouse.
	if (selectRect.rect.right - selectRect.rect.left < 1 && selectRect.rect.bottom - selectRect.rect.top < 1) {
		var center = this.getKeyCoordFromStep(0);
		
		// If a snap point exists, reduce the pick radius so that only intersecting lines are selected
		var radius = this.currentSnapPoint ? 0.1 / this.masterGroup.scale : 2.5 / this.masterGroup.scale;
		
		// Select all intersecting shapes if a snap point exists, otherwise select a single shape
		shapes = this.layerManager.pickShapes(center, radius, this.currentSnapPoint === null);
	} else {
		shapes = this.layerManager.getShapesInRect(selectRect.rect);
	}
	
	if (constrain) {
		this.layerManager.xorSelection(shapes);
	} else {
		this.layerManager.setSelection(shapes);
	}
};

ToolSelection.prototype.onDeactivate = function() {
	this.layerManager.setSelection([]);
};
