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