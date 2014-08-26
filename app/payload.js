if(window.onmessage) return;

function ById(id) {
	return document.getElementById(id);
}


var hidden_els = [];


function clear_msg(msg_id, blacklist) {
	var dmsg_id = 'mess' + msg_id,
		el = ById(dmsg_id);
		msg_from = el.getAttribute('data-from');
		if(blacklist.ids.indexOf(msg_from) != -1) {
			hidden_els.push({el:el,id:msg_from});
			el.style.display = 'none';
		}
		else {
			q = el.querySelectorAll('.im_log_author_chat_name > a');
			for(var i=0;i<q.length;i++) {
				href = q[i].getAttribute('href');
				if(blacklinks.indexOf(href) != -1) {
					console.log('hide Quotation', href);
					q[i].parentNode.style.display = 'none';
				}
			}
		}


}



window.addEventListener('message', function(e) {
	if(e.source === window) {
		console.log(e.data);
		if(e.data.cmd != 'enable') {
			return;
		}
		var blacklist = e.data.blacklist,
			blacklinks= e.data.blacklinks;
		var add_msg = IM.addMsg;
		IM.addMsg = function() {
			console.log('addMsg',arguments);
			if(arguments.length == 9) {
				var uid = arguments[8].from;
				if(blacklist.indexOf(uid) != -1) {
					console.log('hide new msg');
					return;
				}
			}
			return add_msg.apply(this, arguments);
		}
		var ajax_post = ajax.post;
		ajax.post = function() {
			console.log();
			if(arguments.length >= 2 && arguments[1].act == 'a_history') {
				if(arguments.length == 3 && arguments[2].onDone) {
					var on_done = arguments[2].onDone;
					arguments[2].onDone = function() {
						var msgs = arguments[1];
						var res = on_done.apply(this, arguments);
						var el,msg_id,from,q,href;
						for(var msg in msgs) {
							msg_id = 'mess' + msg;
							el = document.getElementById(msg_id);
							from  = el.getAttribute('data-from');
							if(blacklist.indexOf(from) != -1) {
								console.log('hide:', msg_id);
								el.style.display = 'none';
							}
							else {
								q = el.querySelectorAll('.im_log_author_chat_name > a');
								for(var i=0;i<q.length;i++) {
									href = q[i].getAttribute('href');
									if(blacklinks.indexOf(href) != -1) {
										console.log('hide Quotation', href);
										q[i].parentNode.style.display = 'none';
									}
								}
							}

						}
						return res;
					}
				}
			}
			return ajax_post.apply(this, arguments);
		}
	}
});
