/*
 * AlbertiDocument.js
 * 
 * A single Alberti document. A document consists of layers, shape data, and 
 * an optional underlay image. An undo manager and layer manager are created 
 * for each document.
 * 
 * USAGE
 * 
 * You may optionally pass XML data to the constructor to load an existing 
 * document. If no arguments are passed to the constructor, a new, empty 
 * document is generated.
 * 
 * * */

// Various exportable formats
AlbertiDocument.exportTypeSvg     = "svg";
AlbertiDocument.exportTypePng     = "png";
 
function AlbertiDocument(xml) {
	this.workspaceGroup = null;
	this.undoManager = null;
	this.layerManager = null;
	
	// TODO: Rather than storing an instance of FastImage, AlbertiDocument
	// should simply store the underlay image data: source, opacity, and
	// visibility. UserInterface can then instantiate its own FastImage object
	// based on the AlbertiDocument data. This would be a cleaner separation 
	// of model and view.
	this.underlayImage = new FastImage(document.getElementById("underlayimg"));
	
	// A filename may be associated with an AlbertiDocument
	this.filename = null;
	
	// Underlay image is a hidden dummy image by default
	this.underlayImage.setSource("../../images/dummy.png");
	this.underlayImage.hide();
	
	if (xml) {
		// Import existing document if XML data available...
		this.importFromXML(xml);
	} else {
		// ...otherwise create a new, empty document.
		this.createEmptyDocument();
	}
	
	var img = document.getElementById("underlayimg");
}

AlbertiDocument.prototype.createEmptyDocument = function() {
	this.workspaceGroup = new Group().generate().set("id", "workspace");
	this.undoManager = new UndoManager(Alberti.maxUndos);
	this.layerManager = new LayerManager(this.workspaceGroup, this.undoManager);

	// Create base layer, then enable undo manager
	this.layerManager.newLayer();
	this.undoManager.enable();
};

AlbertiDocument.prototype.importFromXML = function(xml) {
	var parser = new DOMParser();
	var doc = parser.parseFromString(xml, "text/xml");
	var ulimg = doc.getElementById("underlayimg");
	
	Util.assert(doc.documentElement.tagName != "parsererror",
		"AlbertiDocument::importFromXML could not parse imported file."
	);
	
	Util.assert(ulimg.hasAttributeNS(Alberti.xlinkns, "href") && ulimg.hasAttributeNS(null, "opacity"),
		"AlbertiDocument::importFromXML encountered malformed underlay image element."
	);
		
	// Extract and load underlay image data
	this.underlayImage.setSource(ulimg.getAttributeNS(Alberti.xlinkns, "href"));
	this.underlayImage.opacity = ulimg.getAttributeNS(null, "opacity");
	
	if (ulimg.getAttributeNS(null, "display") == "none") {
		this.underlayImage.hide();
	} else {
		this.underlayImage.show();
	}
	
	this.underlayImage.update();
	
	this.workspaceGroup = new Group(doc.getElementById("workspace"));
	this.undoManager = new UndoManager(Alberti.maxUndos);
	this.layerManager = new LayerManager(this.workspaceGroup, this.undoManager);
	
	this.loadLayers();                  // Load layers and shape data
	this.undoManager.enable();          // Enable undo manager
};

AlbertiDocument.prototype.setFilename = function(filename) {
	this.filename = filename;
};

// Set the underlay image source to the given data URL
AlbertiDocument.prototype.setUnderlayImageSrc = function(dataUrl) {
	// Assert that a valid data URL is passed in
	Util.assert(dataUrl.match(/^data:/), "Invalid data URL passed to AlbertiDocument::setUnderlayImage");
	
	this.underlayImage.setSource(dataUrl);
};

// Load layers and shape data
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
			
			// Iterate to next shape node before sanitizing, as the current
			// shape node will be removed from the document after sanitization.
			curShapeNode = Util.nextNonTextSibling(curShapeNode);
			
			// Strip unrecognized data from each imported shape
			shape.sanitize();
			
			// Insert each shape into the current layer
			this.layerManager.insertShape(shape);
		}
		
		curGroupNode = Util.nextNonTextSibling(curGroupNode);
	}
	
	this.layerManager.switchToHighestVisibleLayer();
};

// Returns the Alberti document as SVG+XML
AlbertiDocument.prototype.asXML = function() {
	var shapeData = new XMLSerializer().serializeToString(this.workspaceGroup.svgNode);
	var chunks = [];
	
	chunks[0]  = '<svg\n';
	chunks[0] += '	xmlns="http://www.w3.org/2000/svg" version="1.1"\n';
	chunks[0] += '	xmlns:xlink="http://www.w3.org/1999/xlink"\n';
	chunks[0] += '	xmlns:berti="'+Alberti.customns+'"\n'
	chunks[0] += '  fill="none">\n';
	
	// Set the document title. This will be the default filename in the save dialog.
	chunks[0] += '<title>'+(this.filename ? this.filename : "Alberti Document")+'</title>\n';
	
	chunks[0] += '<image id="underlayimg" xlink:href="';
	
	chunks[1] = this.underlayImage.imgNode.src;               // Serialize underlay image in its own chunk.
	
	chunks[2]  = '" ';
	chunks[2] += 'opacity="'+this.underlayImage.opacity+'" ';
	chunks[2] += this.underlayImage.isHidden() ? 'display="none"' : '';
	chunks[2] += '/>\n';

	chunks[3] = shapeData;                                    // Serialize layer and shape data in its own chunk
	
	chunks[4]  = '\n';
	chunks[4] += '</svg>\n';
	
	return chunks.join("");
};

AlbertiDocument.prototype.cleanup = function() {
	this.underlayImage.killAllListeners();
};
