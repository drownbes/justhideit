(function(){

var detect_href_change = function(callback,timeout) {
	if(!callback) {
		return null;
	}
	var callback= callback,
		timeout = timeout || 1000,
		old_href= location.href,
		handle	= function() {
			if( location.href != old_href ) {
				old_href = location.href;
				callback();
			}
			setTimeout(handle,timeout);
		},
		start	= function() {
			setTimeout(handle,timeout);
		};
	return {
		start: start
	};
};

function parse_href() {
	var is_vk_im = /^https:\/\/vk.com\/im\?sel\=/.test(location.href);
	if(!is_vk_im) return;
	console.log("in vk im");
	chrome.runtime.sendMessage({cmd: "on_im"}, function(response) {
	});
}

function activate() {
	chrome.runtime.sendMessage({cmd: "add_tab"}, function(response) {
	});
}

window.onbeforeunload = function cleanup() {
	chrome.runtime.onMessage.removeListener(msg_listen);
	chrome.runtime.sendMessage({cmd: "remove_tab"}, function(response) {
	});

};


function msg_listen(request, sender, sendResponse) {
	if(request.cmd == "refresh_options") {
		console.log(request);
	}
	else if(request.cmd == "toggle") {
		console.log(request);
	}
}

chrome.runtime.onMessage.addListener(msg_listen);

activate();
parse_href();
var activator = detect_href_change(parse_href,500);
activator.start();

})();
