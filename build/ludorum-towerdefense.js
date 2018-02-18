(function (init) { "use strict";
			if (typeof define === 'function' && define.amd) {
				define(["creatartis-base","sermat","inveniemus"], init); // AMD module.
			} else if (typeof exports === 'object' && module.exports) {
				module.exports = init(require("creatartis-base"),require("sermat"),require("inveniemus")); // CommonJS module.
			} else {
				this["ludorum-towerdefense"] = init(this.base,this.Sermat,this.inveniemus); // Browser.
			}
		}).call(this,/** Module wrapper and layout.
*/
function __init__(base, Sermat, inveniemus) { "use strict";
/** Import synonyms */
	var declare = base.declare;
	
/** Library layout. */
	var exports = {};
	
/** See `__epilogue__.js`.
*/

/*
 * Global constants
 */
var constants = exports.constants = {
	ticks: 25,
	money : 99,
	hitpoints : 10,
	mediPackCost : 20,
	mediPackFactor : 1,
	mediPackHealth : 1,
	towerBuildCost : 5,
	towerBuildFactor : 1,
	towerBuildNumber : 10,
};

/*
 * A list of possible events
 */
var events = exports.events = {
	click: 'click',
	mousemove: 'mousemove',
	mouseover: 'mouseover',
	mouseout: 'mouseout',
	contextmenu: 'contextmenu',
	died: 'died',
	shot: 'shot',
	hit: 'hit',
	accomplished : 'accomplished',
	playerDefeated : 'playerDefeated',
	moneyChanged : 'moneyChanged',
	waveCreated : 'waveCreated',
	waveFinished : 'waveFinished',
	waveDefeated : 'waveDefeated',
	healthChanged : 'healthChanged',
	unitSpawned : 'unitSpawned',
	towerNumberChanged : 'towerNumberChanged',
};



var Class = exports.Class = (function(){
	var initializing = false,
		fnTest = /\b_super\b/,
		cls = function Class() {}; // The base Class implementation (does nothing)
	
	// Create a new Class that inherits from this class
	cls.extend = function extend(prop, modifier) {
		var _super = this.prototype;

		// Instantiate a base class (but only create the instance, don't run the init constructor)
		initializing = true;
		var prototype = new this();
		initializing = false;
		 
		// Copy the properties over onto the new prototype
		for (var name in prop) {
			// Check if we're overwriting an existing function
			prototype[name] = typeof(prop[name]) === "function" && typeof(_super[name]) === "function" && fnTest.test(prop[name]) ? (function(name, fn) {
				return function() {
					var tmp = this._super;
					// Add a new ._super() method that is the same method but on the super-class
					this._super = _super[name];
					// The method only need to be bound temporarily, so we remove it when we're done executing
					var ret = fn.apply(this, arguments);        
					this._super = tmp;
					return ret;
				};
			})(name, prop[name]) : prop[name];
		}
		 
		// The dummy class constructor
		var Class = function() {
			// All construction is actually done in the init method
			if (!initializing && this.init)
				this.init.apply(this, arguments);
		};
		 
		// Populate our constructed prototype object
		Class.prototype = prototype;
		 
		// Enforce the constructor to be what we expect
		Class.prototype.constructor = Class;

		// And make this class extendable
		Class.extend = this.extend;

		// Use class (for statics or registration)
		if (modifier && typeof(modifier) === 'function')
			modifier(Class);
		 
		return Class;
	};
	return cls;
})();

/* MazeStrategy ENUM
 */
var MazeStrategy = exports.MazeStrategy = {
	manhattan        : 1,
	maxDXDY          : 2,
	diagonalShortCut : 3,
	euclidean        : 4,
	euclideanNoSQR   : 5,
	custom           : 6,
	air              : 7
};

/* Direction ENUM
 */
var Direction = exports.Direction = {
	right : 0,
	top : 1,
	left : 2,
	bottom : 3,
};

var Steps = exports.Steps = {
	WithDiagonals : [[0, -1], [1, 0], [0, 1], [-1, 0], [1, -1], [1, 1], [-1, 1], [-1, -1]],
	OnlyStraight : [[0, -1], [1, 0], [0, 1], [-1, 0]],
};

/* Point STRUCT
 */
var Point = exports.Point = Class.extend({
	init: function(x, y) {
		this.x = x || 0;
		this.y = y || 0;
	},
	clone: function() {
		return new Point(this.x, this.y);
	},
	add: function(pt) {
		return new Point(this.x + pt.x, this.y + pt.y);
	},
	subtract: function(pt) {
		return new Point(this.x - pt.x, this.y - pt.y);
	},
	projectOn: function(pt) {
		return this.x * pt.x + this.y * pt.y;
	},
	norm: function() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	},
	square: function() {
		return this.x * this.x + this.y * this.y;
	},
	scale: function(factor) {
		return new Point(this.x * factor, this.y * factor);
	},
	normalize: function() {
		var norm = 1.0 / this.norm();
		return this.scale(norm);
	},
	regularize: function() {
		if (this.x === 0 && this.y === 0)
			return new Point(2 * Math.round(Math.random()) - 1, 2 * Math.round(Math.random()) - 1);

		return this;
	},
	toDirection: function() {
		if (this.x > this.y)
			return this.x > -this.y ? Direction.right : Direction.top;
		else if (this.x > -this.y)
			return Direction.bottom;
		return Direction.left;
	},
});

/* Size STRUCT
 */
var Size = exports.Size = Class.extend({
	init: function(width, height) {
		this.width = width || 0;
		this.height = height || 0;
	},
	clone: function() {
		return new Size(this.width, this.height);
	},
	divide: function(sz) {
		return new Size(this.width / sz.width, this.height / sz.height);
	}
});

/* Maze CLASS
 */
var Maze = exports.Maze = Class.extend({
	init: function(size, path, turrets) {
		this.gridDim = size;
		var grid = [];

		for (var i = 0; i < size.width + 1; i++) {
			var a = [];

			for (var j = 0; j < size.height; j++)
				a.push(1);

			grid.push(a);
		}

		this.grid = grid;
		this.path = path;
		this.start = path[0];
		this.end = path[path.length-1];
		this.paths = {};
		this.turrets = turrets;
	},
	
	tryBuild: function(point, weight) {
		if (this.grid[point.x][point.y] !== 1)
			return false;

		for (var i = 0; i < this.turrets.length; i++) {
			if (this.turrets[i].x == point.x && this.turrets[i].y == point.y) {
				this.grid[point.x][point.y] = weight || 0;
				return true;
			}
		}
		return false;
	},
	tryRemove: function(point) {
		if (this.grid[point.x][point.y] !== 1) {
			this.grid[point.x][point.y] = 1;
			this.paths = {};
			return true;
		}
		
		return false;
	},
	getPath: function() {
		return this.path;
	}
});



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

/*
 * The VIEW and implementations of it
 */
var View = exports.View = Class.extend({
	init: function(width, height) {
		this.running = false;
		this.visuals = [];
		this.background = undefined;
		this.width = width;
		this.height = height;
		this.showGrid = true;
		this.mazeSize = new Size(25, 25);
	},
	pause: function() {
		this.running = false;	
	},
	add: function(visual) {
		if (Array.isArray(visual)) {
			for (var i = 0, n = visual.length; i < n; ++i)
				this.visuals.push(visual[i]);
		} else
			this.visuals.push(visual);

		this.visuals.sort(function(a, b) {
			return a.z - b.z;
		});
	},
	remove: function(visual) {
		var index = this.visuals.indexOf(visual);
		this.visuals.splice(index, 1);
	},
	draw: function() {
		this.drawBackground();
		this.drawSpawn();
		this.drawHome();
		this.drawPath();
		this.drawTurrets();

		if (this.showGrid)
			this.drawGrid();

		for (var i = 0, n = this.visuals.length; i < n; ++i)
			this.drawVisual(this.visuals[i]);
	},
	drawBackground: function() {
	},
	drawGrid: function() {
	},
	drawHome: function() {
	},
	drawSpawn: function() {
	},
	drawPath: function() {
	},
	drawTurrets: function() {
	},
	drawVisual: function(element) {
	},
	playSound: function() {
	},
	start: function(){
	},
	setGameLogic: function(logic) {
		this.logic = logic;
	},
});

/*
 * The implementation for the canvas element
 */
var CanvasView = exports.CanvasView = View.extend({
	init: function(element) {
		this._super(element.width, element.height);
		this.view = element;
		this.context = element.getContext('2d');
		this.sounds = {};
		this.images = {};
		
		this.nextAnimationFrame = (window.requestAnimationFrame || window.webkitRequestAnimationFrame || 
			window.mozRequestAnimationFrame || window.oRequestAnimationFrame || 
			window.msRequestAnimationFrame || function(callback) {
				window.setTimeout(callback, 1000 / constants.ticks);
			}
		).bind(window);
	},	
	start: function() {
		var me = this;
		me.running = true;
		var render = function() {
			if (me.running)
				me.nextAnimationFrame(render);
			me.draw();
		};
		me.nextAnimationFrame(render);
	},
	drawVisual: function(element) {
		var ctx = this.context;
		var visual = element.visual;
		var sx = visual.index * visual.width;
		var sy = 0;
		var wo = this.width / this.mazeSize.width;
		var ho = this.height / this.mazeSize.height;
		var dx = element.mazeCoordinates.x * wo;
		var dy = element.mazeCoordinates.y * ho;
		var w = visual.scale * wo * Math.min(1, visual.width / visual.height);
		var h = visual.scale * ho * Math.min(1, visual.height / visual.width);
		dx += (wo - w) * 0.5;
		dy += (ho - h) * 0.5;
		ctx.drawImage(visual.image, sx, sy, visual.width, visual.height, dx, dy, w, h);
	},
	drawBackground: function() {
		var ctx = this.context;
		ctx.clearRect(0, 0, this.width, this.height);

		if (this.background)
			ctx.drawImage(this.background, 0, 0, this.width, this.height);
	},
	drawHome: function() {
		var ctx = this.context;
		var width = this.width / this.mazeSize.width;
		var height = this.height / this.mazeSize.height;
		var path = this.logic.maze.path;
		var x = path[path.length-1].x * width;
		var y = path[path.length-1].y * height;
		ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
		ctx.fillRect(x, y, width, height);
	},
	drawSpawn: function() {
		var ctx = this.context;
		var width = this.width / this.mazeSize.width;
		var height = this.height / this.mazeSize.height;
		var path = this.logic.maze.path;
		var x = path[0].x * width;
		var y = path[0].y * height;
		ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
		ctx.fillRect(x, y, width, height);
	},
	drawGrid: function() {
		var ctx = this.context;
		ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
		ctx.lineWidth = 0.8;

		for (var i = 1, w = this.mazeSize.width; i < w; ++i) {
			var x = i * this.width / w;
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, this.height);
			ctx.stroke();
			ctx.closePath();
		}
		
		for (var j = 1, h = this.mazeSize.height; j < h; ++j) {
			var y = j * this.height / h;
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(this.width, y);
			ctx.stroke();
			ctx.closePath();
		}
	},
	drawPath: function() {
		var ctx = this.context;
		var width = this.width / this.mazeSize.width;
		var height = this.height / this.mazeSize.height;
		var path = this.logic.maze.path;
		for (var i = 0; i < path.length; i++) {
			var x = path[i].x * width;
			var y = path[i].y * height;
			ctx.fillStyle = 'rgba(20, 20, 20, 0.6)';
			ctx.fillRect(x, y, width, height);
		}
	},
	
	drawTurrets: function() {
		var ctx = this.context;
		var width = this.width / this.mazeSize.width;
		var height = this.height / this.mazeSize.height;
		var turrets = this.logic.maze.turrets;
		for (var i = 0; i < turrets.length; i++) {
			var x = turrets[i].x * width;
			var y = turrets[i].y * height;
			ctx.fillStyle = 'rgba(20, 20, 200, 0.6)';
			ctx.fillRect(x, y, width, height);
		}
	},

	

	playSound: function(soundName, loop, volume) {
		var audio = this.sounds[soundName];
		var sound = new Sound(audio, loop);
		if (!isNaN(volume))
			sound.setVolume(volume);
		sound.play();
	},

	loadResources: function(resources, completed, progress) {
		var loader = new Loader(completed, progress);
		loader.set('Images', ImageLoader, this.images, resources.images);
		loader.set('Sounds', SoundLoader, this.sounds, resources.sounds);
		loader.start();
	}

});

