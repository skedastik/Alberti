/*
 * Alberti.js
 * 
 * Application class.
 * 
 * * */

Alberti.svgns    = "http://www.w3.org/2000/svg";          // SVG XML namespace
Alberti.xlinkns  = "http://www.w3.org/1999/xlink";           
Alberti.customns = "http://www.albertidraw.com/alberti";      // Custom XML namespace for extending SVG document

function Alberti(evt) {
	this.clipBoard = new ClipBoard();
	this.doc = new AlbertiDocument();
	this.ui = new UserInterface(this.doc, this.clipBoard, this, "saveDocument", "openDocument");
}

Alberti.prototype.saveDocument = function(type) {
	switch (type) {
		case "alb":
		default:
			// Convert document XML to a base64-encoded data url
			var dataUrl = "data:image/svg+xml;base64,"+Util.utf8_to_b64(this.doc.asXML());
			
			if (Alberti.usePhpSaveScript) {
				// TODO: PHP save script to modify HTTP headers
			} else {
				window.open(dataUrl);
			}
			break;
	}
};

Alberti.prototype.openDocument = function() {
	
};
