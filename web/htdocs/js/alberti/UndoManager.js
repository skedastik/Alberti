/*
 * UndoManager.js
 * 
 * An undo and redo stack.
 * 
 * * */
 
function UndoManager(maxActions) {
	this.undoStack = [];
	this.redoStack = [];
	
	this.actionBuffer = null;
	
	this.enabled = false;
	this.maxActions = maxActions;
}

// Push an action pair onto the undo stack. An action pair consists of two 
// methods belonging to a given object. One is responsible for carrying out 
// the undo action, the other, the redo action. Each one's arguments must be 
// supplied in separate arrays (or null for no arguments). When UndoManager::
// undo or UnderManager::redo are called, the action method will be bound to 
// the object, and invoked with its respective arguments. If an action does
// not have an undo counterpart, do not pass the undoFn and undoArgs 
// arguments. If more than 'maxActions' actions are on the stack at the time 
// of a push, the bottommost action will be discarded. A name must also be
// supplied to each undo action.
// 
// You may optionally pass 'true' for cascade to mark the undo action as 
// cascading. At the next call to UndoManager::undo, all contiguously-stacked,
// cascading actions with the same action name (and one more action after 
// that) will be undone, rather than just the topmost undo.
//
// Note that UndoManager::push clears the redo stack.
UndoManager.prototype.push = function(actionName, object, redoFn, redoArgs, undoFn, undoArgs, cascadeFlag) {
	if (this.enabled) {
		var action = {
			name: actionName,
			redo: function() {redoFn.apply(object, redoArgs);},
			undo: undoFn ? function() {undoFn.apply(object, undoArgs);} : null,
			cascades: cascadeFlag ? cascadeFlag : false
		};
		
		// Either buffer the action pair, or push it onto the undo stack
		if (this.actionBuffer !== null) {
			this.actionBuffer.push(action);
		} else {
			this.undoStack.push([action]);

			// Discard bottommost action if maxActions has been exceeded
			if (this.undoStack.length > this.maxActions) {
				this.undoStack.shift();
			}
		}

		// Clear the redo stack
		this.redoStack = [];
	}
};

// The UndoManager is disabled upon instantiation. Call to enable the 
// recording of undo actions. Future calls to UndoManager::push will take 
// effect.
UndoManager.prototype.enable = function() {
	this.enabled = true;
};

// Future calls to UndoManager::push will have no effect.
UndoManager.prototype.disable = function() {
	this.enabled = false;
};

// Returns the number of actions on the undo stack.
UndoManager.prototype.getStackSize = function() {
	return this.undoStack.length;
};

// Empty the undo stack completely
UndoManager.prototype.clearStack = function() {
	this.undoStack = [];
	this.redoStack = [];
};

// After calling recordStart, future calls to UndoManager::push will not 
// immediately push an action onto the undo stack. Rather, subsequent pushes
// will be buffered until UndoManager::recordStop is called, at which point
// the entire buffer will be pushed onto the undo stack as a unit. This allows 
// for undos consisting of multiple actions.
UndoManager.prototype.recordStart = function() {
	Util.assert(this.actionBuffer === null, "UndoManager::recordStart was invoked while already recording actions.");

	this.actionBuffer = [];
};

// Stop buffering actions and transfer the buffer to the undo stack as a unit.
UndoManager.prototype.recordStop = function() {
	if (this.actionBuffer !== null && this.actionBuffer.length > 0) {
		this.undoStack.push(this.actionBuffer);
		
		// Discard bottommost action if maxActions has been exceeded
		if (this.undoStack.length > this.maxActions) {
			this.undoStack.shift();
		}
	}
	
	this.actionBuffer = null;
};

// Invoke the topmost undo action, and transfer it to the redo stack.
UndoManager.prototype.undo = function() {
	Dbug.log("UNDO");
	
	// Disable self while performing undo action or else the undo action might register further undo actions.
	this.disable();
	
	if (this.undoStack.length > 0) {
		// If the initial undo cascades, add an extra iteration to the cascading undo loop
		var extraIterations = this.undoStack.peek().peek().cascades ? 1 : 0;
		
		do {
			var action = this.undoStack.pop();
		
			// Undo buffered actions in reverse order of array
			for (i = action.length -1; i >= 0; i--) {
				var theAction = action[i];
			
				// Undo actions may be null
				if (theAction.undo) {
					Dbug.log("   "+theAction.name+(theAction.cascades ? " (cascades)" : ""));
					theAction.undo();
				}
			}
		
			this.redoStack.push(action);
		} while (                                // May have to perform a cascading undo...
			this.undoStack.length > 0            // ...if there are undo actions remaining...
			&& (
				action.peek().cascades           // ...and the current undo action cascades...
				&& (
					// ...and the action at the top of the next buffered set also cascades and has the same action name...
					(this.undoStack.peek().peek().cascades && action.peek().name == this.undoStack.peek().peek().name)
					// ...or there is an extra cascade iteration remaining
					|| --extraIterations >= 0
				)
			)
		);
	}
	
	// Undo action complete, re-enable self
	this.enable();
};

// Invoke the topmost redo action, and transfer it to the undo stack.
UndoManager.prototype.redo = function() {
	Dbug.log("REDO");
	
	// Disable self while performing redo action or else the redo action might register further undo actions.
	this.disable();
	
	if (this.redoStack.length > 0) {
		// If the initial redo cascades, add an extra iteration to the cascading redo loop
		var extraIterations = this.redoStack.peek().peek().cascades ? 1 : 0;
		
		do {
			var action = this.redoStack.pop();
		
			// Redo buffered actions in natural order of array
			for (i = 0, aLen = action.length; i < aLen; i++) {
				Dbug.log("   "+action[i].name+(action[i].cascades ? " (cascades)" : ""));
				action[i].redo();
			}
		
			this.undoStack.push(action);
		} while (                                // May have to perform a cascading redo...
			this.redoStack.length > 0            // ...if there are redo actions remaining...
			&& (
				action[0].cascades               // ...and the current redo action cascades...
				&& (
					// ...and the action at the bottom of the next buffered set cascades and has the same action name...
					(this.redoStack.peek()[0].cascades && action[0].name == this.redoStack.peek()[0].name)
					// ...or there is an extra cascade iteration remaining
					|| --extraIterations >= 0
				)
			)
		);
	}
	
	// Redo action complete, re-enable self
	this.enable();
};
