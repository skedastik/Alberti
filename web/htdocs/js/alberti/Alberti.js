/*
 * Alberti.js
 * 
 * Application controller.
 * 
 * * */

Alberti.svgns    = "http://www.w3.org/2000/svg";          // SVG XML namespace
Alberti.xlinkns  = "http://www.w3.org/1999/xlink";           
Alberti.customns = "http://www.albertidraw.com/alberti";      // Custom XML namespace for extending SVG document

Alberti.svgRoot;                                           // Root SVG element--the <svg> node

function Alberti() {
	this.clipBoard = new ClipBoard();
	
	Alberti.svgRoot = document.getElementById("svgroot");
	
	// Open with an empty document by default
	this.doc = new AlbertiDocument();
	
	// Create the user interface, passing self as application controller
	this.ui = new UserInterface(this.doc, this.clipBoard, this, "handleSaveDocument", "handleOpenDocument");
	
	// Reveal the document body now that application setup is complete
	document.body.style.display = "";
}

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

Alberti.prototype.handleOpenDocument = function(documentXml) {
	var newDoc = new AlbertiDocument(documentXml);
};
