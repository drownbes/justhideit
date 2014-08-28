(function() {
function ContentScript() {
	var self = {};
	self.old_href='';
	self.black_ids=[];
	self.black_sn=[];
	self.hidden_list=[];
	self.state=true;

	self.push_hidden = function(el) {
		//console.log('[Content script]','push hidden', el);
		self.hidden_list.push(el);
	}

	self.hide_el = function(el) {
		if(self.state) {
			el.style.display = 'none';
		}
	}

	self.process_msg_el = function(msg_el) {
		var from = msg_el.getAttribute('data-from');
		if(self.black_ids.indexOf(from) != -1) {
			self.push_hidden(msg_el);
			self.hide_el(msg_el);
		}
		else {
			var qs = msg_el.querySelectorAll('.im_fwd_log_row'),
				a, maybe_add_row=false;
			for(var k=0;k<qs.length;k++) {
				a = qs[k].querySelector('.im_log_author_chat_name > a');
				if(a) {
					if( self.black_sn.indexOf(a.getAttribute('href')) > -1) {
						self.push_hidden(qs[k]);
						self.hide_el(qs[k]);
						maybe_add_row = true;
					}
					else {
						maybe_add_row = false;
					}
				}
				else if( qs[k].className.indexOf('im_fwd_log_add_row') > -1 && maybe_add_row) {
					self.push_hidden(qs[k]);
					self.hide_el(qs[k]);
				}
			}
		}
	}

	self.unhide = function() {
		for(var i=0;i< self.hidden_list.length;i++) {
			self.hidden_list[i].style.display = '';
		}
	}

	self.hide = function() {
		for(var i=0;i< self.hidden_list.length;i++) {
			self.hidden_list[i].style.display = 'none';
		}
	}

	self.init_hide = function() {
		var trs = document.querySelectorAll('tr.im_in'),
			from, el;
		console.log('[Content script]','init_hide',trs);
		for(var i=0;i<trs.length;i++) {
			el = trs[i];
			self.process_msg_el(el);
		}
	}

	self.inject_payload = function() {
		var injected = document.getElementById('payloadjs');
		if(injected) {
			injected.remove();
		}
		var payload_src = chrome.extension.getURL('payload.js'),
		payload_script = document.createElement('script');
		payload_script.id = 'payloadjs';
		payload_script.src = payload_src;
		document.head.appendChild(payload_script);
		document.body.setAttribute("onLoad",'console.log(\'[payload]\', \'injected!\');');
	}

	self.send2bg = function(msg) {
		console.log('[Content script]', 'send2bg', msg);
		chrome.runtime.sendMessage(msg);
	}

	self.send2pl = function(msg) {
		console.log('[Content script]','send2pl', msg);
		window.postMessage(msg, location.href);
	}

	self.parse_vk_tab = function(href) {
		if( /^https:\/\/vk.com\/im\?(.*)sel\=(.*)/.test(href) ) {
			self.send2bg({cmd:'on_im'});
			self.inject_payload();
		}
		else {
			self.hidded_list=[];
		}
	}

	self.ontimeout = function() {
		var new_href = location.href;
		if(new_href != self.old_href) {
			self.parse_vk_tab(new_href);
		}
		setTimeout(self.ontimeout,1000);
		self.old_href = new_href;
	}

	self.recv_from_bg = function(request, sender, sendResponse) {
		console.log('[Content script]','recv_from_bg', request);
		if(request.cmd == 'toggle') {
			if(!request.data) {
				self.unhide();
			}
			else {
				self.hide();
			}
			self.state = request.data;
		}
		else if(request.cmd == 'update_options') {
			self.black_ids = [];
			self.black_sns = [];
			var k;
			for(var i=0;i<request.data.length;i++) {
				k = request.data[i];
				self.black_ids.push(k.id.toString());
				self.black_sn.push('/' + k.screen_name);
			}
			console.log('[Content script]','recv_from_bg', self.black_ids, self.black_sn);
			self.unhide();
			self.hidden_list=[];
			self.init_hide();
		}
	}

	self.recv_from_pl = function(e) {
		if(e.source == window) {
			if(e.data.cmd === 'new_msgs') {
				console.log('[Content script]','recv_from_pl', e.data.list);
				for(var i=0;i<e.data.list.length;i++) {
					var el = document.getElementById('mess'+e.data.list[i]);
					self.process_msg_el(el);
				}
			}
		}
	}

	self.cleanup = function() {
		chrome.runtime.onMessage.removeListener(self.recv_from_bg);
		window.removeEventListener('message', self.recv_from_pl, false);
		window.removeEventListener('beforeunload', self.cleanup, false);
		self.send2bg({cmd:'remove_tab'});
	}

	self.run = function() {
		window.addEventListener('beforeunload',self.cleanup,false);
		window.addEventListener('message',self.recv_from_pl,false);
		chrome.runtime.onMessage.addListener(self.recv_from_bg);
		self.send2bg({cmd:'add_tab'});
		self.ontimeout();
	}

	return self;
}
var cs = ContentScript();
cs.run();
})();
