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
 * TODO
 * 
 * Rather than storing an instance of FastImage, AlbertiDocument should simply 
 * store the underlay image data: source, opacity, and visibility. 
 * UserInterface can then instantiate its own FastImage object based on the 
 * AlbertiDocument data. This would be a cleaner separation of model and view
 * and eliminate some code duplication regarding resetting UserInterface's
 * underlay image cabinet.
 * 
 * * */

// Various exportable formats
AlbertiDocument.exportTypeSvg     = "svg";
AlbertiDocument.exportTypePng     = "png";
 
function AlbertiDocument(xml) {
	this.workspaceGroup = null;
	this.undoManager = null;
	this.layerManager = null;
	
	this.underlayImage = new FastImage(document.getElementById("underlayimg"));
	
	// A filename may be associated with an AlbertiDocument
	this.filename = null;
	
	// Underlay image is a hidden dummy image by default
	this.underlayImage.setSource("images/dummy.png");
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

// Swap out internal LayerManager and UndoManager with respective Delegates
AlbertiDocument.prototype.connectDelegates = function(lmDelegate, umDelegate) {
	this.layerManager = lmDelegate;
	this.layerManager.undoManager = umDelegate;
	this.undoManager = umDelegate;
};

AlbertiDocument.prototype.createEmptyDocument = function() {
	this.workspaceGroup = new Group().generate().set("id", "workspace");
	this.undoManager = new UndoManager(Alberti.maxUndos);
	this.layerManager = new LayerManager(this.workspaceGroup, this.undoManager);

	this.layerManager.newLayer("0");             // Layer "0" (used internally)
	this.layerManager.newLayer();                // Base layer
	
	this.undoManager.enable();
};

AlbertiDocument.prototype.importFromXML = function(xml) {
	var parser = new DOMParser();
	var doc = parser.parseFromString(xml, "text/xml");
	
	Util.assert(doc.documentElement.tagName != "parsererror",
		"AlbertiDocument::importFromXML could not parse imported file."
	);
	
	if (Alberti.serializeUnderlayImages) {
		var ulimg = doc.getElementById("underlayimg");
	
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
	}
	
	this.workspaceGroup = new Group(doc.getElementById("workspace"));
	this.undoManager = new UndoManager(Alberti.maxUndos);
	this.layerManager = new LayerManager(this.workspaceGroup, this.undoManager);
	
	this.layerManager.newLayer("0");    // Create layer "0" (used internally)
	this.loadLayers();                  // Load layers and shape data
	this.undoManager.enable();          // Enable undo manager
};

AlbertiDocument.prototype.setFilename = function(filename) {
	this.filename = filename;
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
					// A path indicates either an elliptical arc or circular arc shape
					var isEllipticalArc = curShapeNode.getAttributeNS(Alberti.customns, "rx");
					shape = (isEllipticalArc ? new EllipticalArc(curShapeNode) : new CircleArc(curShapeNode));
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
	this.layerManager.serializeAll();
	
	var chunks = [];
	
	chunks[0]  = '<svg\n';
	chunks[0] += '	xmlns="http://www.w3.org/2000/svg" version="1.1"\n';
	chunks[0] += '	xmlns:xlink="http://www.w3.org/1999/xlink"\n';
	chunks[0] += '	xmlns:berti="'+Alberti.customns+'"\n'
	chunks[0] += '  fill="none">\n';
	
	// Set the document title. This will be the default filename in the save dialog.
	chunks[0] += '<title>'+(this.filename ? this.filename : "Alberti Document")+'</title>\n';
	
	if (Alberti.serializeUnderlayImages) {
		chunks[0] += '<image id="underlayimg" xlink:href="';
	
		chunks[1] = this.underlayImage.imgNode.src;               // Serialize underlay image in its own chunk.
	
		chunks[2]  = '" ';
		chunks[2] += 'opacity="'+this.underlayImage.opacity+'" ';
		chunks[2] += this.underlayImage.isHidden() ? 'display="none"' : '';
		chunks[2] += '/>\n';
	}
	
	// Serialize layer and shape data in its own chunk
	chunks[3] = new XMLSerializer().serializeToString(this.workspaceGroup.svgNode).replace(/xmlns:[^=]+="[^"]+"/g, "");
	
	chunks[4]  = '\n';
	chunks[4] += '</svg>\n';
	
	return chunks.join("");
};

AlbertiDocument.prototype.cleanup = function() {
	this.underlayImage.killAllListeners();
};