/*
 * The Sound class
 */
var Sound = exports.Sound = Class.extend({
	init: function(tag, loop) {
		this.source = tag.src;
		this.loop = !!loop;
		this.setVolume(1.0);
	},
	setVolume: function(value) {
		this.volume = Math.max(0, Math.min(1, value));

		if (this.element)
			this.element.volume = Sound.volume * this.volume;
	},
	play: function() {
		if (this.element || Sound.active > Sound.channels)
			return;

		var me = this;
		me.element = Sound.createAudio(this.source);
		me.setVolume(me.volume);
		var ended = function() {
			if (me.loop) {
				this.currentTime = 0;
				this.play();
			} else {
				me.element = undefined;
				this.removeEventListener('ended', ended);
				Sound.destroyAudio(this);
			}
		};

		me.element.addEventListener('ended', ended);

		if (Sound.enabled)
			me.element.play();
	},
}, function(sounds) {
	var deposit = [];
	sounds.volume = 1.0;
	sounds.channels = 6;
	sounds.active = 0;
	sounds.sounds = [];
	sounds.enabled = true;
	sounds.createAudio = function(src) {
		var d;
		sounds.active++;

		for (var i = deposit.length; i--; ) {
			d = deposit[i];

			if (!d.active && d.src === src) {
				d.active = true;
				d.element.currentTime = 0;
				return d.element;
			}
		}

		d = {
			active:true,
			src:src,
			element:new Audio(src),
		};
		deposit.push(d);
		return d.element;
	};
	sounds.destroyAudio = function(element) {
		sounds.active--;

		for (var i = deposit.length; i--; ) {
			if (deposit[i].element === element) {
				deposit[i].active = false;
				break;
			}
		}
	};
	sounds.disable = function() {
		if (sounds.enabled) {
			sounds.enabled = false;

			for (var i = deposit.length; i--; ) {
				if (deposit[i].active)
					deposit[i].element.pause();
			}
		}
	};
	sounds.enable = function() {
		if (!sounds.enabled) {
			sounds.enabled = true;

			for (var i = deposit.length; i--; ) {
				if (deposit[i].active)
					deposit[i].element.play();
			}
		}
	};
	sounds.setVolume = function(volume) {
		volume = Math.min(Math.max(volume, 0), 1);
		var change = volume / sounds.volume;
		sounds.volume = volume;

		for (var i = deposit.length; i--; )
			deposit[i].element.volume = change * deposit[i].element.volume;
	};
});

/*
 * The available images
 */
//var images = exports.images = {};

/*
 * The available sounds
 */
//var sounds = exports.sounds = {};

/*
 * The path
 */
var Path = exports.Path = Class.extend({
	init: function(list) {
		this.list = list;
	},
	propagate: function(pathLength) {
		var lastIndex = ~~pathLength;
		var dir = Direction.bottom;

		if (lastIndex + 1 >= this.list.length)
			return false;

		if (this.list[lastIndex].x < this.list[lastIndex + 1].x)
			dir = Direction.right;
		else if (this.list[lastIndex].x > this.list[lastIndex + 1].x)
			dir = Direction.left;
		else if (this.list[lastIndex].y > this.list[lastIndex + 1].y)
			dir = Direction.top;

		var point = this.list[lastIndex + 1].subtract(this.list[lastIndex]);
		point = point.scale(pathLength - lastIndex);
		point = this.list[lastIndex].add(point);

		return {
			point: point,
			direction: dir,
		};
	},
});

/*
 * The base for classes with events 
 */
var Base = exports.Base = Class.extend({
	init: function() {
		this.events = {};
	},
	registerEvent: function() {
		var len = arguments.length, 
			i, event;
		for (i = 0; i < len; i++) {
			event = arguments[i];
			if (!this.events[event]) {
				this.events[event] = [];
			}
		}
	},
	unregisterEvent: function() {
		var len = arguments.length;
		for (var i = 0; i < len; i++) {
			delete this.events[arguments[i]];
		}
	},
	triggerEvent: function(event, args) {
		if (this.events[event]) {
			var e = this.events[event];

			for (var i = e.length; i--; )
				e[i].apply(this, [args || {}]);
		}
	},
	addEventListener: function(event, handler) {
		if (this.events[event] && handler && typeof(handler) === 'function')
			this.events[event].push(handler);
	},
	removeEventListener: function(event, handler) {
		if (this.events[event]) {
			if (handler && typeof(handler) === 'function') {
				var index = this.events[event].indexOf(handler);
				this.events[event].splice(index, 1);
			} else
				this.events[event].splice(0, this.events[event].length);
		}
	},
});

/*
 * The player class
 */
