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