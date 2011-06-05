/*
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
	
	// Convert rgb string of form "rgb(r, g, b)" to hex string of form "#rrggbb"
	rgbToHex: function(rgbString) {
		return "#"+rgbString.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/).slice(1).map(function(x) {
			return parseInt(x).toString(16)
		}).join("");
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
	
	quarterPi: Math.PI / 4,
	halfPi: Math.PI / 2,
	threeHalvesPi: Math.PI * 1.5,
	twoPi: Math.PI * 2,
	
	radToDeg: function(a) {
		return (a / Math.PI) * 180;
	},
	
	degToRad: function(a) {
		return (a / 180) * Math.PI;
	},
	
	// Returns true if angle n (in radians) is between angles (i.e. between 
	// clock hands) a and b.
	angleIsBetweenAngles: function(n, a, b) {
		if (b < a) {
			var temp = a;
			a = b;
			b = temp;
		}
		
		n %= Util.twoPi;
		a %= Util.twoPi;
		b %= Util.twoPi;
		
		if (a < 0) {
			a += Util.twoPi;
			b += Util.twoPi;
		}
		
		if (b < a) {
			b += Util.twoPi;
		}
		
		if (n < 0) {
			n += Util.twoPi;
		}
		
		return (n >= a && n <= b) || (n + Util.twoPi >= a && n + Util.twoPi <= b);
	},
	
	// Returns 0 is x is zero, 1 if x is positive, -1 if x is negative
	sign: function(x) {
		return x > 0 ? 1 : (x < 0 ? -1 : 0);
	},
	
	// Checks the equality of x and y rounded to predefined decimal place.
	//
	// A useful function for checking delta values, particularly if you are
	// going to be performing divisions, or trigonometric operations using 
	// that delta value and need to be sure it is nonzero. Also useful for
	// checking the equality of floats, allowing for epsilon uncertainties.
	equals: function(x, y) {
		return Util.roundToDecimal(x, Alberti.decimalPrecision)
			== Util.roundToDecimal(y, Alberti.decimalPrecision);
	},
	
	// Returns true if x is between numbers u and v, inclusive, and allowing
	// for floating point error.
	between: function(x, u, v) {
		x = Util.roundToDecimal(x, Alberti.decimalPrecision);
		u = Util.roundToDecimal(u, Alberti.decimalPrecision);
		v = Util.roundToDecimal(v, Alberti.decimalPrecision);
		
		return x <= Math.max(u, v) && x >= Math.min(u, v);
	}
	
};
