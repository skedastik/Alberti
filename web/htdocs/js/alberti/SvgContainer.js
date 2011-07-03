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

// svgObject's SVG node will be attached before beforeChild's SVG node.
SvgContainer.prototype.attachChildBefore = function(svgObject, beforeChild) {
	svgObject.attachBefore(this.svgNode, beforeChild.svgNode);
};
