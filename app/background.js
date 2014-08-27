(function() {
function Main() {
	var self = {};
	var tabs = [],
		state = true,
		options = [];

	self.seticon = function() {
		var text = state?"ON":"OFF";
		chrome.browserAction.setBadgeText({text:text});
	}

	self.onmsg = function(request, sender, sendResponse) {
		console.log('onmsg', request, sender);
		if(request.cmd == "add_tab") {
			tabs.push(sender.tab.id);
		}
		else if(request.cmd == "remove_tab") {
			var r = tabs.indexOf(sender.tab.id);
			tabs.splice(r,1);
		}
		else if(request.cmd == "on_im") {
			self.msgtab(sender.tab.id,self.update_options_req());
			self.msgtab(sender.tab.id,self.toggle_req());
		}
		else if(request.cmd == "update_options") {//from options.js
			options = request.data;
			self.msgtabs(self.update_options_req());
		}
	}

	self.update_options_req = function() {
		return {
			cmd: 'update_options',
			data: options
		};
	}

	self.toggle_req = function() {
		return {
			cmd: 'toggle',
			data: state
		};
	}

	self.fetch = function() {
		console.log('fetch');
		self.storage.get(lib.common.persist_hash, self.fetch_ready);
	}

	self.fetch_ready = function(opt) {
		console.log('fetch ready',opt);
		options = opt;
		self.msgtabs(self.update_options_req());
		self.msgtabs(self.toggle_req());
	}

	self.onclick = function(tab) {
		state = !state;
		self.seticon();
		self.msgtabs(self.toggle_req());
	}

	self.msgtab = function(id,req) {
		chrome.tabs.sendMessage(id, req);
	}

	self.msgtabs = function(req) {
		for(var i=0;i<tabs.length;i++) {
			self.msgtab(tabs[i], req);
		}
	}

	self.oninstalled = function() {
		chrome.tabs.query({url:'https://vk.com/*'}, function(tabs) {
			var tab;
			for(var i=0;i<tabs.length;i++) {
				tab = tabs[i];
				chrome.tabs.executeScript(tab.id, {file:'content.js'});
			}
		});
	}

	self.run = function() {
		chrome.runtime.onInstalled.addListener(self.oninstalled);
		self.storage = lib.StorageManager();
		self.seticon();
		self.fetch();
		chrome.browserAction.onClicked.addListener(self.onclick)
		chrome.extension.onMessage.addListener(self.onmsg);
	}

	console.log('rebuild');
	return self;
}


var m = Main();
m.run();

})();
