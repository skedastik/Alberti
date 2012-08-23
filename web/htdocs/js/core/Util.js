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
 * Util.js
 * 
 * Core utility functions.
 * 
 * * */

// Function binding extension for Function objects
Function.prototype.bindTo = function(object) {
   var outerFn = this;

   return function() {
      return outerFn.apply(object, arguments);
   }
}

// Array extension that returns the last element of an array
Array.prototype.peek = function() {
	return this[this.length - 1];
}

// Returns a one-level deep copy of array
Array.prototype.clone = function() {
	return this.slice(0);
}

// Returns true if every element strictly equals corresponding element in a.
// Returns false if arrays are of unequal length.
Array.prototype.equals = function(a) {
	return this.length == a.length && this.every(function(value, index) {
		return value === a[index];
	});
};

// Returns true if every element in array is contained in a.
Array.prototype.isSubsetOf = function(a) {
	return this.every(function(value) {
		return a.indexOf(value) != -1;
	});
}

// Trig abbreviations
var sin =         Math.sin;
var cos =         Math.cos;
var tan =         Math.tan;
var atan =        Math.atan;
var quarterPi =   Math.PI / 4;
var halfPi =      Math.PI / 2;
var pi =          Math.PI;
var threeHalfPi = Math.PI * 1.5;
var twoPi =       Math.PI * 2;

