(function() {

function setIcon(state) {
	var text = state?"ON":"OFF";
	chrome.browserAction.setBadgeText({text:text});
}

chrome.extension.onMessage.addListener(
	function(request, sender, sendResponse) {
		console.log(request);
		var sublist = chrome.extension.sublist;
		if(request.cmd == "add_tab") {
			sublist.push(sender.tab.id);
		}
		else if(request.cmd == "remove_tab") {
			console.log(sender.tab.id);
			var r = sublist.indexOf(sender.tab.id);
			sublist.splice(r,1);
		}
		else if(request.cmd == "on_im") {
		}
		else if(request.cmd == "refresh_options") {
			console.log("resend save");
			for(var i=0;i<sublist.length;i++) {
				var id = sublist[i];
				chrome.tabs.sendMessage(id, request);
			}
		}
		else {
			console.log(request.cmd);
		}
});

chrome.browserAction.onClicked.addListener(function(tab) {
	var sublist = chrome.extension.sublist,
		state = !chrome.extension.state;
	chrome.extension.state = state;
	console.log(state);
	console.log(sublist);
	var i=0;

	setIcon(state);
	for(;i<sublist.length;i++) {
		var id = sublist[i];
		chrome.tabs.sendMessage(id, {cmd: "toggle",s: state});
	}
});



chrome.storage.sync.get({
	users_list: '[]'
}, function(items) {
	deflist = JSON.parse(items.users_list);

});

chrome.extension.sublist = [];
chrome.extension.state = true;
console.log("rebuild");
})();
