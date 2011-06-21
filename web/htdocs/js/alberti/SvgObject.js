/*
 * SvgObject.js
 * extends EventHandler
 * 
 * Base abstraction for SVG elements. Each instance holds a reference to a
 * corresponding SVG node.
 * 
 * NOTES
 * 
 * When setting attributes, SvgObject rounds to the decimal place specified by
 * Alberti.decimalPrecision so as to leave an adequate number of significant 
 * digits for large numerical attributes.
 * 
 * USAGE
 * 
 * Constructor
 * 
 * The constructor expects an SVG element type, e.g. "g" or "circle". 
 * Alternatively a reference to an existing SVG node may be passed in. In this
 * case, SvgObject will call the inheriting class' pull method to populate its
 * properties with data from the SVG node (or do nothing if the SvgObject was
 * instantiated directly).
 * 
 * Extending SvgObject
 * 
 * Inheriting classes should override SvgObject::initialize, SvgObject::push, 
 * and SvgObject::pull. push() should update the SVG node's attributes based
 * on the SvgObject's properties, whereas pull() should update the SvgObject's 
 * properties based on the SVG node's attributes.
 * 
 * Initialization of SvgObject properties
 * 
 * The inheriting class' constructor shouldn't initialize properties that are
 * tied to SVG node attributes. These properties should be initialized in the 
 * SvgObject's initialize method. The initialize method should not perform
 * operations on its SVG node. The reason for this is that the SVG node may 
 * not exist yet. It is either created via SvgObject::generate below, or 
 * passed to the constructor. SvgObject conditionally calls initialize, 
 * depending on whether or not an SVG node was passed to its constructor (in 
 * which case the inheriting class' pull method, in effect, serves as the 
 * initializer), so only essential initialization should take place in the
 * object's constructor.
 * 
 * SvgObject::generate
 * 
 * In most cases, you should not need to override SvgObject's generate method,
 * but if you do, you should first invoke SvgObject's generate method via
 * the superclass property as it is responsible for creating the SVG node. You
 * may then initialize its attributes in the overriding generate method.
 * 
 * As a rule of thumb when instantiating SvgObjects, if you plan to add the 
 * object to the SVG document at some point, you should call 
 * SvgObject::generate right after instantiating it, e.g.:
 * 
 *    var foo = new SvgObject("line").generate();
 * 
 * SVG nodes are not generated automatically as you may want to use an object 
 * purely for its functionality without actually instantiating an SVG node 
 * (for instance, you may want to use a Line object's functionality without 
 * actually appending it to the SVG document).
 * 
 * Getting/setting SVG node attributes
 * 
 * In most cases, after calling SvgObject::generate, you will use
 * SvgObject::push to ferry data from an object's properties to its 
 * corresponding SVG node, but you can use SvgObject::set and SvgObject::get 
 * to manipulate SVG node attributes directly.
 * 
 * Use SvgObject::setNodeId and SvgObject::getNodeId to get/set the node's id
 * attribute.
 * 
 * Adding SVG nodes to the document
 * 
 * Assuming that either an existing SVG node was passed to the SvgObject's
 * constructor or SvgObject::generate was already called, all you need to do
 * is call SvgObject::attach. Note that SvgObject::attach automatically calls 
 * SvgObject::push.
 * 
 * * */

function SvgObject(svgTagOrObject) {
	if (typeof svgTagOrObject == "string") {
		Util.assert(svgTagOrObject !== "", "Invalid SVG tag string passed to SvgObject constructor.");
		
		this.svgNode = null;
		this.svgTag = svgTagOrObject;
		this.initialize();
	} else {
		this.svgNode = svgTagOrObject;
		this.svgTag = this.svgNode.nodeName;
		this.pull();
	}
}

// Set SVG node's attribute to given value. Pass empty string value to delete 
// attribute. A namespace for that attribute may optionally be supplied.
// Returns self.
SvgObject.prototype.set = function(attr, value, namespace) {
	if ((value === "" || value === null)) {
		this.svgNode.removeAttributeNS(arguments.length > 2 ? namespace : null, attr);
	} else {
		this.svgNode.setAttributeNS(arguments.length > 2 ? namespace : null, attr,
			typeof value == "number" ? Util.roundToDecimal(value, Alberti.decimalPrecision) : value);
	}
	
	return this;
};

// Get SVG node attribute, optionally supplying a namespace.
SvgObject.prototype.get = function(attr, namespace) {
	// Make sure to return a Number object if the string represents a number
	var value = this.svgNode.getAttributeNS(arguments.length > 1 ? namespace : null, attr);
	var n = parseFloat(value);
	return !isNaN(n) ? n : value;
};

// Add element to SVG document under specified parent node. Note that
// SvgObject::push is called automatically before adding the element to the 
// SVG document. Has no effect if the object is already a part of the SVG 
// document.
SvgObject.prototype.attach = function(parentNode) {
	if (this.svgNode.parentNode === null) {
		this.push();
		parentNode.appendChild(this.svgNode);
	}
};

// Same as attach, but attaches after the given child node.
SvgObject.prototype.attachAfter = function(parentNode, afterChildNode) {
	if (this.svgNode.parentNode === null) {
		this.push();
		parentNode.insertBefore(this.svgNode, afterChildNode.nextSibling);
	}
};

// Same as attach, but attaches before the given child node.
SvgObject.prototype.attachBefore = function(parentNode, beforeChildNode) {
	if (this.svgNode.parentNode === null) {
		this.push();
		parentNode.insertBefore(this.svgNode, beforeChildNode);
	}
};

// Remove this object's SVG node from the SVG document. Returns self.
SvgObject.prototype.detach = function() {
	if (this.svgNode.parentNode !== null) {
		this.svgNode.parentNode.removeChild(this.svgNode);
	}
	
	return this;
};

// Instantiate the actual SVG node. Returns self.
SvgObject.prototype.generate = function() {
	if (!this.svgNode) {
		this.svgNode = document.createElementNS(Alberti.svgns, this.svgTag);
	}
	
	return this;
};

// Abstract: Set default values for object's properties
SvgObject.prototype.initialize = function() {};

// Abstract: Update the SVG node's attributes to match its SvgObject instance.
SvgObject.prototype.push = function() {};

// Abstract: Update the SvgObject's properties to match its SVG node.
SvgObject.prototype.pull = function() {};

// Remove all unrecognized attributes from an SvgObject whose properties were 
// pulled from an existing node. This is achieved by actually discarding the
// existing node and regenerating a sanitized version.
SvgObject.prototype.sanitize = function() {
	if (this.svgNode && this.svgNode.parentNode) {
		var parent = this.svgNode.parentNode;
		var sibling = this.svgNode.nextSibling;
		
		this.detach();
		this.svgNode = null;
		this.generate();
		this.attachBefore(parent, sibling);
	}
};
