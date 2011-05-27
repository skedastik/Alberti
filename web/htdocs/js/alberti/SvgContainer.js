/*
 * SvgContainer.js
 * extends SvgObject
 * 
 * Base abstraction for SVG container elements ("g", for example).
 * 
 * NOTE
 * 
 * Passing an SvgObject to SvgContainer::attachChild automatically calls
 * SvgObject::attach on that object, which in turn automatically calls
 * SvgObject::generate and SvgObject::push.
 * 
 * * */

function SvgContainer(svgTag) {
	SvgContainer.baseConstructor.call(this, svgTag);
}
Util.extend(SvgContainer, SvgObject);

SvgContainer.prototype.attachChild = function(svgObject) {
	svgObject.attach(this.svgNode);
};

// svgObject's SVG node will be attached after afterChild's SVG node.
SvgContainer.prototype.attachChildAfter = function(svgObject, afterChild) {
	svgObject.attachAfter(this.svgNode, afterChild.svgNode);
};
