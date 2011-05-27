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
	
	// Package a value, be it a string describing quantity and units, or a 
	// number, into an object of the following format:
	//    {"quantity":<number>, "units":<units-string>}
	// "units" will be an empty string if the value was unitless.
	parseValue: function(value) {
		var quanity;
		var units = "";
		
		if (typeof value == "number") {
			quantity = value;
		} else if (typeof value == "string"){
			var tokens = value.match(/^([0-9]+(\.[0-9]+)?)\s*(.*)/);
			
			if (tokens !== null) {
				units = tokens[3];
				quanity = tokens[1];
			} else {
				tokens = value.match(/^([^0-9]*)\s*([0-9]+(\.[0-9]+)?)/);
				if (tokens !== null) {
					units = tokens[1];
					quanity = tokens[2];
				} else {
					throw "Util::parseValue found no numerical quantity in string ["+value+"]";
				}
			}
		} else {
			throw "Invalid, non-alphanumeric argument passed to Util::parseValue!";
		}
		
		return {"quantity":parseFloat(quantity), "units":units};
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
