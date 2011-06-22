/*
 * Conf.js
 * 
 * Configuration params
 * 
 * * */

Alberti.fpsMax    = Animation.fpsMax;
Alberti.refreshms = Math.round(1000 / Alberti.fpsMax);      // limit redraw rate

Alberti.showToolTips = true;                            // Show tool helper tips?

Alberti.maxUndos = 100;                                  // Maximum number of undo actions

// All numerical SVG attributes are rounded to this decimal place so as to
// leave an adequate number of significant digits for large numerical values. 
// This value is also used when checking equality between two floats (see 
// Util.equals method).
Alberti.decimalPrecision = 3;

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

// Set to true to enable server-side save script. This automatically forces a
// save dialog when saving Alberti documents.
Alberti.usePhpSaveScript = false;

// Set to true to save underlay image data with Alberti documents. This
// feature is too unstable across browsers (it crashes Firefox 5 when saving
// large underlay images) and leads to slow saves, so it is disabled by 
// default.
Alberti.serializeUnderlayImages = false;