var Player = exports.Player = Base.extend({ 
	init: function(name) {
		this._super();
		this.name = name || 'Player';
		this.money = 0;
		this.points = 0;
		this.hitpoints = 0;
		this.registerEvent(events.playerDefeated, events.moneyChanged, events.healthChanged);
	},
	setMoney: function(value) {
		this.money = value;
		this.triggerEvent(events.moneyChanged, this);
	},
	addMoney: function(value) {
		this.points += Math.max(0, value);
		this.setMoney(this.money + value);
	},
	getMoney: function() {
		return this.money;
	},
	setHitpoints: function(value) {
		this.hitpoints = Math.max(0, value);
		this.triggerEvent(events.healthChanged, this);

		if (this.hitpoints === 0)
			this.triggerEvent(events.playerDefeated, this);
	},
	addHitpoints: function(value) {
		this.setHitpoints(this.hitpoints + value);
	},
	getHitpoints: function() {
		return this.hitpoints;
	},
	hit: function(unit) {
		this.setHitpoints(this.hitpoints - unit.damage);
	},
});

/*
 * The base for game objects (units, towers, shots)
 */
var GameObject = exports.GameObject = Base.extend({
	init: function(logic, speed, animationDelay) {
		this._super();
		this.z = 0;
		// ACA
		// ARREGLAR
		// POR QUÉ?
		this.mazeCoordinates = new Point();
		this.speed = speed || 0;
		this.animationDelay = animationDelay || 15;
		this.dead = false;
		this.direction = Direction.right;
		this.logic = logic;
	},
	distanceTo: function(point) {
		return point.subtract(this.mazeCoordinates).norm();
	},
	update: function() {
		var visual = this.visual;
		if (visual) {
			var direction = visual.frames.length === 4 ? this.direction : 0;
			visual.time += constants.ticks;
			var i;

			if (visual.direction !== this.direction) {
				visual.direction = this.direction;
				visual.time = 0;
				visual.index = 0;

				for (i = 0; i < direction; ++i)
					visual.index += visual.frames[i];
			} else if (visual.delay < visual.time) {
				var frames = 0;
				var index = 0;
				visual.index++;
				visual.time = 0;

				for (i = 0; i < direction; ++i)
					index += visual.frames[i];

				if (visual.index === index + visual.frames[direction])
					visual.index = index;
			}
		}
	},
	getClosestTarget: function(targets, maximum) {
		var closestTarget;
		var dist = Number.MAX_VALUE;

		for (var i = targets.length; i--; ) {
			var target = targets[i];
			var t = this.distanceTo(target.mazeCoordinates);

			if (t < dist) {
				closestTarget = target;
				dist = t;
			}
		}

		if (dist <= maximum)
			return closestTarget;
	},
	playSound: function(soundName) {
		/*var audio = sounds[soundName];
		var sound = new Sound(audio);
		sound.play();*/
		var view = this.logic && this.logic.getView();
		if (view) {
			view.playSound(soundName);
		}
	},
	createVisual: function(imageName, frames, scale) {
		var total = 0;
		var index = 0;
		var view = this.logic.getView();
		var image = view.images && view.images[imageName];
		
		if (image) {
			for (var i = frames.length; i--; ) {
				total += frames[i];

				if (i < this.direction)	
					index += frames[i];
			}

			if (frames.length === 1)
				index = 0;

			this.visual = {
				direction : this.direction,
				index : index,
				time : 0,
				length : total,
				frames : frames,
				image : image,
				delay : this.animationDelay,
				width : image.width / total,
				height: image.height,
				scale : scale || 1,
			};
		}
	},
	/*setGameLogic: function(logic) {
		this.logic = logic;
	},*/
});

/*
 * The tower base
 */
var Tower = exports.Tower = GameObject.extend({
	init: function(logic, speed, animationDelay, range, shotType) {
		this._super(logic, speed, animationDelay);
		this.range = range || 0;
		this.targets = [];
		this.timeToNextShot = 0;
		this.mazeWeight = 0;
		this.direction = Direction.left;
		this.shotType = shotType || {};
		this.registerEvent(events.shot);
	},
	targetFilter: function(target) {
		return target.strategy !== MazeStrategy.air;
	},
	update: function() {
		this._super(this.logic);
		var shot;

		if (this.timeToNextShot <= 0)
			shot = this.shoot();
		
		if (shot) {
			this.triggerEvent(events.shot, shot);
			this.timeToNextShot = ~~(1000 / this.speed);
		} else
			this.timeToNextShot -= constants.ticks;
	},
	shoot: function() {
		var targets = this.targets.filter(this.targetFilter);
		var closestTarget = this.getClosestTarget(targets, this.range);

		if (closestTarget) {
			var shot = new (this.shotType)(this.logic);
            shot.mazeCoordinates = this.mazeCoordinates;
            shot.velocity = closestTarget.mazeCoordinates.subtract(this.mazeCoordinates);
            shot.direction = shot.velocity.toDirection();
            shot.targets = targets;
            this.direction = shot.direction;
            return shot;
		}
	},
});

/*
 * The unit base
 */
var Unit = exports.Unit = GameObject.extend({
 	init: function(logic, speed, animationDelay, mazeStrategy, hitpoints) {
		this._super(logic, speed, animationDelay);
 		this.timer = 0;
 		this.path = new Path([]);
 		this.mazeCoordinates = new Point();
 		this.damage = 1;
 		this.strategy = mazeStrategy || MazeStrategy.air;
 		this.hitpoints = hitpoints || 0;
 		this.health = this.hitpoints;
 		this.direction = Direction.right;
 		this.registerEvent(events.accomplished, events.died);
 	},
 	playInitSound: function() {
		this.playSound('humm');
 	},
 	playDeathSound: function() {
 		this.playSound('explosion');
 	},
 	playVictorySound: function() {
		this.playSound('laugh');
 	},
 	update: function() {
 		this._super(this.logic);
 		this.timer += constants.ticks;
 		var s = this.speed * 0.001;

 		if (!this.dead && s > 0) {
 			var sigma = this.path.propagate(s * this.timer);

 			if (!sigma) {
 				this.dead = true;
 				this.triggerEvent(events.accomplished, this);
 				this.playVictorySound();
 			} else {
 				this.mazeCoordinates = sigma.point;
 				this.direction = sigma.direction;
 			}
 		}
 	},
 	hit: function(shot) {
 		this.health -= shot.damage;

 		if (!this.dead && this.health <= 0) {
 			this.health = 0;
 			this.dead = true;
 			this.triggerEvent(events.died, this);
 			this.playDeathSound();
 		}
 	},
 });

/*
 * The shot base
 */
var Shot = exports.Shot = GameObject.extend({
	init: function(logic, speed, animationDelay, damage, impactRadius) {
		this._super(logic, speed, animationDelay);
		this.damage = damage || 0;
		this.targets = [];
		this.impactRadius = impactRadius || 0.5;
		this.timeToDamagability = ~~(200 / this.speed);
		this.velocity = new Point();
		this.registerEvent(events.hit);
	},
	update: function() {
		var pt = this.velocity.scale(this.speed * constants.ticks * 0.001);
		this.mazeCoordinates = this.mazeCoordinates.add(pt);
		this._super(this.logic);

		if (this.timeToDamagability > 0) {
			this.timeToDamagability -= constants.ticks;
		} else {
			var closestTarget = this.getClosestTarget(this.targets, this.impactRadius);
			
			if (closestTarget) {
				closestTarget.hit(this);
				this.dead = true;
				this.triggerEvent(events.hit, closestTarget);
			}
		}
	},
});

/*
 * The gamestate enumeration
 */
var GameState = exports.GameState = {
	unstarted : 0,
	building : 1,
	waving : 2,
	finished : 3,
};

/* 
 * Global objects
 */
var types = exports.types = {
	units : {},
	towers : {},
	shots : {},
};

/*
 * The GAME
 */
