/*
 * Animation.js
 * 
 * Core animation class.
 * 
 * REQUIRES
 * 
 * Util.js
 * 
 * VERSION
 * 
 * 1.1 (April 2011)
 * - slight flexibility tweaks to Animation::stop.
 * - decimal value animated properties are now supported
 * - added the option to pass in a per-frame callback (see USAGE)
 * - Tween class has new name: AnimatedProperty
 * 
 * 1.0 (February 2007)
 * - Created.
 *
 * USAGE
 *
 * First, create the Animation object, passing in the desired length (in
 * seconds). Optional is a callback to be invoked at animation's end and a
 * callback to be invoked each frame. The per-frame callback is called at the 
 * end of each frame, after all properties registered with this Animation 
 * instance have been animated (i.e. had their values updated). If either 
 * callback is a member functions of some object, it should first be bound to 
 * that object (via javascript's apply() function, or the Util.js bindTo() 
 * extension).
 * 
 * Example:
 *
 *   // create a 2 second animation
 *   animation = new Animation(2, callMeAfterAnimation, callMeEachFrame);
 *
 * Next, pass in a target object and corresponding property to animate:
 *
 *   // animate a progress bar <div>'s width
 *   animation.add(document.getElementById("progressBar").style,
 *      "width",
 *      <init value>, 
 *      <endValue>,
 *      <acceleration>);
 * 
 * You can animate as many objects and properties as you wish by calling
 * Animation::add repeatedly. The property can also be the name of a method 
 * belonging to the target object, and which takes a single argument.
 * 
 * Example:
 *
 *   // animate the window scroll bar
 *   animation.add(window, 
 *      "scroll",           // window.scroll() takes a single scroll-value arg
 *      <init value>, 
 *      <endValue>, 
 *      <acceleration>);
 * 
 * <initValue> specifies where the tween should begin, and <endValue> 
 * specifies where it should end. Both of these values can have units, e.g. 
 * "100px" or "2em". <acceleration> should be a value in the range [-1.0:1.0], 
 * where -1.0 indicates as much deceleration as possible (start fast, stop 
 * gradually), and 1.0 indicates as much acceleration as possible (start slow, 
 * stop abruptly). Default is 0 (linear interpolation).
 *
 * To start the animation:
 *
 *   animation.begin();
 * 
 * And to stop the animation at any time:
 * 
 *   animation.stop(<invokeCallbackFlag>);
 * 
 * If invokeCallbackFlag is set to true, the animation-end callback will be 
 * invoked after stopping the animation.
 *
 * * */

Animation.fpsMax = 70;

function Animation(length, endCallback, perFrameCallback) {
	this.length = length;
	this.endCallback = typeof endCallback == "function" ? endCallback : null;
	this.perFrameCallback = typeof perFrameCallback == "function" ? perFrameCallback : null;;
	this.intervalId = null;
	this.tweenList = [];
	this.stepDelta = 1.0 / Animation.fpsMax;
}

Animation.prototype.add = function(targetObject, targetProperty, initValue, endValue, acceleration) {
	this.tweenList.push(new AnimatedProperty(
		targetObject,
		targetProperty,
		this.length,
		initValue,
		endValue,
		acceleration));
};

// Starts the animation if it isn't currently running
Animation.prototype.begin = function() {
	if (this.intervalId === null) {
		this.prepare();
		this.startTime = Date.now();
		this.intervalId = window.setInterval(this.run.bindTo(this), this.stepDelta * 1000);
	}
};

// Stops a running animation. Has no effect if animation is not currently
// running. The end callback is only invoked if invokeCallback is set to true.
Animation.prototype.stop = function(invokeCallback) {
	if (this.intervalId !== null) {
		window.clearInterval(this.intervalId);
		this.intervalId = null;
	
		if (invokeCallback && this.endCallback) {
			this.endCallback();
		}
	}
};

// Sets all animated elements to their initial values, automatically called by run()
Animation.prototype.prepare = function() {
	var count = this.tweenList.length;
	
	for (var i = 0; i < count; i++) {
		this.tweenList[i].stepTo(0);
	}
};

// Automatically invoked by javascript "setInterval" timer mechanism
Animation.prototype.run = function() {
	var elapsed = (Date.now() - this.startTime) / 1000;
	
	if (elapsed > this.length) {
		elapsed = this.length;
	}
	
	// Step each animated property
	var count = this.tweenList.length;
	for (var i = 0; i < count; i++) {
		this.tweenList[i].stepTo(elapsed);
	}
	
	// Call per-frame callback only after all properies have been stepped
	if (this.perFrameCallback) {
		this.perFrameCallback();
	}
	
	// Stop the interval timer after the animation has elapsed and after all
	// all properties have been stepped
	if (elapsed >= this.length) {
		this.stop(true);
	}
};

function AnimatedProperty(targetObject, targetProperty, length, initValue, endValue, acceleration) {
	if (typeof acceleration == "number" && (acceleration > 1.0 || acceleration < -1.0))
		throw "AnimatedProperty: acceleration must be within the range [-1.0:1.0]";
	
	this.targetObject = targetObject;
	this.targetProperty = targetProperty;
	this.setTargetProperty = typeof this.targetObject[targetProperty] == "function" ? this.setFunctionProperty : this.setScalarProperty;
	
	var v = Util.parseValue(initValue);
	this.units = v.units;
	this.initValue = v.quantity;
	this.endValue = Util.parseValue(endValue).quantity;
	
	var lengthSquared = Math.pow(length, 2);
	var maxAcceleration = (this.endValue - this.initValue) / lengthSquared;
	this.acceleration = maxAcceleration * (typeof acceleration == "number" ? acceleration : 0);
	this.initVelocity = (this.endValue - this.initValue - this.acceleration * lengthSquared) / length;
}

// Returns the new value after stepping to given time
AnimatedProperty.prototype.stepTo = function(elapsed) {
	// Floating point operations lack precision beyond the 16th or so decimal
	// places so calculations are rounded to the 13th decimal place.
	this.setTargetProperty(
			Util.roundToDecimal(this.acceleration * Math.pow(elapsed, 2) + this.initVelocity * elapsed + this.initValue, 10)
			+ (this.units === "" ? 0 : this.units));      // be careful not to turn value into string needlessly!
};

AnimatedProperty.prototype.setScalarProperty = function(value) {
	this.targetObject[this.targetProperty] = value;
};

AnimatedProperty.prototype.setFunctionProperty = function(value) {
	this.targetObject[this.targetProperty](value);
};
