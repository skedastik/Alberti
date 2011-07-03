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
 * Conf.js
 * 
 * Configuration params
 * 
 * * */

Alberti.fpsMax    = Animation.fpsMax;
Alberti.refreshms = Math.round(1000 / Alberti.fpsMax);      // limit redraw rate

Alberti.showToolTips = true;                            // Show tool helper tips?

Alberti.maxUndos = 100;                                  // Maximum number of undo actions

// This value is used when checking equality between two floats (see Util.equals method).
Alberti.tolerance = 3;

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
