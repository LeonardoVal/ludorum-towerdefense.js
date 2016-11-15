/*
 * The resource handling
 */
var ResourceLoader = exports.ResourceLoader = Class.extend({
	init: function(target) {
		this.keys = target || {};
		this.loaded = 0;
		this.loading = 0;
		this.errors = 0;
		this.finished = false;
		this.oncompleted = undefined;
		this.onprogress = undefined;
		this.onerror = undefined;
	},
	completed: function() {
		this.finished = true;

		if (this.oncompleted && typeof(this.oncompleted) === 'function') {
			this.oncompleted.apply(this, [{
				loaded : this.loaded,
			}]);
		}
	},
	progress: function(name) {
		this.loading--;
		this.loaded++;
		var total = this.loaded + this.loading + this.errors;

		if (this.onprogress && typeof(this.onprogress) === 'function') {
			this.onprogress.apply(this, [{
				recent : name,
				total : total,
				progress: this.loaded / total,
			}]);
		}

		if (this.loading === 0)
			this.completed();
	},
	error: function(name) {
		this.loading--;
		this.errors++;
		var total = this.loaded + this.loading + this.errors;

		if (this.onerror && typeof(this.onerror) === 'function') {
			this.onerror.apply(this, [{
				error : name,
				total : total,
				progress: this.loaded / total,
			}]);
		}
	},
	load: function(keys, completed, progress, error) {
		if (completed && typeof(completed) === 'function')
			this.oncompleted = completed;
		if (progress && typeof(progress) === 'function')
			this.onprogress = progress;
		if (error && typeof(error) === 'function')
			this.onerror = error;

		for (var i = keys.length; i--; ) {
			var key = keys[i];
			this.loadResource(key.name, key.value);
		}
	},
	loadResource: function(name, value) {
		this.loading++;
		this.keys[name] = value;
	},
});

/*
 * The images handling
 */
var ImageLoader = exports.ImageLoader = ResourceLoader.extend({
	init: function(target) {
		this._super(target);
	},
	loadResource: function(name, value) {
		var me = this;
		var img = new Image();
		img.addEventListener('error', function() {
			me.error(name);
		}, false);
		img.addEventListener('load', function() {
			me.progress(name);
		}, false);
		img.src = value;
		this._super(name, img);
	},
});

/*
 * The sounds handling
 */
var SoundLoader = exports.SoundLoader = ResourceLoader.extend({
	init: function(target) {
		this._super(target);
	},
	loadResource: function(name, value) {
		var me = this;
		var element = new Audio();
		element.addEventListener('loadedmetadata', function() {
			me.progress(name);
		}, false);
		element.addEventListener('error', function() {
			me.error(name);
		}, false);

		if (element.canPlayType('audio/ogg').replace(/^no$/, ''))
			element.src = value.ogg;
		else if (element.canPlayType('audio/mpeg').replace(/^no$/, ''))
			element.src = value.mp3;
		else
			me.progress(name);

		this._super(name, element);
	},
});

/*
 * The loading handling
 */
var Loader = exports.Loader = Class.extend({
	init: function(completed, progress, error) {
		this.completed = completed || function() {};
		this.progress = progress || function() {};
		this.error = error || function() {};
		this.sets = [];
	},
	set: function(name, Loader, target, keys) {
		this.sets.push({
			name: name,
			resources : keys,
			loader : new Loader(target),
		});
	},
	start: function() {
		this.next();
	},
	next: function() {
		var me = this;
		var set = me.sets.pop();

		var completed = function(e) {
			me.next();
		};
		var progress = function(e) {
			e.name = set.name;
			me.progress(e);
		};
		var error = function(e) {
			e.name = set.name;
			me.error(e);
		};

		if (set) {
			me.progress({
				name : set.name,
				recent : '',
				total : set.resources.length,
				progress: 0,
			});
			set.loader.load(set.resources, completed, progress, error);
			return;
		}

		me.completed();
	}
});