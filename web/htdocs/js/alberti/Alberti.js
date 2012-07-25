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
 * Alberti.js
 * 
 * Application controller.
 * 
 * * */

Alberti.version  = "0.1.0";

Alberti.svgns    = "http://www.w3.org/2000/svg";          // SVG XML namespace
Alberti.xlinkns  = "http://www.w3.org/1999/xlink";           
Alberti.customns = "http://www.albertidraw.com/alberti";      // Custom XML namespace for extending SVG document

Alberti.svgRoot;                                           // Root SVG element--the <svg> node

function Alberti() {
	
	// Use {vector-effect: non-scaling-stroke} if hack is disabled
	if (!Alberti.nonScalingLinesHack) {
		document.styleSheets[0].cssRules[1].style.setProperty("vector-effect", "non-scaling-stroke", "");
	}
	
	this.clipBoard = new ClipBoard();
	
	Alberti.svgRoot = document.getElementById("svgroot");
	
	// Create the user interface, passing self as application controller
	this.ui = new UserInterface(
		this.clipBoard, this, "handleNewDocument", "handleSaveDocument", "handleOpenDocument"
	);
	
	// Open with an empty document by default
	this.loadDocument(new AlbertiDocument());
	
	// Display version string in About box
	document.getElementById("version").innerHTML = "v"+Alberti.version;
	
	// Reveal the document body now that application setup is complete
	document.getElementById("content").style.display = "";
}

Alberti.prototype.handleNewDocument = function() {
	var newDoc = new AlbertiDocument();	
	this.loadDocument(newDoc);
};

Alberti.prototype.handleSaveDocument = function(type) {
	switch (type) {
		
		// Save document as SVG
		case AlbertiDocument.exportTypeSvg:
		default:
			// Convert document XML to a base64-encoded data url, giving it a
			// default filename if it was not loaded by the user.
			var data = Util.utf8_to_b64(this.doc.asXML());
			var dataUrl = "data:image/svg+xml;base64,"+data;
			
			if (Alberti.usePhpSaveScript) {
				// TODO: Use PHP save script that modifies HTTP headers in order to force "Save as..." dialog
			} else {
				window.open(dataUrl);
			}
			
			// Mark document as clean to eliminate unsaved-data warning
			this.doc.undoManager.setCleanState();
			break;
	}
};

Alberti.prototype.handleOpenDocument = function(documentXml, filename) {
	var newDoc = new AlbertiDocument(documentXml);
	
	newDoc.setFilename(filename);
	this.loadDocument(newDoc);
};

Alberti.prototype.loadDocument = function(newDoc) {
	var workspaceGroupNode = document.getElementById("workspace");
	
	// Replace the current workspace group node with the new document's workspace group node
	Util.replaceElement(workspaceGroupNode, newDoc.workspaceGroup.svgNode);
	
	// Prepare the user interface for the new document
	this.ui.prepareForDocument(newDoc);
	
	// Clean up event listeners tied to the previous document
	if (this.doc) {
		this.doc.cleanup();
	}
	
	this.doc = newDoc;
};
