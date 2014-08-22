(function() {
	console.log("Injected");


	function sniff( method, hook) {
		return function() {
			var _method = method;
			method = function() {
				hook(arguments);
				return _method.apply(this,arguments);
			}
		}
	}

	sniff(IM.checked, function(args) {
		console.log("checked called:" + arguments);
	});

	sniff(IM.loadHistory, function(args) {
		console.log("loadHistory:" + arguments);
	});

	/*
	var _checked = IM.checked;
	IM.checked = function() {
		console.log("checked called:" + arguments);
		return _checked.apply(this, arguments);
	}

	var _loadHistory = IM.loadHistory;
	IM.loadHistory = function() {
		console.log("loadHistory:" + arguments);
		return _loadHistory.apply(this, arguments);
	}
	*/


})();
