/*
 * Alberti.js
 * 
 * Application class.
 * 
 * * */

Alberti.svgDoc  = window.document;                        // the SVG document
Alberti.svgRoot;                                          // root SVG element--the <svg> node

Alberti.svgns    = "http://www.w3.org/2000/svg";          // SVG XML namespace
Alberti.xlinkns  = "http://www.w3.org/1999/xlink";           
Alberti.customns = "http://www.albertidraw.com/alberti";      // Custom XML namespace for extending SVG document

Alberti.fpsMax    = Animation.fpsMax;
Alberti.refreshms = Math.round(1000 / Alberti.fpsMax);      // limit redraw rate

Alberti.showToolTips = true;                            // Show tool helper tips?

Alberti.maxUndos = 50;                                  // Maximum number of undo actions

// All numerical SVG attributes are rounded to this decimal place so as to
// leave an adequate number of significant digits for large numerical values. 
// This value is also used when checking equality between two floats (see 
// Util.equals method).
Alberti.decimalPrecision = 3;
Alberti.smallestUnit = 1 / Math.pow(10, Alberti.decimalPrecision);
Alberti.twiceSmallestUnit = Alberti.smallestUnit * 2;

// useful constants for various calculations
Alberti.halfOriginalWindowWidth = Math.round(window.innerWidth / 2);
Alberti.halfOriginalWindowHeight = Math.round(window.innerHeight / 2);

Alberti.optimizedClassName = "optimized";                // special CSS class used to render non-anti-aliased line
Alberti.crispLines = true;                               // if true, lines are always rendered with the above CSS style

// For whatever reason, SVG rendering speed slows down drastically for line
// widths less than or equal to 1. Hence, line width must be increased 
// slightly during optimized rendering.
Alberti.defaultLineWidth = 1;
Alberti.lineWidthDeltaOptimized = 0.01;

// Set to true to enable non-scaling lines. This is only useful if the SVG 
// implementation does not support "vector-effect: non-scaling-stroke".
Alberti.nonScalingLinesHack = true;

function Alberti(evt) {
	Alberti.svgRoot = Alberti.svgDoc.getElementById("svgroot");
	
	this.doc = new AlbertiDocument();
	this.ui = new UserInterface(this.doc);
}
