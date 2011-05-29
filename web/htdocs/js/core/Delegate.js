/*
 * Delegate.js
 * 
 * Delegate allows you to take an object instance and generate a delegate
 * object with additional functionality. As far as other objects are 
 * concerned, this new delegate is identical to the original object (excepting
 * use of the instanceof operator, of course). This is useful for connecting a 
 * data object with its corresponding view (e.g., every time a hypothetical
 * Stack object's "push" method is invoked, add the pushed element to a 
 * corresponding HTML table).
 * 
 * USAGE
 * 
 * For each data object that needs to be delegated, create a new subclass of
 * Delegate. In the subclass' constructor, call Delegate::mapMethod once for
 * each method that needs delegation, e.g.:
 * 
 *    // Need to delegate 'push' method of Stack object 'data'
 *    var data = new Stack();
 *    
 *    // So create an appropriate Delegate subclass
 *    function StackDelegate(stack) {
 *       // Call Delegate constructor using your own inheritance scheme
 *       callBaseClassConstructor(stack);
 *       // Map 'push' to StackDelegate's 'pushDelegate' method
 *       this.mapMethod("push", "pushDelegate");
 *    }
 *    
 *    // Define "pushDelegate" with identical args to Stack::push
 *    StackDelegate.prototype.pushDelegate = function(element) {
 *       // Do something with data
 *       addElementToHtmlTable(element);
 *    }
 *    
 *    // Create an instance of StackDelegate tied to Stack 'data'
 *    var myData = new StackDelegate(data);
 *    
 *    // Push into 'data'. String "foo" automatically appears in HTML table.
 *    myData.push("foo");
 * 
 * Notice that the pushDelegate method above did not have to invoke the 'push'
 * method of Stack 'data'. This is automatically performed by the Delegate
 * class, _before_ invoking pushDelegate.
 * 
 * You can disable delegation by calling Delegate::disableDelegation.
 * Subsequent calls to object methods will invoke the object method directly,
 * without invoking the delegate method. To re-enable, use 'enableDelegation'.
 * 
 * Delegate automatically generates getters and setters for the properties of
 * the delegated object, so you can access them directly. Taking the above
 * example, and assuming the Stack object has a property called 'length':
 * 
 *    myData.length == data.length;   // evaluates to true
 * 
 * Keep in mind that if a property is subsequently added to the delegated 
 * object, it will _not_ be added to the corresponding Delegate object:
 * 
 *    data.foo = "bar";
 *    myData.foo;                     // undefined
 * 
 * One limitation of Delegate is that you cannot create a delegate for an 
 * instance of an Array object. Attempting to do so will generate an 
 * exception.
 * 
 * Also, the delegated object may share a property name with the Delegate. An 
 * exception will be thrown if this is the case (though it is unlikely).
 * 
 * * */
 
function Delegate(object, methodMap) {
	this.delegatedObject = object;
	this.delegationEnabled = true;
	
	if (Array.isArray(object)) {
		throw "Delegate constructor > Creating delegates for Array objects is not supported.";
	}
	
	var props = [];        // Collects non-function properties
	var funcs = [];        // Collects function properties
	
	for (var prop in this.delegatedObject) {
		if (this[prop] !== undefined) {
			// Assert that there is no intersection of delegated object property names and internal property names.
			throw "Delegate constructor > Delegated object has property ('"+prop+"') with same name as internal property.";
		}
		
		if (typeof this.delegatedObject[prop] == "function") {
			funcs.push(prop);
		} else {
			props.push(prop);
		}
	}
	
	// Generate getters and setters for each non-function property
	props.forEach(function(propName) {
		if (Object.defineProperty) {
			// ECMAScript 5
			Object.defineProperty(this, propName, {
				get: function()      { return this.delegatedObject[propName]; },
				set: function(value) { this.delegatedObject[propName] = value; }
			});
		} else {
			// Legacy
			this.__defineGetter__(propName, function()      { return this.delegatedObject[propName]; });
			this.__defineSetter__(propName, function(value) { this.delegatedObject[propName] = value; });
		}
	}, this);
	
	// Generate internal methods that simply apply methods of delegated object
	funcs.forEach(function(funcName) {
		this[funcName] = function() {
			this.delegatedObject[funcName].apply(this.delegatedObject, arguments);
		};
	}, this);
}

Delegate.prototype.enableDelegation = function() {
	this.delegationEnabled = true;
};

Delegate.prototype.disableDelegation = function() {
	this.delegationEnabled = false;
};

// Map object method to internal method
Delegate.prototype.mapMethod = function(objectMethodName, internalMethodName) {
	// Override internal method
	this[objectMethodName] = function() {
		// Invoke delegated object's method
		this.delegatedObject[objectMethodName].apply(this.delegatedObject, arguments);
		
		// If delegation is enabled, invoke internal delegate method
		if (this.delegationEnabled) {
			this[internalMethodName].apply(this, arguments);
		}
	};
};