var GameLogic = exports.GameLogic = Base.extend({
	init: function(view, maze) {
		var me = this;
		me._super();

		me.towers = [];
		me.units  = [];
		me.shots  = [];

		me.mediPackCost     = constants.mediPackCost;
		me.mediPackFactor   = constants.mediPackFactor;
		me.towerBuildCost   = constants.towerBuildCost;
		me.towerBuildFactor = constants.towerBuildFactor;
		me.maxTowerNumber   = constants.towerBuildNumber;
		me.mediPackHealth   = constants.mediPackHealth;

		me.view          = view;
		me.player        = new Player();
		me.state         = GameState.unstarted;
		me.maze          = maze;
		me.view.mazeSize = me.getMazeSize();
		me.currentWave   = null;
		me.view.setGameLogic(me);

		me.player.addEventListener(events.playerDefeated, function(e) {
			me.triggerEvent(events.playerDefeated, e);
			me.finish();
		});

		me.player.addEventListener(events.moneyChanged, function(e) {
			me.triggerEvent(events.moneyChanged, e);
		});

		me.player.addEventListener(events.healthChanged, function(e) {
			me.triggerEvent(events.healthChanged, e);
		});

		me.registerEvent(events.refreshed, events.waveDefeated, events.waveFinished, 
			events.playerDefeated, events.moneyChanged, events.healthChanged, 
			events.waveCreated, events.unitSpawned, events.towerNumberChanged);
	},
	start: function() {
		if (this.state === GameState.unstarted) {
			this.player.setHitpoints(constants.hitpoints);
			this.player.setMoney(constants.money);
			this.triggerEvent(events.towerNumberChanged, {
				current: this.getNumShooting(),
				maximum: this.maxTowerNumber,
			});
			this.state = GameState.building;
		}

		if (!this.gameLoop) {
			var me = this;
			this.view.start();
			this.gameLoop = setInterval(function() {
				me.tick();
			}, constants.ticks);	
		}
	},
	pause: function() {
		if (this.gameLoop) {
			this.view.pause();
			clearInterval(this.gameLoop);
			this.gameLoop = undefined;	
		}
	},
	update: function(objects) {
		for (var i = objects.length; i--; )
			objects[i].update();
	},
	tick: function() {
		if (this.state !== GameState.building && this.state !== GameState.waving)
			return;
		this.update(this.towers);

		if (this.state === GameState.waving) {
			this.update(this.shots);
			this.update(this.units);
			this.removeDeadObjects();
			var newUnits = this.currentWave.update();

			for (var i = newUnits.length; i--; ) {
				var unit = newUnits[i];
				var path = this.maze.getPath();
				unit.mazeCoordinates = this.maze.start;
				unit.path = new Path(path);
				this.addUnit(unit);
			}
		}
	},
	finish: function() {
		this.state = GameState.finished;
	},
	getViewSize: function() {
		return this.view.getSize();
	},
	getNumShooting: function() {
		return this.towers.length;
	},
	getMazeSize: function() {
		return this.maze.gridDim;
	},
	transformCoordinates: function(screenX, screenY) {
		var x = screenX * this.maze.gridDim.width / this.view.width;
		var y = screenY * this.maze.gridDim.height / this.view.height;
		return new Point(~~x, ~~y);
	},
	removeTower: function(tower) {
		tower.removeEventListener(events.shot);
		this.towers.splice(this.towers.indexOf(tower), 1);
		this.view.remove(tower);
	},
	addTower: function(tower) {
		var me = this;
		tower.addEventListener(events.shot, function(shot) {
			me.addShot(shot);
		});
		me.towers.push(tower);
		me.view.add(tower);
	},
	addShot: function(shot) {
		this.shots.push(shot);
		this.view.add(shot);
		shot.playInitSound();
	},
	addUnit: function(unit) {
		var me = this;
		unit.addEventListener(events.accomplished, function(unt) {
			me.player.hit(unt);
		});
		unit.playInitSound();
		me.units.push(unit);
		me.view.add(unit);
	},
	removeDead: function(objects) {
		for (var i = objects.length; i--; ) {
			if (objects[i].dead) {
				this.view.remove(objects[i]);
				objects.splice(i, 1);
			}
		}
	},
	removeDeadObjects: function() {
		this.removeDead(this.towers);
		this.removeDead(this.shots);
		this.removeDead(this.units);

		if (this.currentWave.finished && this.units.length === 0)
			this.endWave();
	},
	endWave: function() {
		this.player.addMoney(this.currentWave.prizeMoney);
		this.state = GameState.building;

		for (var i = this.shots.length; i--; ) {
			this.view.remove(this.shots[i]);
			this.shots.splice(i, 1);
		}

		this.triggerEvent(events.waveDefeated, this.player);
	},
	beginWave: function() {
		if (this.state === GameState.building) {
			var me = this;
			me.state = GameState.waving;
			var wave = me.waves.next();
			wave.addEventListener(events.waveFinished, function() {
				me.triggerEvent(events.waveFinished);
				wave.removeEventListener(events.waveFinished);
				wave.removeEventListener(events.unitSpawned);
			});
			wave.addEventListener(events.unitSpawned, function(e) {
				me.triggerEvent(events.unitSpawned, e);
			});
			me.triggerEvent(events.waveCreated, wave);
			me.currentWave = wave;
		}
	},
	buildTower: function(pt, Type) {
		var newTower = new Type(this);
		var numShooting = this.getNumShooting();
		if (this.state === GameState.building && Type.cost <= this.player.money && (numShooting < this.maxTowerNumber)) {
			newTower.mazeCoordinates = pt;
			newTower.cost = Type.cost;
			newTower.targets = this.units;

			if (this.maze.tryBuild(pt, newTower.mazeWeight)) {
				this.player.addMoney(-Type.cost);
				this.addTower(newTower);

				
				this.triggerEvent(events.towerNumberChanged, {
					current: numShooting + 1,
					maximum: this.maxTowerNumber,
				});	
				

				return true;
			}
		}

		return false;
	},
	destroyTower: function(pt) {
		if (this.state == GameState.building) {
			var towerToRemove = this.towers.filter(function(t) {
				return t.mazeCoordinates.x === pt.x && t.mazeCoordinates.y === pt.y;
			})[0];

			if (towerToRemove) {
				this.player.addMoney(0.5 * towerToRemove.cost);
				this.removeTower(towerToRemove);
				this.maze.tryRemove(pt);

				
				this.triggerEvent(events.towerNumberChanged, {
					current: this.getNumShooting(),
					maximum: this.maxTowerNumber,
				});
				
			}
		}
	},
	getView: function() {
		var view = this.view;
		return view;
	},
	setWaves: function(waves) {
		var logic = this;
		this.waves = waves;
		if (waves) {
			waves.waves.forEach(function (w) {
				w.logic = logic;
			});
		}
		return this;

		// var logic = (new GameLogic(..)).setWaves(..)
	}
});

/*
 * The WAVELIST
 */
var WaveList = exports.WaveList = Class.extend({
	init: function(waves) {
		this.waves = waves;
		this.index = 0;
		this.unitNames = Object.keys(types.units);
	},

	next: function() {
		if (this.index < this.waves.length)
			return this.waves[this.index++];
	},
	
	setGameLogic: function(logic) {
		this.logic = logic;
	},
});

/*
 * The WAVE
 */
var Wave = exports.Wave = Base.extend({
	init: function(logic, prizeMoney, units) {
		this._super();
		this.startTime = 0;
		this.units = units || [];
		this.prizeMoney = prizeMoney || 0;
		this.finished = false;
		this.registerEvent(events.unitSpawned, events.waveFinished);
		this.logic = logic;
	},
	add: function(unit, time) {
		this.units.push({
			time: time,
			unit: unit
		});
	},
	update: function() {
		var unitsToSpawn = [];
		if (!this.finished) {
			for (var i = this.units.length; i--; ) {
				if (this.units[i].time < this.startTime) {
					unitsToSpawn.push(new (types.units[this.units[i].unit])(this.logic));
					this.units.splice(i, 1);
				}
			}
			if (this.units.length === 0) {
				this.finished = true;
				this.triggerEvent(events.waveFinished);
			}
			if (unitsToSpawn.length > 0) {
				var remaining = this.units.length;
				this.triggerEvent(events.unitSpawned, remaining); 				
			}
			this.startTime += constants.ticks;
		}
		return unitsToSpawn;
	},
	
});

/*
 * The Standard unit
 */
var Mario = exports.Mario = Unit.extend({
	init: function(logic) {
		this._super(logic, Mario.speed, 100, MazeStrategy.manhattan, Mario.hitpoints);
		this.createVisual(Mario.sprite, [8,8,8,8]);
	},
}, function(enemy) {
	enemy.speed = 2.0;
	enemy.hitpoints = 10;
	enemy.description = 'You have to be careful with that plumber.';
	enemy.nickName = 'Mario';
	enemy.sprite = 'mario';
	types.units.Mario = enemy;
});

/*
 * The Rope unit
 */
var Rope = exports.Rope = Unit.extend({
	init: function(logic) {
		this._super(logic, Rope.speed, 80, MazeStrategy.euclideanNoSQR, Rope.hitpoints);
		this.createVisual(Rope.sprite, [4, 4, 4, 4], 0.8);
	},
}, function(rope) {
	rope.speed = 2.0;
	rope.hitpoints = 20;
	rope.description = 'An ugly rope that tries to conquer the zone. Watch out when they mass up!';
	rope.nickName = 'Rope';
	rope.sprite = 'rope';
	types.units.Rope = rope;
});

