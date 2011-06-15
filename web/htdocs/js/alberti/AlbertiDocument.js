/*
 * AlbertiDocument.js
 * 
 * A single Alberti document.
 * 
 * TODO
 * 
 * The current mechanism of loading layers and shapes from XML data is a bit
 * dirty. Instead of differentiating shapes by SVG node names and attributes,
 * it would be cleaner to differentiate them by using specialized attributes 
 * in the Alberti namepsace, or, even better, creating a specialized XML format 
 * for Alberti.
 * 
 * * */
 
function AlbertiDocument() {
	// The SVG group node with id "workspace" contains all user-created 
	// layers, including the base layer.
	var workspaceSvgNode = document.getElementById("workspace");
	this.workspaceGroup = new Group(workspaceSvgNode);
	
	this.undoManager = new UndoManager(Alberti.maxUndos);
	this.layerManager = new LayerManager(this.workspaceGroup, this.undoManager);
	
	// underlayImg will be null if there is no underlay image
	var imgNode = document.getElementById("underlayimg");
	this.underlayImage = imgNode ? new FastImage(imgNode) : null;
	
	// Disable the undo manager during document load
	this.undoManager.disable();
	
	if (Util.firstNonTextChild(workspaceSvgNode)) {
		// Layers and shapes already exist, simply load them
		this.load();
	} else {
		// Layers do not exist, so create the base layer
		this.layerManager.newLayer();
		
		// TODO: Remove the test lines below.
		// var t = Date.now();
		// for (var i = 0; i < 500; i++) {
		// 	var l = new Line().generate();
		// 	l.p1.x = Math.random() * 2000 - 1000;
		// 	l.p1.y = Math.random() * 2000 - 1000;
		// 	l.p2.x = Math.random() * 2000 - 1000;
		// 	l.p2.y = Math.random() * 2000 - 1000;
		// 	this.layerManager.insertShape(l);
		// }
		// Dbug.log("Time to load: "+Util.roundToDecimal((Date.now() - t) / 1000, 2));
		// Dbug.log("Total intersections: "+this.layerManager.intersections.points.nodeCount);
		// Dbug.log("Number of buckets: "+this.layerManager.intersections.points.bucketCount);
		// Dbug.log("Bucket width: "+this.layerManager.intersections.points.bucketWidth);
	}
	
	// Enable the undo manager after the document has loaded
	this.undoManager.enable();
}

// Returns clean SVG data in the workspace group
AlbertiDocument.prototype.exportSVG = function() {
};

// Returns the entire document as raw XML
AlbertiDocument.prototype.getXML = function() {
	return new XMLSerializer().serializeToString(Alberti.svgRoot);
};

// Generate objects from existing XML data in the workspace group.
//
// TODO: Disable undo manager while loading data!
AlbertiDocument.prototype.load = function() {
	var curGroupNode = Util.firstNonTextChild(this.workspaceGroup.svgNode);

	// Iterate through first level of children of the workspace group. All of
	// these will be <g> nodes corresponding to Layer objects.
	while (curGroupNode != null) {
		// Create a new layer for each <g> node encountered
		var newLayer = new Layer(curGroupNode);
		this.layerManager.insertLayer(newLayer);
		
		// Iterate through the children of the <g> node. These will be various
		// shape nodes corresponding to Shape objects.
		var curShapeNode = Util.firstNonTextChild(curGroupNode);
		while (curShapeNode != null) {
			var shape;
			
			switch (curShapeNode.nodeName) {
				case "line":
					shape = new Line(curShapeNode);
					break;
				
				case "path":
					shape = new CircleArc(curShapeNode);
					break;
			}
			
			// Strip unrecognized data from each imported shape
			shape.sanitize();
			
			// Insert each shape into the current layer
			this.layerManager.insertShape(shape);
			
			curShapeNode = Util.nextNonTextSibling(curShapeNode);
		}
		
		curGroupNode = Util.nextNonTextSibling(curGroupNode);
	}
	
	this.layerManager.switchToHighestVisibleLayer();
};
