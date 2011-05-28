/*
 * Delegate.js
 * 
 * Delegate allows you to take an object instance and generate a delegate
 * object with additional functionality. This is useful for connecting a data 
 * object with its corresponding view (e.g., every time an Array's "push" 
 * method is invoked, add the pushed element to a corresponding HTML table).
 * 
 * USAGE
 * 
 * For each data object that needs to be delegated, create a new subclass of
 * Delegate. In the subclass' constructor, call Delegate::mapMethod once for
 * each method that needs delegation, e.g.:
 * 
 *    // Need to delegate 'push' method of Array 'data'
 *    var data = [];
 *    
 *    // So create an appropriate Delegate subclass
 *    function ArrayDelegate(object, ...) {
 *       // Call Delegate constructor using your own inheritance scheme
 *       callBaseClassConstructor(object);
 *       // Map 'push' to ArrayDelegate's 'pushDelegate' method
 *       this.mapMethod("push", "pushDelegate");
 *    }
 *    
 *    // Define "pushDelegate" with identical args to Array::push
 *    ArrayDelegate.prototype.pushDelegate = function(element) {
 *       // Do something with data
 *       addElementToHtmlTable(element);
 *    }
 *    
 *    // Create an instance of ArrayDelegate tied to Array 'data'
 *    var myData = new ArrayDelegate(data);
 *    
 *    // Push into 'data'. String "foo" automatically appears in HTML table.
 *    myData.push("foo");
 * 
 * Notice that the pushDelegate method above did not have to invoke the 'push'
 * method of Array 'data'. This is automatically performed by the Delegate
 * class, _before_ invoking pushDelegate.
 * 
 * You can disable delegation by calling Delegate::disableDelegation.
 * Subsequent calls to object methods will invoke the object method directly,
 * without invoking the delegate. To re-enable, call 'enableDelegation'.
 * 
 * * */
 
function Delegate(object) {
	this.object = object;
	this.enabled = true;
}

Delegate.prototype.enableDelegation = function() {
	this.enabled = true;
};

Delegate.prototype.disableDelegation = function() {
	this.enabled = false;
};

// Map object method to internal method
Delegate.prototype.mapMethod = function(objectMethodName, internalMethodName) {
	// Assert that mapped method does not override existing method
	if (this[objectMethodName] !== undefined) {
		throw "Delegate::mapMethod > Method name '"+objectMethodName+"' would override existing method.";
	}
	
	// Generate member method with same name as delegated object's method
	this[objectMethodName] = function() {
		// Invoke delegated object's method
		this.object[objectMethodName].apply(this.object, arguments);
		
		// If delegation enabled, invoke internal method delegate
		if (this.enabled) {
			this[internalMethodName].apply(this, arguments);
		}
	};
};