/*
 * The Fire Wizard Robe unit
 */
var FireWizzrobe = exports.FireWizzrobe = Unit.extend({
	init: function(logic) {
		this._super(logic, FireWizzrobe.speed, 70, MazeStrategy.manhattan, FireWizzrobe.hitpoints);
		this.createVisual(FireWizzrobe.sprite, [3, 3, 3, 3], 1.4);
	},
}, function(wizz) {
	wizz.speed = 3.0;
	wizz.hitpoints = 30;
	wizz.description = 'The wizard with the fire robe is quite fast, but does not take very much.';
	wizz.nickName = 'Wizzrobe';
	wizz.sprite = 'firewizzrobe';
	types.units.FireWizzrobe = wizz;
});

/*
 * The Air Wolf unit
 */
var AirWolf = exports.AirWolf = Unit.extend({
	init: function(logic) {
		this._super(logic, AirWolf.speed, 50, MazeStrategy.air, AirWolf.hitpoints);
		this.createVisual(AirWolf.sprite, [4]);
	},
}, function(wolf) {
	wolf.speed = 2.0;
	wolf.hitpoints = 40;
	wolf.description = 'The air wolf is the only aerial unit in the game. Do not underestimate him as an air wolf fleet could kill you.';
	wolf.nickName = 'Wolf';
	wolf.sprite = 'airwolf';
	types.units.AirWolf = wolf;
});

/*
 * The dark nut unit
 */
var DarkNut = exports.DarkNut = Unit.extend({
	init: function(logic) {
		this._super(logic, DarkNut.speed, 80, MazeStrategy.euclideanNoSQR, DarkNut.hitpoints);
		this.createVisual(DarkNut.sprite, [4, 4, 4, 4]);
	},
}, function(nut) {
	nut.speed = 2.5;
	nut.hitpoints = 150;
	nut.description = 'The dark nut is an ancient warrier that takes quite some hits. His speed is superior to most other units.';
	nut.nickName = 'Dark Nut';
	nut.sprite = 'darknut';
	types.units.DarkNut = nut;
});

/*
 * A derived unit
 */
var Speedy = exports.Speedy = Unit.extend({
	init: function(logic) {
		this._super(logic, Speedy.speed, 25, MazeStrategy.diagonalShortCut, Speedy.hitpoints);
		this.createVisual(Speedy.sprite, [20]);
	},
}, function(unit) {
	unit.speed = 5.2;
	unit.hitpoints = 200;
	unit.description = 'This unit is just a single blob. It is ultra fast and has quite some armor. It will give you some trouble.';
	unit.nickName = 'HAL';
	unit.sprite = 'newunit';
	types.units.Speedy = unit;
});

/*
 * The big Armored unit
 */
var Armos = exports.Armos = Unit.extend({
	init: function(logic) {
		this._super(logic, Armos.speed, 125, MazeStrategy.euclidean, Armos.hitpoints);
		this.createVisual(Armos.sprite, [4, 4, 4, 4], 1.2);
	},
}, function(armos) {
	armos.speed = 1.0;
	armos.hitpoints = 600;
	armos.description = 'The unit is actually called Armos and not Armor, however, Armor would have been a good name as well. You will need some fire power to bring him down.';
	armos.nickName = 'Armos';
	armos.sprite = 'armos';
	types.units.Armos = armos;
});

/*
 * The standard shot
 */
var StandardShot = exports.StandardShot = Shot.extend({
	init: function(logic) {
		this._super(logic, StandardShot.speed, 15, StandardShot.damage, StandardShot.impactRadius);
		this.createVisual(StandardShot.sprite, [1], 0.25);
	},
	playInitSound: function() {
		this.playSound('wowpulse');
 	},
}, function(std) {
	std.nickName = 'Standard';
	std.description = 'Just an ordinary shot with no special ability.';
	std.sprite = 'sunshot';
	std.frames = 1;
	std.speed = 10;
	std.damage = 1;
	std.impactRadius = 0.5;
	types.shots.StandardShot = std;
});

/*
 * The anti-air shot
 */
var AirShot = exports.AirShot = Shot.extend({
	init: function(logic) {
		this._super(logic, AirShot.speed, 10, AirShot.damage, AirShot.impactRadius);
		this.createVisual(AirShot.sprite, [1, 1, 1, 1], 0.2);
	},
	playInitSound: function() {
		this.playSound('flak');
 	},
}, function(air) {
	air.nickName = 'SAM';
	air.description = 'Surface to air missile that is highly effective.';
	air.sprite = 'airshot';
	air.frames = 4;
	air.speed = 2.5;
	air.damage = 5;
	air.impactRadius = 0.5;
	types.shots.AirShot = air;
});

/*
 * The flames
 */
var FlameShot = exports.FlameShot = Shot.extend({
	init: function(logic) {
		this._super(logic, FlameShot.speed, 100, FlameShot.damage, FlameShot.impactRadius);
		this.createVisual(FlameShot.sprite, [8]);
	},
	playInitSound: function() {
		this.playSound('flames');
 	},
}, function(flame) {
	flame.nickName = 'Red Napalm';
	flame.description = "Napalm power you don't want to mess with.";
	flame.sprite = 'flameshot';
	flame.frames = 8;
	flame.speed = 1.5;
	flame.damage = 8;
	flame.impactRadius = 0.5;
	types.shots.FlameShot = flame;
});

/*
 * The shot from hell
 */
var HellShot = exports.HellShot = Shot.extend({
	init: function(logic) {
		this._super(logic, HellShot.speed, 75, HellShot.damage, HellShot.impactRadius);
		this.createVisual(HellShot.sprite, [12]);
	},
	playInitSound: function() {
		this.playSound('hellshot');
 	},
}, function(hell) {
	hell.nickName = 'HDEB';
	hell.description = 'The High Dark Energy Density is shot by the gate to hell. It catches your soul and gives you the rest.';
	hell.sprite = 'hellshot';
	hell.frames = 12;
	hell.speed = 2.0;
	hell.damage = 300;
	hell.impactRadius = 0.5;
	types.shots.HellShot = hell;
});

/*
 * The icy shot
 */
var IceShot = exports.IceShot = Shot.extend({
	init: function(logic) {
		this._super(logic, IceShot.speed, 200, IceShot.damage, IceShot.impactRadius);
		this.createVisual(IceShot.sprite, [4]);
	},
	playInitSound: function() {
		this.playSound('icy');
 	},
}, function(ice) {
	ice.nickName = 'Snowball 5';
	ice.description = 'An experimental super cold plasma (cold is relative here).';
	ice.sprite = 'iceshot';
	ice.frames = 4;
	ice.speed = 3.5;
	ice.damage = 15;
	ice.impactRadius = 0.5;
	types.shots.IceShot = ice;
});

/*
 * A shot from the MG nest
 */
var MGShot = exports.MGShot = Shot.extend({
	init: function(logic) {
		this._super(logic, MGShot.speed, 25, MGShot.damage, MGShot.impactRadius);
		this.createVisual(MGShot.sprite, [1, 1, 1, 1], 0.3);
	},
	playInitSound: function() {
		this.playSound('mgnest');
 	},
}, function(mg) {
	mg.nickName = 'Nato cal. 7.72';
	mg.description = 'Standard MG shot: 7.72 mm full metal jacket that handles most guys.';
	mg.sprite = 'mgshot';
	mg.frames = 4;
	mg.speed = 8.0;
	mg.damage = 2;
	mg.impactRadius = 0.5;
	types.shots.MGShot = mg;
});

/*
 * A laser beam
 */
var LaserShot = exports.LaserShot = Shot.extend({
	init: function(logic) {
		this._super(logic, LaserShot.speed, 25, LaserShot.damage, LaserShot.impactRadius);
		this.createVisual(LaserShot.sprite, [6, 6, 6, 6]);
	},
	playInitSound: function() {
		this.playSound('laser');
 	},
}, function(laser) {
	laser.nickName = 'Faser';
	laser.description = 'Neutrino shot: Hits before fired (from the perspective of any observer).';
	laser.sprite = 'lasershot';
	laser.frames = 24;
	laser.speed = 10;
	laser.damage = 7;
	laser.impactRadius = 0.5;
	types.shots.LaserShot = laser;
});

/*
 * The shell shot
 */
