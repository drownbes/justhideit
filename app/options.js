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

	function flash_class(elm,cls) {
		elm.classList.add(cls);
		setTimeout(function() {
			elm.classList.remove(cls);
		},1000);
	}

	function flash_red(elm) {
		flash_class(elm,'glow-red');
	}

	function flash_green(elm) {
		flash_class(elm,'glow-green');
	}

	function ById(id) {
		return document.getElementById(id)
	}

	function display_none(elm) {
		elm.style.display = 'none';
	}

	function display_block(elm) {
		elm.style.display = 'block';
	}

	function ajax(url, success, fail) {
		console.log("ajax", url, success, fail);
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
				var resp = JSON.parse(xmlhttp.responseText);
				if(resp) {
					success(resp);
				}
				else {
					fail(xmlhttp.statusText);
				}
			}
		}
		xmlhttp.open('GET', url, true);
		xmlhttp.send();
	}



	function onsave(opt) {
		console.log("saved");//TODO: make user respose
		chrome.runtime.sendMessage({cmd: "refresh_options", opt: str}, function(response) {
		});
	}



	function Item(value, owner, warn) {
		var self = {};
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
		};




		function init_view() {
			dom.left_block.appendChild(dom.id_input);
			dom.left_block.appendChild(dom.user_fio);

			dom.user_remove.appendChild(dom.remove_btn);
			dom.right_block.appendChild(dom.user_remove);
			dom.right_block.appendChild(dom.user_pic);

			dom.item.appendChild(dom.left_block);
			dom.item.appendChild(dom.right_block);
			display_none(dom.item);
		}

		function init_events() {
			dom.remove_btn.onclick = self.remove;
			dom.id_input.onchange = self.change;
		}

		self.remove = function () {
			console.log(self);
			dom.item.remove();
			owner.onremove(self);
		}

		self.change = function() {
			model.id = dom.id_input.value;
			self.refresh_model();
		}

		self.refresh_model = function() {
			self.reset_model_errors();
			if(owner.have_dublicate(self)) {
				model.have_dublicate=true;
				self.render_model();
			}
			else {
				var url = 'http://api.vk.com/method/users.get?uids=';
				url+=model.id;
				url+='&fields=uid,first_name,last_name,screen_name,photo';
				ajax(url, self.validate_ajax, self.ajax_fail);
			}
		}

		self.validate_ajax = function(resp) {
			var r = resp;
			model.api_error = r.error || r.response.length == 0;
			if(!model.api_error) {
				model.user_deactivated = r.response[0].deactivated;
			}
			if(model.api_error || model.user_deactivated) {
				self.render_model();
			}
			else {
				self.parse(r.response[0]);
			}
		}

		self.ajax_fail = function(text) {
			model.ajax_error = text;
			self.render_model();
		}

		self.parse = function(resp) {
			model.first_name = resp.first_name;
			model.last_name = resp.last_name;
			model.uid = resp.uid;
			model.screen_name = resp.screen_name;
			model.photo = resp.photo;
			self.render_model();
		}

		self.model_ok = function() {
			return	model.ajax_error == '' &&
					!model.api_error &&
					!model.user_deactivated &&
					!model.have_dublicate;
		}

		self.reset_model_errors = function() {
			model.ajax_error = '';
			model.api_error = false;
			model.user_deactivated = undefined;
			model.have_dublicate = false;
		}

		self.flash_green = function() {
			flash_green(dom.id_input);
		}

		self.flash_red = function() {
			flash_red(dom.id_input);
		}

		self.generate_warn_msg = function() {
			var msg = '';
			if(self.model_ok()) {
				msg = 'ok!';
			}
			else {
				if(model.have_dublicate) {
					msg+='Dublicate! ';
				}
				if(model.user_deactivated) {
					msg+='User deleted! ';
				}
				if(model.ajax_error || model.api_error) {
					msg+='Internal error! ';
				}
			}
			return msg;
		}

		self.render_model = function() {
			console.log('render_model');
			if(self.model_ok()) {
				dom.id_input.value		= model.id;
				dom.user_pic.src		= model.photo;
				dom.user_fio.innerText	= model.first_name + ' ' + model.last_name;
				self.flash_green();
				warn.ok_text(self.generate_warn_msg());
			}
			else {
				dom.user_pic.src		= '';
				dom.user_fio.innerText	= '';
				self.flash_red();
				warn.error_text(self.generate_warn_msg());
			}
			console.log(model,self,self.value);
			if(self.value) {
				self.show(); //if loading from storage show only after reload
				self.value = undefined;
			}
		}

		self.show = function() {
			display_block(dom.item);
			owner.show(self);
			dom.id_input.focus();
		}

		self.get_id = function() {
			return model.id;
		}

		self.get_el = function() {
			return dom.item;
		}

		self.get_persist = function() {
			var d = {}
			d['id'] = model.id;
			d['screen_name'] = model.screen_name;
			return d;
		}

		init_view();
		init_events();
		self.reset_model_errors();

		if(value) {
			console.log(value);
			self.value = value;
			self.refresh_model();
		}
		else {
			console.log('Empty item');
			self.show();
		}

		return self;
	}

	function Warn() {
		var self = {};
		var el = ById('warning');

		self.ok = function(item) {
			console.log("ok ",item);
			el.innerText = "ok";
			el.classList.remove('hard-red-glow');
			el.classList.add('hard-green-glow');
		}

		self.error = function(item) {
			console.log("error ",item);
			el.innerText = "error";
			el.classList.remove('hard-green-glow');
			el.classList.add('hard-red-glow');
		}

		self.ok_text = function(text) {
			el.innerText = text;
			el.classList.remove('hard-red-glow');
			el.classList.add('hard-green-glow');
		}

		self.text = function(text) {
			el.classList.remove('hard-red-glow');
			el.classList.remove('hard-green-glow');
			el.innerText = text;
		}

		self.error_text = function(text) {
			el.innerText = text;
			el.classList.remove('hard-green-glow');
			el.classList.add('hard-red-glow');
		}

		return self;
	}

	function StorageManager(warn) {
		var self = {};

		self.get = function(key, onready) {
			chrome.storage.sync.get(key, function(o) {
				var opt = JSON.parse(o[key]);
				if(!opt) {
					warn.error(self);
				}
				else {
					warn.ok(self);
				}
				onready(opt);
			});
		}

		self.set = function(key, value, onready) {
			var opt = JSON.stringify(value);
			if(!opt) {
				warn.error(self);
			}
			var d = {};
			d[key] = opt;
			chrome.storage.sync.set(d, function() {
				warn.ok(self);
				onready();
			});
		}

		return self;
	}

	function ItemCollection(app, storage, warn) {
		var self = {};
		var items = [],
			el = ById('items')
			persist_hash = 'options';

		self.onremove = function(item) {
			var r = items.indexOf(item);
			items.splice(r,1);
		}

		self.have_dublicate = function (item) {
			for(var i=0;i<items.length;i++) {
				if(items[i] != item) {
					if(items[i].get_id() == item.get_id() ) return true;
				}
			}
			return false;
		}

		self.show = function(item) {
			console.log("show",self);
			el.appendChild(item.get_el());
			if(self.n) {
				self.n--;
				if(self.n == 0) {
					display_block(el);
					app.enable_btns();
					warn.ok_text('Loaded!');
				}
			}
		}

		self.add = function (value) {
			var item = Item(value, self, warn);
			items.push(item);
		}

		self.fetch = function() {
			warn.text('Loading...');
			storage.get(persist_hash,self.fetch_ready);
		}

		self.fetch_ready = function(opt) {
			self.n = opt.length;;
			console.log('fetch_ready', opt, self.n,self);
			if(!self.n) {
				warn.ok_text("No data");
				app.enable_btns();
			}
			else {
				for(var i=0;i<self.n;i++) {
					console.log("here");
					self.add(opt[i].id);
				}
				display_none(el);
			}
		}

		self.save = function() {
			var m,no_err=true,forsave=[];

			for(var i=0;i<items.length;i++) {
				m=items[i];
				if(!m.get_id() || !m.model_ok()) {
					no_err = false;
					m.flash_red();
				}
				else {
					m.flash_green();
					forsave.push(m.get_persist());
				}
			}
			if(no_err) {
				app.disable_btns();
				storage.set(persist_hash,forsave,self.save_ready);
			}
			else {
				warn.error_text('Save failed');
			}
		}

		self.save_ready = function() {
			console.log('save ready');
			app.enable_btns();
			warn.ok_text('Saved');
		}

		return self;
	}


	function App() {
		var self = {};
		self.save = ById('savebtn');
		self.add  = ById('addbtn');

		self.enable_btns = function() {
			self.save.onclick = self.onsave;
			self.add.onclick = self.onadd;
		}

		self.disable_btns = function() {
			self.save.onclick = '';
			self.add.onclick = '';
		}

		self.onsave =  function() {
			self.ic.save();
		}

		self.onadd = function() {
			self.ic.add('');
		}

		self.run = function() {
			self.warn = Warn();
			self.storage = StorageManager(self.warn);
			self.ic = ItemCollection(self,self.storage,self.warn);
			self.ic.fetch();
		}
		return self;
	}

	var app = App();
	app.run();
})();





