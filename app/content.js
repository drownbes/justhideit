(function() {
function ContentScript() {
	var self = {};
	var old_href='';
	self.options=[];

	self.parse_vk_tab = function(href) {
		if( /^https:\/\/vk.com\/im\?(.*)sel\=(.*)/.test(href) ) {
			self.msg({cmd:'on_im'});
		}
	}

	self.ontimeout = function() {
		var new_href = location.href;
		if(new_href != old_href) {
			self.parse_vk_tab(new_href);
		}
		setTimeout(self.ontimeout,1000);
		old_href = new_href;
	}

	self.msg = function(req) {
		console.log('send:',req);
		chrome.runtime.sendMessage(req);
	}

	self.onmsg = function(request, sender, sendResponse) {
		console.log(request);
		if(request.cmd == 'toggle') {
			var bls = [];
			var blk = [];
			for(var i=0;i<self.options.length;i++) {
				bls.push(self.options[i].id);
				blk.push('/'+self.options[i].screen_name);
			}
			window.postMessage({cmd:"enable", blacklist:bls,blacklinks:blk}, location.href);
		}
		else if(request == 'update_options') {
			self.options = request.data;
		}
		self.options = ['666'];
		console.log(self);
	}

	self.cleanup = function() {
		chrome.runtime.onMessage.removeListener(self.onmsg);
		var req = {cmd:'remove_tab'};
		self.msg(req);
	}

	self.run = function() {
		window.onbeforeunload = self.cleanup;
		chrome.runtime.onMessage.addListener(self.onmsg);
		self.msg({cmd:'add_tab'});
		self.ontimeout();
	}

	return self;
}


var s = chrome.extension.getURL('payload.js'),
	sc = document.createElement('script');
sc.src = s;
document.head.appendChild(sc);
document.body.setAttribute("onLoad",'');
var cs = ContentScript();
cs.run();

})();
