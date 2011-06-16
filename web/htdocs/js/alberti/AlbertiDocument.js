/*
 * AlbertiDocument.js
 * 
 * A single Alberti document.
 * 
 * USAGE
 * 
 * You may optionally pass a file path to the constructor to load an existing 
 * document. If no arguments are passed to the constructor, a new, empty 
 * document is generated.
 * 
 * * */

AlbertiDocument.svgRoot;                   // root SVG element--the <svg> node

// Various exportable formats
AlbertiDocument.exportTypeAlberti = "alb";
AlbertiDocument.exportTypeSvg     = "svg";
AlbertiDocument.exportTypePng     = "png";
 
function AlbertiDocument(importPath) {
	if (importPath) {
		this.importFromFile(importPath);
	}
	
	AlbertiDocument.svgRoot = document.getElementById("svgroot");
	
	// The SVG group node with id "workspace" contains all user-created 
	// layers, including the base layer.
	var workspaceSvgNode = document.getElementById("workspace");
	this.workspaceGroup = new Group(workspaceSvgNode);
	
	this.undoManager = new UndoManager(Alberti.maxUndos);
	this.layerManager = new LayerManager(this.workspaceGroup, this.undoManager);
	
	// Load underlay image if available
	this.loadUnderlayImage();
	
	// Disable the undo manager during document load
	this.undoManager.disable();
	
	if (Util.firstNonTextChild(workspaceSvgNode)) {
		this.loadLayers();                                 // Layers and shapes already exist, simply load them
	} else {
		this.layerManager.newLayer();                      // Layers do not exist, so create the base layer
		
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

AlbertiDocument.prototype.loadUnderlayImage = function() {
	// underlayImg will be null if there is no underlay image
	var imgNode = document.getElementById("underlayimg");
	this.underlayImage = imgNode ? new FastImage(imgNode) : null;
};

// Load layers and shape data from workspace group
AlbertiDocument.prototype.loadLayers = function() {
	var curGroupNode = Util.firstNonTextChild(this.workspaceGroup.svgNode);
	
	// Iterate through first level of children of the workspace group. All of
	// these will be <g> nodes corresponding to Layer objects.
	while (curGroupNode != null) {
		Util.assert(curGroupNode.nodeName == "g",
			"AlbertiDocument::loadLayers encountered node of type '"+curGroupNode.nodeName+"' when 'g' node expected."
		);
		
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
				
				default:
					throw "AlbertiDocument::loadLayers encountered unrecognized shape node of type '"+curShapeNode.nodeName+"'.";
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

// Returns the Alberti document as XML
AlbertiDocument.prototype.asXML = function() {
	var shapeData = new XMLSerializer().serializeToString(this.workspaceGroup.svgNode);
	var xml = '';
	
	xml += '<svg\n';
	xml += '	xmlns="http://www.w3.org/2000/svg" version="1.1"\n';
	xml += '	xmlns:xlink="http://www.w3.org/1999/xlink"\n';
	xml += '	xmlns:berti="http://www.albertidraw.com/alberti">\n';
	xml += '<title>Alberti Document</title>\n';                            // TODO: Set title dynamically
	xml += shapeData+'\n';
	xml += '</svg>\n';
	
	return xml;
};