var ShellShot = exports.ShellShot = Shot.extend({
	init: function(logic) {
		this._super(logic, ShellShot.speed, 25, ShellShot.damage, ShellShot.impactRadius);
		this.createVisual(ShellShot.sprite, [1, 1, 1, 1], 0.3);
	},
	playInitSound: function() {
		this.playSound('artillery');
 	},
}, function(shell) {
	shell.nickName = 'Shell';
	shell.description = 'Hardened steel projectile that is no joke.';
	shell.sprite = 'shellshot';
	shell.frames = 4;
	shell.speed = 16;
	shell.damage = 15;
	shell.impactRadius = 0.5;
	types.shots.ShellShot = shell;
});

/*
 * The efficient MG nest
 */
var MGNest = exports.MGNest = Tower.extend({
	init: function(logic) {
		this._super(logic, MGNest.speed, 25, MGNest.range, MGNest.shotType);
		this.createVisual(MGNest.sprite, [1]);
	},
}, function(nest) {
	nest.description = 'The MG Nest is cheap but powerful. It can help you a lot against low armored units.';
	nest.nickName = 'MG Nest';
	nest.sprite = 'mgnest';
	nest.frames = 1;
	nest.shotType = MGShot;
	nest.speed = 4.0;
	nest.range = 3.0;
	nest.cost = 7;
	types.towers.MGNest = nest;
});

/*
 * The canon tower
 */
var CanonTower = exports.CanonTower = Tower.extend({
	init: function(logic) {
		this._super(logic, CanonTower.speed, 50, CanonTower.range, CanonTower.shotType);
		this.createVisual(CanonTower.sprite, [1, 1, 1, 1]);
	},
}, function(canon) {
	canon.description = 'The backbone in war! It has an amazing range and shoots shells, however, the firing speed could be better.';
	canon.nickName = 'Canon';
	canon.sprite = 'canontower';
	canon.frames = 4;
	canon.shotType = ShellShot;
	canon.speed = 1.0;
	canon.range = 8.0;
	canon.cost = 12;
	types.towers.CanonTower = canon;
});

/*
 * The flame tower
 */
var FlameTower = exports.FlameTower = Tower.extend({
	init: function(logic) {
		this._super(logic, FlameTower.speed, 200, FlameTower.range, FlameTower.shotType);
		this.createVisual(FlameTower.sprite, [4]);
	},
}, function(flame) {
	flame.description = 'Burn them down but a bit faster ... Excellent for slow armored units, but fails against strong armored enemies.';
	flame.nickName = 'Flame tower';
	flame.sprite = 'flametower';
	flame.frames = 4;
	flame.shotType = FlameShot;
	flame.speed = 6.0;
	flame.range = 2.0;
	flame.cost = 15;
	types.towers.FlameTower = flame;
});

/*
 * The ice tower
 */
var IceTower = exports.IceTower = Tower.extend({
	init: function(logic) {
		this._super(logic, IceTower.speed, 200, IceTower.range, IceTower.shotType);
		this.createVisual(IceTower.sprite, [1, 1, 1, 1]);
	},
}, function(ice) {
	ice.description = 'Cool. Slow shots, but with high efficiency. The right choice against slow strongly armored units.';
	ice.nickName = 'Ice-Tower';
	ice.sprite = 'icetower';
	ice.frames = 4;
	ice.shotType = IceShot;
	ice.speed = 2.0;
	ice.range = 6.0;
	ice.cost = 25;
	types.towers.IceTower = ice;
});

/*
 * The laser tower
 */
var LaserTower = exports.LaserTower = Tower.extend({
	init: function(logic) {
		this._super(logic, LaserTower.speed, 25, LaserTower.range, LaserTower.shotType);
		this.createVisual(LaserTower.sprite, [1, 1, 1, 1]);
	},
}, function(laser) {
	laser.description = "Won't play with you, but does it with high efficiency. Really fast low damage shots.";
	laser.nickName = 'Faser';
	laser.sprite = 'lasertower';
	laser.frames = 4;
	laser.shotType = LaserShot;
	laser.speed = 3.0;
	laser.range = 5.0;
	laser.cost = 29;
	types.towers.LaserTower = laser;
});

/*
 * The famous gate to hell
 */
var GateToHell = exports.GateToHell = Tower.extend({
	init: function(logic) {
		this._super(logic, GateToHell.speed, 200, GateToHell.range, GateToHell.shotType);
		this.createVisual(GateToHell.sprite, [6]);
	},
}, function(gate) {
	gate.description = 'Paint rules! This is the ultimate weapon of war, but it will not kill high speed units.';
	gate.nickName = 'Hellgate';
	gate.sprite = 'gatetohell';
	gate.frames = 6;
	gate.shotType = HellShot;
	gate.speed = 1.0;
	gate.range = 2.0;
	gate.cost = 55;
	types.towers.GateToHell = gate;
});

/* # Tower defense

Game component.
 */
