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
 * KeyCodes.js
 * 
 * * */

var KeyCode = {
	shift: 16,
	ctrl:  17,
	alt:   18,
	esc:   27,
    
	del:       46,
	backspace: 8,
	enter:     13,
    
	arrowUp:   38,
	arrowDown: 40,
    
	number1: 49,
	number2: 50,
	number3: 51,
	number4: 52,
	number5: 53,
	number6: 54,
	number7: 55,
	number8: 56,
	number9: 57,
	
	// Tool keys
	backStep:         192,      // tilde - Undo last tool step
	modParallel:      76,       // 'l' -   Parallel line constraint
	modPerpendicular: 80,       // 'p' -   Perpendicular line constraint
	modPinning:       83,       // 's' -   Line pinning constraint
    
	lpCollapse: 220,       // '\' -   Collapse/reveal layer panel
	snap:       68,        // 'd' -   Activate snap-to-intersection
	autoPan:    32,        // space - Pan to next marker
	manPan:     69,        // 'e' -   Alternate manual panning key
	undoRedo:   90,        // 'z' -   Undo/redo key (shift for redo)
	cut:        88,        // 'x'
	paste:      86,        // 'v'
	selectAll:  65,        // 'a'
	newDoc:     78,        // 'n' -   Create a new document
	save:       83,        // 's' -   Save the document
	load:       79,        // 'o' -   Open a document
};
