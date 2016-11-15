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