/*
 * GuiTextField.js
 * extends GuiControl
 * 
 * A text field control.
 * 
 * USAGE
 * 
 * The constructor expects argument 'elt' to be an input element of type 
 * 'text'. This element will be transformed into a GuiTextField. This 
 * control's action method is invoked after the user has finished entering 
 * text into the field. Two arguments will be passed to the action method: a 
 * reference to the GuiTextField object, and the string inputted by the user.
 * You may optionally pass true for 'autoHide' if you want the field to
 * automatically disappear once the user has finished entering text (either
 * by changing focus or hitting the enter/return key). If the user hits the
 * escape key during text entry, the field will deactivate without invoking
 * the control's action.
 * 
 * Auto-hiding text fields are hidden and inactive by default. Call 
 * GuiTextField::activate to activate the field, optionally providing a 
 * default text string argument.
 * 
 * * */
 
function GuiTextField(id, elt, delegate, action, autoHide) {
	GuiTextField.baseConstructor.call(this, id, elt, delegate);
	this.action = action;
	this.autoHide = autoHide;
	
	this.active = true;
	
	// Auto-hiding text fields are not active by default
	if (this.autoHide) {
		this.deactivate();
	}
}
Util.extend(GuiTextField, GuiControl);

// Activate and reveal the field with the given default text string
GuiTextField.prototype.activate = function(defaultText) {
	if (!this.active) {
		this.active = true;
		
		if (defaultText !== undefined) {
			this.htmlNode.value = defaultText;
		}
	
		this.hideInput(false);
		this.htmlNode.focus();
		this.htmlNode.select();
		this.registerListener("keydown", this.htmlNode, true);
		this.registerListener("blur", this.htmlNode, false);
	}
};

GuiTextField.prototype.deactivate = function() {
	if (this.active) {
		this.active = false;
		this.hideInput(true);
		this.unregisterListener("keydown", this.htmlNode, true);
		this.unregisterListener("blur", this.htmlNode, false);
	}
};

GuiTextField.prototype.hideInput = function(hideFlag) {
	this.htmlNode.style.display = hideFlag ? "none" : "";
};

GuiTextField.prototype.keydown = function(evt) {
	switch (evt.keyCode) {
		case KeyCode.enter:
			this.htmlNode.blur();
			break;
		
		case KeyCode.esc:
			this.deactivate();
			break;
	}
	
	// Absorb the key event
	evt.stopPropagation();
};

GuiTextField.prototype.blur = function(evt) {
	this.invokeAction(this.action, this, this.htmlNode.value, evt);
	
	// Focus changed, deactivate the field if it auto-hides
	if (this.autoHide) {
		this.deactivate();
	}
};
