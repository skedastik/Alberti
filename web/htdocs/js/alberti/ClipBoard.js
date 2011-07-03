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
 * ClipBoard.js
 * 
 * Copy/paste facilities for Alberti.
 * 
 * * */
 
function ClipBoard() {
	this.shapes = [];
}

// Copy Shape objects in given array to clip board
ClipBoard.prototype.copy = function(shapeArray) {
	if (shapeArray.length > 0) {
		this.shapes = [];
	
		for (var i = 0, len = shapeArray.length; i < len; i++) {
			this.shapes.push(shapeArray[i].clone());
		}
	}
};

// Returns true if clip board is empty, false otherwise
ClipBoard.prototype.isEmpty = function() {
	return this.shapes.length == 0;
};

// Paste shapes from clip board into current layer of given LayerManager
ClipBoard.prototype.paste = function(layerManager) {
	for (var i = 0, len = this.shapes.length; i < len; i++) {
		layerManager.insertShape(this.shapes[i].clone().generate());
	}
};

// Clear the clip board
ClipBoard.prototype.clear = function() {
	this.shapes = [];
};