var TowerDefense = exports.TowerDefense = declare({
	
	/** A tower defense game `Definition` holds all properties of the game invariant in every game
	state.
	*/
	'static Definition': declare({
		constructor: function TowerDefense$Definition(params) {
			base.initialize(this, params)
				/** The following properties belong to the game definition: 
					+ `mapHeight`: the number of rows of the map.
				*/
				.integer('mapHeight', { ignore: true })
				/** + `mapWidth`: the number of columns of the map.
				*/
				.integer('mapWidth', { ignore: true })
				/** + `creepPath`: an array of pairs (two value arrays) with the positions that define
					the path for the _creeps_.
				*/
				.array('creepPath', { ignore: true })
				/** + `towerPlaces`: an array of pairs (two value arrays) with the positions that define
					the locations for towers in the map.
				*/
				.array('towerPlaces', { ignore: true })
				/** + `waves`: an array of definitions in the form `[prize, waves]`, where `waves` is an
					array of arrays in the form `[time, unitName]`.
				*/
				.array('waves', { ignore: true })
				/** + `startMoney`: the amount of money the player has at the beginning of the game.
				*/
				.integer('startMoney', { defaultValue: 10, coerce: true })
				/** + `startHP`: the amount of hitpoints the player has at the beginning of the game.
				*/
				.integer('startHP', { defaultValue: 1, coerce: true });
		},
		
		__maze__: function __maze__() {
			var mkPoint = function (c) {
					return new Point(c[0], c[1]);
				};
			return new Maze(new Size(this.mapWidth, this.mapHeight), 
				this.creepPath.map(mkPoint), this.towerPlaces.map(mkPoint)
			);
		},
		
		__waveList__: function __waveList__() {
			return new WaveList(this.waves.map(function (w) {
				return new Wave(null, w[0], w[1].map(function (c) {
					return {time: c[0], unit: c[1]};
				}));
			}));
		},
		
		game: function game(params) {
			return new TowerDefense(base.copy(params || {}, { def: this }));
		}
	}), // declare Definition.
	
/*  mapWidth: int
	mapHeight: int
	creepPath: [[int,int]]
	towerPlaces: [[int,int]]
	waves; [[int, [function, int]]]
	
	ticks: 25,
	money : 50, --> startMoney
	hitpoints : 10, --> startHP
	mediPackCost : 5,
	mediPackFactor : 1.5,
	mediPackHealth : 1,
	towerBuildCost : 5,
	towerBuildFactor : 1.85,
	towerBuildNumber : 4,
*/
	constructor: function TowerDefense(params) {
		base.initialize(this, params)
			.object('def')
			/** The following properties belong to the game state: 
				+ `money`: the amount of money the player has.
			*/
			.integer('money', { defaultValue: this.def.startMoney, coerce: true })
			/** + `hp`: the amount of hitpoints the player has.
			*/
			.integer('hp', { defaultValue: this.def.startHP, coerce: true })
			/** + `level`: the current level the game is in.
			*/
			.integer('level', { defaultValue: 0, coerce: true })
			/** + `towers`: an array of `Tower` types (i.e. constructors).
			*/
			.array('towers', { ignore: true });
		/** The default for `towers` is no tower (i.e. `null`) at every place.
		*/
		if (!this.towers) {
			this.towers = base.Iterable.repeat(null, this.def.towerPlaces.length).toArray();
		}
	},
	
	result: function result() {
		if (this.hp <= 0) { // Defeat.
			return this.level - this.def.waves.length - 1;
		} else if (this.level >= this.def.waves.length) { // Victory.
			return this.hp + this.money / constants.mediPackCost;
		} else { // Game is not finished.
			return null;
		}
	},
	
	/** Builds and initializes a GameLogic instance.
	*/
	__logic__: function __logic__(view) {
		view = view || new View(0, 0);
		var maze = this.def.__maze__(),
			waveList = this.def.__waveList__(),
			logic = new GameLogic(view, maze);
		logic.state = GameState.building;
		logic.player.money = 999; // FIXME
		this.towers.forEach(function (TowerType, i) {
			if (TowerType) {
				logic.buildTower(maze.turrets[i], TowerType);
			}
		});
		logic.player.money = this.money;
		logic.player.hitpoints = this.hp;
		waveList.index = this.level;
		logic.setWaves(waveList);
		return logic;
	},
	
	/** Returns the params for a `TowerDefense` constructor given a `GameLogic` instance. 
	*/
	fromGameLogic: function fromGameLogic(logic) {
		var towers = base.iterable(logic.towers).map(function (t) {
				var coord = t.mazeCoordinates;
				return [coord.x +','+ coord.y, t];
			}).toObject();
		return new (this.constructor)({
			def: this.def,
			money: logic.player.money,
			hp: logic.player.hitpoints,
			level: logic.waves.index,
			towers: logic.maze.turrets.map(function (c) {
				var t = towers[c.x +','+ c.y];
				return t ? t.constructor : null;
			})
		});
	},
	
	/** The argument `move` must be an array of tower constructors.
	*/
	next: function next(move) {
		var that = this,
			logic = this.__logic__();
		// console.log(logic.towers.map(function (t) {
			// return t ? t.constructor.nickName +'@'+ JSON.stringify(t.mazeCoordinates) : '';
		// })); //FIXME

/*		console.log("MOVIMIENTO--->");
		console.log('move[0] = '+(move[0] && move[0].nickName));
		console.log('move[1] = '+(move[1] && move[1].nickName));
		console.log('move[2] = '+(move[2] && move[2].nickName));
		console.log("<---MOVIMIENTO");

		console.log("ESTADO PREVIO--->");
		console.log('logic.towers[0] = '+ (logic.towers[0] && logic.towers[0].constructor.nickName));
		console.log('logic.towers[1] = '+ (logic.towers[1] && logic.towers[1].constructor.nickName));
		console.log('logic.towers[2] = '+ (logic.towers[2] && logic.towers[2].constructor.nickName));
		console.log("<---ESTADO PREVIO");

		console.log("Guita inicial: "+logic.player.money);
		*/
		for (var i = 0; i < move.length; i++) { // Sell missing or modified turrets.
			if (move[i] !== this.towers[i] && this.towers[i]) {
//				console.log('Vendí ' + logic.maze.turrets[i].nickName);
				logic.destroyTower(logic.maze.turrets[i]);
				
			}
		}
		for (i = 0; i < move.length; i++) { // Buy new turrets.
			if (move[i] && move[i] !== this.towers[i] && move[i].cost <= logic.player.money) {
				logic.buildTower(logic.maze.turrets[i], move[i]);
//				console.log('Compré ' + move[i].nickName);
			}
		}
		/*
		console.log("Guita final: "+logic.player.money);

		console.log('ESTADO FINAL--->');
		console.log('logic.towers[0] = '+ (logic.towers[0] && logic.towers[0].constructor.nickName));
		console.log('logic.towers[1] = '+ (logic.towers[1] && logic.towers[1].constructor.nickName));
		console.log('logic.towers[2] = '+ (logic.towers[2] && logic.towers[2].constructor.nickName));
		console.log('<---ESTADO FINAL');
*/
		var future = new base.Future();
		logic.addEventListener(events.playerDefeated, function () {
			future.resolve(logic);
		});
		logic.addEventListener(events.waveDefeated, function () {
			future.resolve(logic);
		});
		logic.start();
		logic.beginWave();
		return future.then(function (logic) {
			logic.pause();
			return that.fromGameLogic(logic);
		});
	},

	toString: function toString(){
		return 'TowerDefense('+ this.money +','+ this.hp +','+ this.level +',['+
			this.towers.map(function (t) { return t ? t.nickName : '';}).join(',') +'])';
	}
}); // declare TowerDefense

/**
*/
var AIPlayer = exports.AIPlayer = declare({
	constructor: function AIPlayer(params) {
		params = params || {};
		this.name = params.name || 'AIPlayer';
		this.size = +params.size || 10;
		this.steps = +params.steps || 10;
		this.expansionRate = +params.expansionRate || 0.5;
		this.mutationRate = +params.mutationRate || 0.25;
	},
	
	/** The decision of the AI player is an optimization, represented by a subclass of 
	`inveniemus.Problem`.
	*/
	Problem: declare(inveniemus.Problem, {
		constructor: function AIPlayer$Problem(params) {
			params.objectives = +Infinity; // Maximization.
			inveniemus.Problem.call(this, params);
			this.game = params.game;
			this.towerTypes = base.iterable(types.towers).select(1).toArray();
			var range = { 
				min: 0, 
				max: this.towerTypes.length + 1, 
				discrete: true 
			};
			this.__elementModel__ = base.Iterable.repeat(range, this.game.def.towerPlaces.length).toArray();
		},
		
		mapping: function mapping(element) {
			var prob = this;
			return element.values.map(function (v) {
				return prob.towerTypes[v] || null;
			});
		},
		
		emblem: function emblem(element) {
			var move = this.mapping(element);
			return '['+ move.map(function (m) { 
				return m ? m.nickName : ''; 
			}).join('|') +']'; 
		},
		
		evaluation: function evaluation(element) {
			var p = this,
				move = this.mapping(element);
			return this.game.next(move).then(function (game2) {
				var r = game2.hp + game2.money / constants.mediPackCost;
				return r;
			});
		}
	}),
	
	/** Return the best move for the given `game` state.
	*/
	decision: function decision(game) {
		var problem = new this.Problem({ game: game }),
			ga = new inveniemus.metaheuristics.GeneticAlgorithm({ problem: problem, 
				size: this.size,
				steps: this.steps, 
				expansionRate: this.expansionRate,
				mutationRate: this.mutationRate
			});
		/** Every generation repeated elements are removed and replaced with random elements.
		*/
		ga.events.on('advanced', function () {
			for (ga.nub(); ga.state.length < ga.size; ) {
				ga.state.push(problem.newElement());
			}
			// console.log(problem.emblem(ga.state[0]) +' = '+ ga.state[0].evaluation);//FIXME
		});
		return ga.run().then(function (best) {
			return best.mapping();
		});
	},
	
	/** Play the `game` until the end.
	*/
	play: function play(game, callback) {
		var player = this;
		return base.Future.doWhile(function (g) {
			g = g || game;
			return player.decision(g).then(function (move) {
				// console.log('stateBefore: '+ g);
				// console.log('move:'+ move.map(function (f) { return f && f.nickName; }).join('|'));//FIXME
				return g.next(move).then(function (g2) {
					if (callback) {
						callback(g, move, g2);
					}
					// console.log('stateAfter: '+ g2);//FIXME
					return g2;
				});
			});
		}, function (g) {
			return !g.result();
		});
	}
}); // declare AIPlayer

/**TODO
*/