// Miscellaneous utility functions
var Util = {

	// Kevin Lindsey's simulated inheritance approach
	extend: function(subclass, baseclass) {
		function Inheritance() {}
		Inheritance.prototype = baseclass.prototype;

		subclass.prototype = new Inheritance();
		subclass.prototype.constructor = subclass;
		subclass.baseConstructor = baseclass;
		subclass.superclass = baseclass.prototype;
	},
	
	assert: function(condition, errMsg) {
		if (!condition) {
			throw errMsg;
		}
	},
	
	// Get y-coordinate of element's origin relative to top of page
	getClientY: function(element) {
	   var y = 0;

	   do {
	      y += element.offsetTop;
	   } while ((element = element.offsetParent));

	   return y;
	},
	
	// Get x-coordinate of element's origin relative to left of page
	getClientX: function(element) {
	   var x = 0;

	   do {
	      x += element.offsetLeft;
	   } while ((element = element.offsetParent));

	   return x;
	},
	
	// Returns true if parent element has the given child element, false otherwise
	hasChild: function(parent, child) {
		return child ? (child.compareDocumentPosition(parent) & Node.DOCUMENT_POSITION_CONTAINS ? true : false) : false;
	},
	
	// Get first non-text child of specified element (null if none found)
	firstNonTextChild: function(element) {
		if (element.firstChild) {
			return (element.firstChild.nodeType != 8 && element.firstChild.nodeType != 3)
				? element.firstChild : Util.nextNonTextSibling(element.firstChild);
		} else {
			return null;
		}
	},
	
	// Get next sibling that is not a text or comment node (null if none found)
	nextNonTextSibling: function(element) {
		var next = element.nextSibling;

		while (next != null && (next.nodeType == 8 || next.nodeType == 3)) {
			next = next.nextSibling;
		}

		return next;
	},
	
	// Replace a document element with a new element
	replaceElement: function(oldElement, newElement) {
		var parent = oldElement.parentNode;
		parent.insertBefore(newElement, oldElement);
		parent.removeChild(oldElement);
	},
	
	// Add a CSS class to the given element
	addHtmlClass: function(element, className) {
		var pattern = new RegExp('(^|\\s)'+className+'($|\\s)', 'i');
		if (!element.className.match(pattern)) {
			element.className += ' '+className;
		}
	},

	// Remove the specified CSS class from the given element
	removeHtmlClass: function(element, className) {
	   var pattern = new RegExp('(^|\\s)'+className, 'i');
	   element.className = element.className.replace(pattern, '');
	},
	
	// Base64 encode the given string
	utf8_to_b64: function(str) {
	    return window.btoa(unescape(encodeURIComponent(str)));
	},
	
	// Decode the given Base64 string
	b64_to_utf8: function(str) {
	    return decodeURIComponent(escape(window.atob(str)));
	},
	
	// Convert rgb string of form "rgb(r, g, b)" to hex string of form 
	// "#rrggbb". Returns original string if conversion failed.
	rgbToHex: function(rgbString) {
		var tokens = rgbString.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
		return tokens ? "#"+tokens.slice(1).map(function(x) {return parseInt(x).toString(16)}).join("") : rgbString;
	},
	
	// Package a value, be it a string describing quantity and units, or a 
	// number, into an object of the following format:
	//    {"quantity":<number>, "units":<units-string>}
	// "units" will be an empty string if the value was unitless.
	parseValue: function(value) {
		var type = typeof value;
		var quantity;
		var units = "";
		
		Util.assert(
			type == "number" || type == "string",
			"Invalid, non-alphanumeric argument passed to Util::parseValue"
		);
		
		if (type == "number") {
			quantity = value;
		} else if (type == "string"){
			var tokens = value.match(/^\s*(-?[0-9]+(\.[0-9]+)?)\s*([^\s\-0-9]+)?\s*$|^\s*(-?)(([^\s\-0-9]+)\s*)?([0-9]+(\.[0-9]+)?)\s*$/);
			
			Util.assert(tokens !== null, "Util::parseValue found malformed quantity, or ambiguous units in string '"+value+"'");
			
			quantity = parseFloat(tokens[1] ? tokens[1] : tokens[4]+tokens[7]);
			units = tokens[3] ? tokens[3] : tokens[6];
		}
		
		return {"quantity":quantity, "units":units};
	},
	
	// Returns x rounded to the nearest multiple of n
	roundToMultiple: function(x, n) {
		return Math.round(x / n) * n;
	},
	
	// Returns x rounded to the nth decimal
	roundToDecimal: function(x, n) {
		var scale = Math.pow(10, n);
		return Math.round(x * scale) / scale;
	},
	
	// Returns x floored to the nth decimal
	floorToDecimal: function(x, n) {
		var scale = Math.pow(10, n);
		return Math.floor(x * scale) / scale;
	},
	
	// Return x constrained to the range [min, max]
	minMax: function(x, min, max) {
		return Math.max(min, Math.min(max, x));
	},
	
	radToDeg: function(a) {
		return (a / pi) * 180;
	},
	
	degToRad: function(a) {
		return (a / 180) * pi;
	},
	
	// Returns true if angle n (in radians) is between angles (i.e. between 
	// clock hands) a and b.
	angleIsBetweenAngles: function(n, a, b) {
		if (b < a) {
			var temp = a;
			a = b;
			b = temp;
		}
		
		n %= twoPi;
		a %= twoPi;
		b %= twoPi;
		
		if (a < 0) {
			a += twoPi;
			b += twoPi;
		}
		
		if (b < a) {
			b += twoPi;
		}
		
		if (n < 0) {
			n += twoPi;
		}
		
		return Util.between(n, a, b) || Util.between(n + twoPi, a, b);
	},
	
	// Returns polar angle a relative to polar angle b in radians
	angleRelativeTo: function(a, b) {
		return (a < b ? a + twoPi - b : a - b);
	},
	
	// Returns 0 is x is zero, 1 if x is positive, -1 if x is negative
	sign: function(x) {
		return x > 0 ? 1 : (x < 0 ? -1 : 0);
	},
	
	// Checks the equality of x and y allowing for floating point error within
	// +/- a predfined tolerance, or the value specified by tolerance. A 
	// useful function for checking delta values, discriminants, etc.
	equals: function(x, y, tolerance) {
		tolerance = tolerance !== undefined ? tolerance : Alberti.tolerance;
		return x >= y - tolerance && x <= y + tolerance;
	},
	
	// Returns true if x is between numbers u and v, inclusive, allowing for
	// floating point error within +/- a predifined tolerance, or the value 
	// specified by tolerance.
	between: function(x, u, v, tolerance) {
		tolerance = tolerance !== undefined ? tolerance : Alberti.tolerance;
		return (x <= Math.max(u, v) + tolerance) && (x >= Math.min(u, v) - tolerance);
	}
	
};
