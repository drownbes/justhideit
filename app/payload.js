/* payload.js added with script tag to the page
 * content script <-> payload communicate through message api
 * listen to new messages, history loads then pass msg ids to
 * main content script
 */

(function(IM){
function send2cs(msg_list) {
	console.log('[payload]', 'send2cs', msg_list);
	window.postMessage({cmd:'new_msgs', list:msg_list}, location.href);
}

var add_msg = IM.addMsg;
IM.addMsg = function() {
	console.log('[payload]','addMsg', arguments);
	var uid = arguments[2];
	if(uid > 0) {
		send2cs([uid]);
	}
	return add_msg.apply(this, arguments);
}

var ajax_post = ajax.post;
ajax.post = function() {
	if(arguments.length >= 2 && arguments[1].act == 'a_history') {
		if(arguments.length == 3 && arguments[2].onDone) {
			var on_done = arguments[2].onDone;
			arguments[2].onDone = function() {
				console.log('[payload]','a_history');
				var msgs = Object.keys(arguments[1]);
				send2cs(msgs);
				return on_done.apply(this, arguments);
			}
		}
	}
	return ajax_post.apply(this, arguments);
}
})(IM);