var scenarios = exports.scenarios = {

	/** Simple test game. 01
	*/
	Test01: new (TowerDefense.Definition)({
		mapWidth: 8,
		mapHeight: 8,
		creepPath: [
			[1,0], [1,1], [1,2], [1,3], [1,4], [2,4], [3,4], [3,5], [3,6], [4,6], [5,6], [5,5],
			[5,4], [5,3], [5,2], [5,1], [5,0]
		],
		towerPlaces: [
			[2,3], [4,5], [4,3], [2,1], [2,5]
		],
		waves: [
			[10, [[1, "Mario"], [400, "Mario"], [1000, "Rope"], [1200, "Rope"]]],

			[12, [[1, "Mario"], [350, "Rope"],
				  [850, "Mario"], [1100, "Mario"],
				  [1800, "Rope"], [2500, "Rope"]]],

			[16, [[1, "Mario"], [350, "Rope"], [500, "FireWizzrobe"],
				  [1000, "Rope"], [1500, "FireWizzrobe"]]],

			[20, [[1, "Speedy"], [200, "FireWizzrobe"], [500, "Rope"],
				  [600, "FireWizzrobe"], [900, "FireWizzrobe"],
				  [1300, "FireWizzrobe"], [2800, "DarkNut"]]],

			[22, [[1, "FireWizzrobe"], [600, "Rope"],
				  [1500, "FireWizzrobe"], [2000, "Rope"],
				  [2800, "FireWizzrobe"], [3700, "DarkNut"], [4500, "DarkNut"],
				  [6000, "FireWizzrobe"]]],

		  	[25, [[1, "DarkNut"], [500, "FireWizzrobe"], [1000, "FireWizzrobe"],
				  [1600, "FireWizzrobe"], [2500, "DarkNut"], [3000, "DarkNut"],
				  [4000, "FireWizzrobe"]]],

			[25, [[1, "DarkNut"], [600, "FireWizzrobe"], [1000, "DarkNut"],
				  [2200, "Rope"], [2500, "Rope"], [2600, "Rope"],
				  [4000, "FireWizzrobe"], [4900, "FireWizzrobe"], [6000, "Armos"]]],

			[30, [[1, "DarkNut"], [1000, "DarkNut"],
				  [2200, "FireWizzrobe"], [2800, "FireWizzrobe"],
				  [4000, "Armos"], [5000, "DarkNut"], [5400, "FireWizzrobe"], [6000, "FireWizzrobe"]]],

			[50, [[1, "Armos"], [1000, "Rope"], [1400, "Rope"],
				  [3000, "Armos"], [4800, "FireWizzrobe"], [5100, "FireWizzrobe"],
				  [6000, "Armos"], [7100, "DarkNut"], [7800, "DarkNut"],
				  [8500, "Armos"], [10000, "Armos"]]],

			[25, [[1, "Armos"],[1000, "Armos"],[2000, "Armos"],[3000, "Armos"],[4000, "Armos"],[5000, "Armos"]]]
		],
		startMoney: 25,
		startHP: 10
	}), // Test01


	/** Simple test game. 02
	*/
	Test02: new (TowerDefense.Definition)({
		mapWidth: 8,
		mapHeight: 8,
		creepPath: [
			[0,4], [1,4], [2,4], [2,5], [2,6], [3,6], [4,6], [4,5], [4,4], [4,3], [4,2], [5,2],
			[6,2], [7,2]
		],
		towerPlaces: [
			[3,4], [1,5], [5,3]
		],
		waves: [

			[10, [[1, "Mario"], [400, "Mario"], [1000, "Rope"], [1200, "Rope"]]],

			[12, [[1, "Mario"], [350, "Rope"],
				  [850, "Mario"], [1100, "Mario"],
				  [1800, "Rope"], [2500, "Rope"]]],

			[16, [[1, "Mario"], [350, "Rope"], [500, "FireWizzrobe"],
				  [800, "FireWizzrobe"], [1000, "Rope"], [1500, "FireWizzrobe"]]],

			[20, [[1, "Speedy"], [200, "FireWizzrobe"], [500, "Rope"], [550, "Rope"],
				  [600, "FireWizzrobe"], [680, "Rope"], [900, "FireWizzrobe"],
				  [1300, "FireWizzrobe"], [2800, "DarkNut"]]],

			[22, [[1, "FireWizzrobe"], [500, "Rope"], [550, "Rope"],
				  [1000, "FireWizzrobe"], [1200, "Rope"], [1350, "Rope"],
				  [1600, "FireWizzrobe"], [2500, "DarkNut"], [3000, "DarkNut"],
				  [4000, "FireWizzrobe"], [4200, "FireWizzrobe"]]],

		  	[25, [[1, "DarkNut"], [500, "FireWizzrobe"], [1000, "FireWizzrobe"], [1200, "DarkNut"],
				  [1600, "FireWizzrobe"], [2500, "DarkNut"], [3000, "DarkNut"],
				  [4000, "FireWizzrobe"], [4200, "DarkNut"]]],

			[20, [[1, "DarkNut"], [250, "FireWizzrobe"], [600, "FireWizzrobe"], [1000, "DarkNut"],
				  [2200, "Rope"], [2300, "Rope"], [2400, "Rope"], [2500, "Rope"], [2600, "Rope"],
				  [4000, "FireWizzrobe"], [4200, "DarkNut"], [4400, "FireWizzrobe"], [6000, "Armos"]]],

			[25, [[1, "DarkNut"], [250, "DarkNut"], [600, "DarkNut"], [1000, "DarkNut"],
				  [2200, "FireWizzrobe"], [2300, "FireWizzrobe"], [2400, "Rope"], [2500, "Rope"], [2600, "FireWizzrobe"],
				  [4000, "Armos"], [5000, "DarkNut"], [5400, "FireWizzrobe"], [6000, "FireWizzrobe"], [8000, "Armos"]]],

			[30, [[1, "Armos"], [1000, "Rope"], [1300, "Rope"], [1400, "Rope"],
				  [3000, "Armos"], [3100, "FireWizzrobe"], [3300, "FireWizzrobe"], [3400, "FireWizzrobe"],
				  [5000, "Armos"], [5100, "DarkNut"], [5300, "DarkNut"], [5400, "DarkNut"],
				  [6500, "Armos"], [7000, "Armos"]]],

			[25, [[1, "Armos"],[1000, "Armos"],[2000, "Armos"],[3000, "Armos"],[4000, "Armos"],[5000, "Armos"]]]
		],
		startMoney: 15,
		startHP: 10
	}), // Test02


	/** Simple test game. 03
	*/
	Test03: new (TowerDefense.Definition)({
		mapWidth: 8,
		mapHeight: 8,
		creepPath: [
			//[1,0], [1,1], [1,2], [2,2], [3,2], [3,3], [3,4], [3,5], [4,5], [5,5], [6,5], [7,5]
			[0,4], [1,4], [2,4], [3,4], [4,4], [4,3], [4,2], [5,2], [6,2], [7,2]
		],
		towerPlaces: [
			//[2,3], [4,4], [2,1], [5,6]
			[2,3], [4,5], [5,3], [2,5]
		],
		waves: [
			[8, [[1, "Mario"], [700, "Mario"], [1800, "Rope"], [2800, "Rope"], [4000, "DarkNut"]]],

			[8, [[1, "Mario"], [350, "Mario"], [700, "Mario"],
				  [1800, "Rope"], [2300, "Rope"], [2800, "Rope"],
				  [3800, "FireWizzrobe"], [5000, "DarkNut"]]],

			[9, [[1, "Mario"], [350, "Rope"],  [400, "Mario"], [600, "Rope"],
				  [800, "Rope"], [1000, "Rope"], [1500, "FireWizzrobe"]]],

			[12, [[1, "FireWizzrobe"], [450, "Rope"],
				  [600, "FireWizzrobe"], [900, "FireWizzrobe"], [1200, "FireWizzrobe"]]],

			[15, [[1, "FireWizzrobe"], [500, "Rope"], [550, "Rope"],
				  [600, "Rope"], [650, "Rope"], [700, "Rope"],
				  [1600, "FireWizzrobe"], [4000, "FireWizzrobe"], [4200, "FireWizzrobe"]]],

		  	[20, [[1, "DarkNut"], [500, "FireWizzrobe"], [1000, "FireWizzrobe"], [1200, "DarkNut"],
				  [1600, "FireWizzrobe"], [2500, "DarkNut"], [3000, "DarkNut"],
				  [4000, "FireWizzrobe"], [4200, "DarkNut"]]],

			[20, [[1, "DarkNut"], [250, "FireWizzrobe"], [600, "FireWizzrobe"], [1000, "DarkNut"],
				  [2200, "Rope"], [2300, "Rope"], [2400, "Rope"], [2500, "Rope"], [2600, "Rope"],
				  [4000, "FireWizzrobe"], [4200, "DarkNut"], [4400, "FireWizzrobe"], [6000, "Armos"]]],

			[25, [[1, "DarkNut"], [250, "DarkNut"], [600, "DarkNut"], [1000, "DarkNut"],
				  [2200, "FireWizzrobe"], [2300, "FireWizzrobe"], [2400, "Rope"], [2500, "Rope"], [2600, "FireWizzrobe"],
				  [4000, "Armos"], [5000, "DarkNut"], [5400, "FireWizzrobe"], [6000, "FireWizzrobe"], [8000, "Armos"]]],

			[30, [[1, "Armos"], [1000, "Rope"], [1300, "Rope"], [1400, "Rope"],
				  [3000, "Armos"], [3100, "FireWizzrobe"], [3300, "FireWizzrobe"], [3400, "FireWizzrobe"],
				  [5000, "Armos"], [5100, "DarkNut"], [5300, "DarkNut"], [5400, "DarkNut"],
				  [6500, "Armos"], [7000, "Armos"]]],

			[25, [[1, "Armos"],[1000, "Armos"],[2000, "Armos"],[3000, "Armos"],[4000, "Armos"],[5000, "Armos"]]]
		],
		startMoney: 14,
		startHP: 10
	}) // Test03 y 04
	
}; // scenarios

/** See __prologue__.js
*/
	return exports;
});
//# sourceMappingURL=ludorum-towerdefense.js.map