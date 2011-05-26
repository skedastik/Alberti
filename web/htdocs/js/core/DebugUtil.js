var Dbug = {
	
	log: function(obj) {
		console.log(obj);
	},
	
	logCoords: function(/* any number of Point object arguments */) {
		var str = "";
		
		for (i = 0; i < arguments.length; i++) {
			var p = arguments[i];
			str += p === null ? "(null) " : p+" ";
		}
		
		Dbug.log(str);
	}
	
};
