//TODO:di inject
(function() {

	function Elm(elm, opt) {
		var el = document.createElement(elm),
		s = {
			'cls':'className',
			'iH':'innerHTML',
			'iT':'innerText',
			'ph':'placeholder',
			'hr':'href'
		},
		rkey;
		for(var key in opt) {
			rkey = s[key] || key;
			el[rkey] = opt[key];
		}
		return el;
	}

	function Btn(opt) {
		var id = opt.id || '';
			cls = opt.cls || '';
			label = opt.label || '';
		var el = Elm('a', id, cls);
		el.href = 'jav;void 0';
		el.innerHTML = label;
		return el;
	}

	function Input(opt) {
		var id = opt.id || '';
			cls = opt.cls || '';
			label = opt.label || '';
		var el = Elm('input',id,cls);
		el.placeholder = label;
		return el;
	}

	function alarm(elm) {
		elm.classList.add('glowing-border');
		setTimeout(function() {
			elm.classList.remove('glowing-border');
		},1000);
	}

	function ok_alarm(elm) {
		console.log("ok_alarm");
		elm.classList.add('glowing-border-green');
		setTimeout(function() {
			elm.classList.remove('glowing-border-green');
		},1000);
	}

	function ById(id) {
		return document.getElementById(id)
	}

	function restore_options(callback) {
		chrome.storage.sync.get({ options: '[]'}, function(o) {
			var opt = JSON.parse(o.options);
			if(!opt) opt = [];
			callback(opt);
		});
	}

	function save_options(opt, callback) {
		chrome.storage.sync.set({ options: opt}, function() {
			callback();
		});
	}

	function onsave(opt) {
		console.log("saved");//TODO: make user respose
		chrome.runtime.sendMessage({cmd: "refresh_options", opt: str}, function(response) {
		});
	}

	function ajax(url, callback) {
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
				var resp = JSON.parse(xmlhttp.responseText);
				if(resp) {
					callback(resp);
				}
			}
		}
		xmlhttp.open('GET', url, true);
		xmlhttp.send();
	}

	function Item(value,remove_callback, is_dub) {
		var dom = {
			item		: Elm('div',	{cls:'item'}),
			left_block	: Elm('div',	{cls:'item_left_block'}),
			id_input	: Elm('input',	{cls:'item_id_input', ph:'User id'}),
			user_fio	: Elm('div',	{cls:'item_user_fio'}),
			right_block : Elm('div',	{cls:'item_right_block'}),
			user_remove : Elm('div',	{cls:'item_user_remove'}),
			remove_btn	: Elm('a',		{cls:'btn',iT:'remove'}),
			user_pic	: Elm('img',	{cls:'item_user_pic', hr:'void 0'})
		};

		var model = {
			id: value,
			first_name:'',
			last_name: '',
			uid:'',
			screen_name:'',
			photo:'',
			ok:false
		};

		var url = function() {
			var url = 'http://api.vk.com/method/users.get?uids=';
			url+=model.id;
			url+='&fields=uid,first_name,last_name,screen_name,photo';
			return url;
		}

		function init_view() {
			dom.left_block.appendChild(dom.id_input);
			dom.left_block.appendChild(dom.user_fio);

			dom.user_remove.appendChild(dom.remove_btn);
			dom.right_block.appendChild(dom.user_remove);
			dom.right_block.appendChild(dom.user_pic);

			dom.item.appendChild(dom.left_block);
			dom.item.appendChild(dom.right_block);
			dom.item.style.display='none';
		}

		function init_events() {
			dom.remove_btn.onclick = remove;
			dom.id_input.onchange = change;
		}

		function splash() {
			alarm(dom.id_input);
		}

		function error() {
			model.ok = false;
			splash();
			reset_model();
			render_model();
		}

		function remove() {
			dom.item.remove();
			remove_callback(this);
		}

		function change() {
			model.id = dom.id_input.value;
			refresh();
		}

		function show() {
			dom.item.style.display='block';
			dom.id_input.focus();
		}

		function validate(raw_data) {
			var d = raw_data,
				is_error = d.error ||
				d.response.length == 0 ||
				d.response[0].deactivated;
			if(is_error) {
				error();
				return;
			}
			else {
				d = d.response[0];
				model.first_name = d.first_name;
				model.last_name = d.last_name;
				model.uid = d.uid;
				model.screen_name = d.screen_name;
				model.photo = d.photo;
				model.ok = true;
			}
			render_model();
		}

		function reset_model() {
			model.first_name='';
			model.last_name='';
			model.uid='';
			model.screen_name='';
			model.photo='';
		}

		function render_model() {
			dom.id_input.value	= model.id;
			dom.user_pic.src	= model.photo;
			dom.user_fio.innerText = model.first_name + ' ' + model.last_name;
		}

		function refresh(callback) {
			if(is_dub(model.id)) {
				error();
				return;
			}
			ajax(url(), validate);
			if(callback) {
				callback(this);
			}
		}

		function get_id() {
			return model.id;
		}

		function get_ok() {
			return model.ok;
		}

		function for_save() {
			var t = {};
			t.id = model.id;
			t.screen_name = model.screen_name;
			return t;
		}

		init_view();
		init_events();

		return {
			render_model: render_model,
			refresh:refresh,
			show: show,
			el: dom.item,
			id: get_id,
			ok: get_ok,
			splash:splash,
			for_save:for_save
		};
	}


	function ItemCollection(lkick) {
		var items = [],
			el = ById('items');

		function refresh_callback(elm) {
			el.appendChild(elm.el);
			lkick();
		}

		function remove_callback(elm) {
			var r = items.indexOf(elm);
			items.splice(r,1);
		}

		function is_dublicate(id) {
			var cnt = 0;
			if(!id) return false;
			for(var i=0;i<items.length;i++) {
				if(items[i].id() == id) {
					if(cnt) return true;
					cnt++;
				}
			}
			return false;
		}

		function show_all() {
			for(var i=0;i<items.length;i++) {
				items[i].show();
			}
		}

		function add(value) {
			var i = Item(value, remove_callback, is_dublicate);
			items.push(i);
			if(value) {
				i.refresh(refresh_callback);
			}
			else {
				el.appendChild(i.el);
				refresh_callback(i);
				i.show();
			}
		}

		function for_save() {
			var result=[];
			var e;
			var ok = true;
			for(var i=0;i<items.length;i++) {
				e = items[i];
				if(!e.ok()) {
					e.splash();
					ok = false;
				}
				result.push(e.for_save());
			}
			if(!ok) return '';
			return JSON.stringify(result);
		}

		return {
			add : add,
			show_all: show_all,
			for_save:for_save
		};

	}

	function ProgressBar(cnt, callback) {
		var cnt = cnt,
		el  = ById('progress');

		if(!cnt) {
			el.style.display = 'none';
		}

		function kick() {
			if(!cnt) return;
			cnt--;
			if(!cnt) {
				el.style.display = 'none';
				callback();
			}
		}

		return {
			kick:kick,
		};
	}


	function AppController() {
		var save = ById('savebtn')
			add  = ById('addbtn'),
			ic	 = ItemCollection(kick);

		var pb;
		function kick() {
			console.log("kick");
			pb.kick();
		}
		function show() {
			console.log("show");
			ic.show_all();
		}

		function save_success() {
			ok_alarm(save);
		}

		save.onclick = function() {
			var str = ic.for_save();
			console.log(str);
			if(str) {
				save_options(str, save_success);
				saved=true;
			}
			else {
				alarm(save);
			}
		}

		add.onclick = function() {
			ic.add();
		}

		restore_options(function(opt) {
			pb = ProgressBar(opt.length, show);
			for(var i=0;i<opt.length;i++) {
				ic.add(opt[i].id);
			}
		});
	}

	var App = AppController();
})();





