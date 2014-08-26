var lib = (function() {
	function StorageManager(warn) {
		var self = {};

		self.get = function(key, onready) {
			chrome.storage.sync.get(key, function(o) {
				var opt;
				try {
					opt = JSON.parse(o[key]);
				}
				catch(e) {
					opt = [];
				}
				onready(opt);
			});
		}

		self.set = function(key, value, onready) {
			var opt;
			try {
				opt = JSON.stringify(value);
			} catch(e) {
				opt = JSON.stringify([]);
			}
			var d = {};
			d[key] = opt;
			chrome.storage.sync.set(d, function() {
				onready();
			});
		}

		return self;
	}

	var common = {
		persist_hash: 'options'
	};

	return {
		StorageManager:StorageManager,
		common:common
	};
})();
