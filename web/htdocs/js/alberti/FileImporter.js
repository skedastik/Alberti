/*
 * FileImporter.js
 * extends EventHandler
 * 
 * Handles importing of files through an HTML input of type "file". Currently
 * only supports importing of single files.
 * 
 * USAGE
 * 
 * The constructor expects a reference to an existing file input element, and
 * accepted MIME type. Pass 'true' for the 'importAsText' argument in order to
 * import files as text rather than data URL's. The 'controller' argument is 
 * an object that implements an import handler method. 'importHandler' is the 
 * name of this method.
 * 
 * The import handler should take a string argument representing the imported
 * data and a string argument containing the filename. If 'importAsText' was 
 * set to true, the imported data will be a text representation of the data as 
 * opposed to a base64 encoded data URL.
 * 
 * * */
 
function FileImporter(inputElement, mimeType, importAsText, controller, importHandler) {
	FileImporter.baseConstructor.call(this);
	this.inputElement = inputElement;
	this.importAsText = importAsText;           // File data should be imported as text rather than data URL?
	this.controller = controller;
	this.importHandler = importHandler;
	
	Util.assert(typeof FileReader !== "undefined", "Your browser does not support the required FileReader object.");
	
	// Create FileReader and listen for 'loadend' events.
	this.fileReader = new FileReader();
	this.registerListener("loadend", this.fileReader, false);
	
	// Set input element's 'accept' attribute to match MIME type passed in,
	// and listen for file imports.
	this.inputElement.accept = mimeType;
	this.registerListener("change", this.inputElement, false);
}
Util.extend(FileImporter, EventHandler);

// Prompt the user to import a file by inducing a click on the file input
// element. Only seems to work in Firefox.
FileImporter.prototype.prompt = function() {
	this.inputElement.click();
};

// Returns the filename of the currently imported file (or null if none).
FileImporter.prototype.getFilename = function() {
	return this.inputElement.files[0].fileName || null;
};

// Invoked every time the user imports a new file.
FileImporter.prototype.change = function(evt) {
	if (this.importAsText) {
		this.fileReader.readAsText(this.inputElement.files[0]);
	} else {
		this.fileReader.readAsDataURL(this.inputElement.files[0]);
	}
};

FileImporter.prototype.loadend = function(evt) {
	this.controller[this.importHandler](this.fileReader.result, this.getFilename());
	
	// Unregister change listener as input element is about to be re-created
	this.unregisterListener("change", this.inputElement, false);
	
	// Re-create the input element so that the same file can be loaded repeatedly
	var newInput = document.createElement("input");
	newInput.type = "file";
	newInput.id = this.inputElement.id;
	
	Util.replaceElement(this.inputElement, newInput);
	this.inputElement = newInput;
	
	this.registerListener("change", this.inputElement, false);
};
