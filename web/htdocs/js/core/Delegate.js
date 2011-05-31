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
 *    // Your own inheritance scheme
 *    inherit(StackDelegate, Delegate);
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
 * class, _after_ invoking pushDelegate.
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
 * IMPORTANT
 * 
 * Note that if a property is subsequently added to the delegated object, it 
 * will _not_ be added to its corresponding Delegate object:
 * 
 *    data.foo = "bar";
 *    myData.foo;                     // undefined
 * 
 * With this in mind, it is crucially important that _all_ of an object's
 * properties be defined before instantiating a delegate for that object.
 * 
 * LIMITATIONS
 * 
 * One limitation of Delegate is that you cannot create a delegate for an 
 * instance of an Array object. Attempting to do so will generate an 
 * exception.
 * 
 * Also, the delegated object may share a property name with the Delegate. An 
 * exception will be thrown if this is the case (though it is unlikely).
 * 
 * Finally, it was mentioned above that delegate methods are invoked _before_
 * corresponding object methods. The reason for this is to support recursive
 * object methods. The following example illustrates:
 * 
 *    function Cat() {
 *       this.lives = 9;
 *    }
 *    
 *    Cat.prototype.die = function(lives) {
 *       console.log("Cat has died.");
 *       if (--this.lives > 0) {
 *          this.die();
 *       }
 *    };
 *    
 *    function CatDelegate(cat) {
 *       callBaseClassConstructor(cat);
 *       this.mapMethod("die", "dieDelegate");
 *    }
 *    
 *    // Your own inheritance scheme
 *    inherit(CatDelegate, Delegate);
 *    
 *    CatDelegate.prototype.dieDelegate = function() {
 *       console.log(this.lives+" lives remaining.");
 *    };
 *    
 *    var cat         = new Cat();
 *    var catDelegate = new CatDelegate(cat);
 *    
 *    catDelegate.die();
 *    
 *    // OUTPUT:
 *    //
 *    // 9 lives remaining.
 *    // Cat has died.
 *    // 8 lives remaining.
 *    // Cat has died.
 *    // 7 lives remaining.
 *    // Cat has died.
 *    // ...
 *    // 2 lives remaining.
 *    // Cat has died.
 *    // 1 lives remaining.
 *    // Cat has died.
 * 
 * Whereas, if the delegate method is called _after_ the object method:
 *    
 *    // OUTPUT
 *    //
 *    // 9x "Cat has died."
 *    // 9x "0 lives remaining."
 * 
 * The first approach is "more correct", so that is the approach used. 
 * Furthermore, by executing the delegate method first, we ensure that it is
 * not exposed to inconsistent state (as the delegate method might have been
 * invoked in the middle of an object method).
 * 
 * * */
 
function Delegate(object, methodMap) {
	this.delegatedObject = object;
	this.delegationEnabled = true;
	
	Util.assert(!Array.isArray(object), "Creating Delegates for Array objects is not supported.");
	
	var props = [];        // Collects non-function properties
	var funcs = [];        // Collects function properties
	
	for (var prop in this.delegatedObject) {
		Util.assert(
			this[prop] === undefined,
			"Delegated object has property '"+prop+"' with same name as internal property."
		);
		
		if (typeof this.delegatedObject[prop] == "function") {
			funcs.push(prop);
		} else {
			props.push(prop);
		}
	}
	
	// Generate getters and setters for each non-function property
	props.forEach(function(propName) {
		var getter = function()      { return this.delegatedObject[propName]; };
		var setter = function(value) { this.delegatedObject[propName] = value; };
		
		if (Object.defineProperty) {                                              // ECMAScript 5
			Object.defineProperty(this, propName, {get:getter, set:setter});
		} else {                                                                  // Legacy
			this.__defineGetter__(propName, getter);
			this.__defineSetter__(propName, setter);
		}
	}, this);
	
	// Generate internal methods that simply apply methods of delegated 
	// object. Note that the delegated method is applied with the 'this' 
	// argument pointing at Delegate's self rather than the delegated object!
	// This same approach is used with 'apply' calls below.
	funcs.forEach(function(funcName) {
		this[funcName] = function() {
			return this.delegatedObject[funcName].apply(this, arguments);
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
	// Assert that delegated object contains the given method
	Util.assert(
		this.delegatedObject[objectMethodName] !== undefined,
		"Delegated object does not contain method name passed to Delegate::mapMethod."
	);
	
	// Override internal method
	this[objectMethodName] = function() {
		// If delegation is enabled, invoke internal delegate method
		if (this.delegationEnabled) {
			this[internalMethodName].apply(this, arguments);
		}
		
		// Invoke delegated object's method
		var returnVal = this.delegatedObject[objectMethodName].apply(this, arguments);
		
		return returnVal;
	};
};
