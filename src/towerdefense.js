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