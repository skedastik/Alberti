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
 * AutoScale.js
 * 
 * Currently, SVG lacks reliable support for non-scaling rendering of shapes
 * and stroke effects. AutoScale::update dynamically adjusts stroke widths and 
 * object scales to remain constant throughout scaling operations. Yes, it is 
 * a dirty hack, but c'est la vie.
 * 
 * To complicate matters further, SVG rendering speed drops drastically for
 * line widths less than or equal to 1 (pixel). Because of this, AutoScale
 * supports dynamic adjustment of line widths across all its objects 
 * registered with AutoScale.lineWidth.
 * 
 * USAGE
 * 
 * Create the AutoScale object and register SvgObjects via registerObject.
 * registerObject expects a shape (SvgObject), an auto-scale flag, and a 
 * default value, the meaning of which depends on the auto-scale flag. The
 * auto-scale flags are as follows:
 * 
 *    AutoScale.scale - Automatically re-scale objects by manipulating their 
 *    SVG "transform" attributes directly. The default value should be the 
 *    default scale of the object (typically 1.0).
 * 
 *    AutoScale.lineWidth - Automatically adjust line widths to remain 
 *    visually consistent at any scale. The default value should be the 
 *    default line width of the object.
 *    
 * You may also register CSS styles for auto-scaling using registerStyle and
 * unregisterStyle. registerStyle expects a CSSStyleDeclaration object (e.g.
 * document.styleSheets[0].cssRules[0].style), an auto-scale flag, and a 
 * default value. It uses a different set of flags:
 * 
 *    AutoScale.dashArray - Automatically adjust the dash lengths of a simple,
 *    alternating stroke-dasharray property (e.g. 2,2 or 3,3). The default
 *    value indicates the dash length.
 * 
 * Every time you scale the coordinate system containing objects registered
 * with AutoScale, call AutoScale::update, passing in the new scale value.
 * 
 * AutoScale::setLineWidthAdjustment allows you to adjust the line widths of
 * all objects registered with the AutoScale.lineWidth flag. These objects 
 * will have their line widths adjusted by the given delta value. Pass 0 to 
 * remove the adjustment. Changes will not reflect until AutoScale::update 
 * is called again.
 * 
 * * */

// AutoScale flag codes
AutoScale.scale = 0;
AutoScale.lineWidth = 1;

// AutoScale CSS flag codes
AutoScale.dashArray = 2;
 
function AutoScale() {
	this.shapes = [];
	this.styles = [];
	this.lineWidthAdjustment = 0;
}

AutoScale.prototype.registerObject = function(shape, autoFlag, defaultVal) {
	for (var i = 0, sLen = this.shapes.length; i < sLen; i++) {
		if (this.shapes[i]["shape"] === shape) {
			return;
		}
	}
	
	this.shapes.push({"shape":shape, "default":defaultVal, "flag":autoFlag});
};

AutoScale.prototype.unregisterObject = function(shape) {
	for (var i = 0, sLen = this.shapes.length; i < sLen; i++) {
		if (this.shapes[i]["shape"] === shape) {
			this.shapes.splice(i, 1);
			break;
		}
	}
};

AutoScale.prototype.registerStyle = function(style, autoFlag, defaultVal) {
	for (var i = 0, sLen = this.styles.length; i < sLen; i++) {
		if (this.styles[i]["style"] === style) {
			return;
		}
	}
	
	this.styles.push({"style":style, "default":defaultVal, "flag":autoFlag});
};

AutoScale.prototype.unregisterStyle = function(style) {
	for (var i = 0, sLen = this.styles.length; i < sLen; i++) {
		if (this.styles[i]["shape"] === style) {
			this.styles.splice(i, 1);
			break;
		}
	}
};

AutoScale.prototype.update = function(scale) {
	for (var i = 0, sLen = this.shapes.length; i < sLen; i++) {
		switch (this.shapes[i]["flag"]) {
			
			case AutoScale.scale:
				this.shapes[i]["shape"].set("transform", "scale("+(this.shapes[i]["default"] / scale)+")");
				break;
				
			case AutoScale.lineWidth:
				if (Alberti.nonScalingLinesHack) {
					// Line-width must be floored rather than rounded, or else single-
					// pixel width lines are rendered 2 pixels wide.
					this.shapes[i]["shape"].set("stroke-width", 
						Util.floorToDecimal((this.shapes[i]["default"] + this.lineWidthAdjustment) / scale, 3));
				}
				break;
				
			case AutoScale.dashArray:
				break;
		}
	}
	
	for (var i = 0, sLen = this.styles.length; i < sLen; i++) {
		switch (this.styles[i]["flag"]) {
			
			case AutoScale.dashArray:
				var dashLength = Util.floorToDecimal(this.styles[i]["default"] / scale, 3);
				this.styles[i]["style"].setProperty("stroke-dasharray", dashLength+","+dashLength, "");
				break;
		}
	}
};

AutoScale.prototype.setLineWidthAdjustment = function(delta) {
	this.lineWidthAdjustment = delta;
};
