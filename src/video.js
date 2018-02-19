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

	loadImages: function loadImages(resources, progress) {
		var loadedCount = 0,
			totalCount = Object.keys(resources).length;
		return Promise.all(base.iterable(resources).mapApply(function (id, path) {
			return new Promise(function (resolve, reject) {
				var img = new Image();
				img.addEventListener('error', function () {
					reject(new Error('Loading image '+ id +' ('+ path +') failed!'));
				}, false);
				img.addEventListener('load', function () {
					loadedCount++;
					if (progress) {
						progress({
							name: 'images',
							recent: id,
							total: totalCount,
							progress: loadedCount / totalCount
						});
					}
					resolve([id, img]);
				}, false);
				img.src = path;
			});
		}).toArray()).then(function (imgs) {
			return base.iterable(imgs).toObject();
		});
	},

	loadSounds: function loadSounds(resources, progress) {
		var loadedCount = 0,
			totalCount = Object.keys(resources).length;
		return Promise.all(base.iterable(resources).mapApply(function (id, path) {
			return new Promise(function (resolve, reject) {
				var sound = new Audio();
				sound.addEventListener('error', function() {
					reject(new Error('Loading sound '+ id +' ('+ path +') failed!'));
				}, false);
				sound.addEventListener('loadedmetadata', function() {
					loadedCount++;
					if (progress) {
						progress({
							name: 'sounds',
							recent: id,
							total: totalCount,
							progress: loadedCount / totalCount
						});
					}
					resolve([id, sound]);
				}, false);
				
				if (sound.canPlayType('audio/ogg').replace(/^no$/, '') && path.ogg) {
					sound.src = path.ogg;
				} else if (sound.canPlayType('audio/mpeg').replace(/^no$/, '') && path.mp3) {
					sound.src = path.mp3;
				} else {
					reject(new Error('Browser does not support the available audio types!'));
				}
			});
		}).toArray()).then(function (imgs) {
			return base.iterable(imgs).toObject();
		});
	},

	loadResources: function(images, sounds, progress) {
		var view = this;
		console.log("Loading resources...");//FIXME
		return view.loadImages(images, progress).then(function (loadedImages) {
			console.log("Loaded images...");//FIXME
			view.images = loadedImages;
			return view.loadSounds(sounds, progress).then(function (loadedSounds) {
				console.log("Loaded sounds.");//FIXME
				view.sounds = loadedSounds;
			});
		});
	}
});