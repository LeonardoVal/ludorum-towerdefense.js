/** # Scenario evolution

Since defining a scenarios manually proved to be quite difficult, this is an attempt at finding them
automatically.
*/
"use strict";
require('source-map-support').install();

/** Setting up the Capataz server.
*/
var path = require('path'),
	base = require('creatartis-base'),
	Sermat = require('sermat'),
	ludorum = require('ludorum'),
	inveniemus = require('inveniemus'),
	capataz = require('capataz'),
	ludorum_towerdefense = require('./lib/ludorum-towerdefense'),
	
	Future = base.Future,
	Iterable = base.Iterable,
	iterable = base.iterable,
	
	server = capataz.Capataz.run({
		port: 80,
		workerCount: 3,
		desiredEvaluationTime: 10000, // 10 seconds.
		customFiles: path.dirname(module.filename) + '/lib',
		logFile: base.Text.formatDate(null, '"./tests/logs/scenario-evolution-"yyyymmdd-hhnnss".txt"')
	});

// ## Scenario test. ###############################################################################

var ScenarioProblem = base.declare(inveniemus.Problem, {
	constructor: function ScenarioProblem(params) {
		params = params || {};
		inveniemus.Problem.call(this, params);
		/** Problem parameters:
			+ `definition`: A `TowerDefense.Definition` instance defining the game. Only the `waves`' 
			creeps will be modified.
		*/
		this.definition = params.definition;
		/** + `creepTypes`: An array of names of creeps to use by the waves.
		*/
		this.creepTypes = params.creepTypes || 
			['Mario', 'Rope', 'FireWizzrobe', 'AirWolf', 'DarkNut', 'Speedy', 'Armos'];
		/** + `maxCreeps`: Maximum amount of creeps per wave.
		*/
		this.maxCreeps = +params.maxCreeps || 40; // 40 creeps per wave at most by default.
		/** + `maxTime`: Maximum time for the creeps to spawn in a wave.
		*/
		this.maxTime = +params.maxTime || 10000; // 10 seconds at most by default.
		/** + `matchCount`: Amount of matches performed to evaluate a scenario.
		*/
		this.matchCount = +params.matchCount || 35;
		/** + `playerParams`: Parameters for the `AIPlayer` used to play the scenarios.
		*/
		this.playerParams = params.playerParams || { size: 20, steps: 5 };
		
		/** Element model.
		*/
		this.__elementModel__ = Iterable.repeat({ min: 0, max: 1-1e-9, discrete: false }, 
			this.maxCreeps * this.definition.waves.length).toArray();
	},
	
	/** Every territory in the map uses two values of the element. The first one is the index of the
	territory. The second one defines the army count. All values are in the [0,1) range.
	*/
	mapping: function mapping(element) {
		var problem = this,
			values = element.values,
			waves = this.definition.waves.map(function (wave) {
				return [wave[0], []];
			}),
			currentWave = 0,
			currentTime = 1,
			time, creep;
		for (var i = 0, len = values.length; i < len; i += 2) {
			creep = this.creepTypes[Math.floor(values[i] * this.creepTypes.length)];
			time = Math.round(values[i] * this.maxTime);
			waves[currentWave][1].push([currentTime, creep]); 
			currentTime += time;
			if (currentTime > this.maxTime) {
				currentTime = 1;
				currentWave++;
				if (currentWave >= waves.length) {
					break;
				}
			}
		}
		return waves;
	},
	
	evaluate: function evaluate(elements, reevaluate) {
		return inveniemus.Problem.prototype.evaluate(elements, true);
	},
	
	/** The evaluation of an scenario is the average level reached in AI plays.
	*/
	evaluation: function evaluation(element) {
		var problem = this,
			jobFunction = function (ludorum_towerdefense, scenario, playerParams) {
				var def = new ludorum_towerdefense.TowerDefense.Definition(scenario),
					g0 = def.game(),
					ai = new ludorum_towerdefense.AIPlayer(playerParams);
				return ai.play(g0).then(function (gf) {
					return gf.level;
				});
			},
			def = {
				mapWidth: this.definition.mapWidth,
				mapHeight: this.definition.mapWidth,
				creepPath: this.definition.creepPath,
				towerPlaces: this.definition.towerPlaces,
				startMoney: this.definition.startMoney,
				startHP: this.definition.startHP,
				waves: this.mapping(element)
			},
			emblem = JSON.stringify(def.waves);
		
		return Future.all(Iterable.range(this.matchCount).map(function (i) {
			return server.schedule({
				info: emblem +' #'+ i,
				fun: jobFunction,
				imports: ['ludorum-towerdefense'],
				args: [def, problem.playerParams]
			});
		})).then(function (levelsReached) {
			return iterable(levelsReached).sum() / levelsReached.length; // Average level reached.
		});
	}
}); // declare ScenarioProblem
	
// ## Main #########################################################################################

(function main() {
	var baseScenario = ludorum_towerdefense.scenarios.Test02,
		problem = new ScenarioProblem({
			objectives: baseScenario.waves.length / 2,
			definition: baseScenario,
			creepTypes: ['Mario', 'Rope', 'FireWizzrobe', 'AirWolf', 'DarkNut', 'Speedy', 'Armos'],
			maxCreeps: 5,
			maxTime: 5000,
			matchCount: 3,
			playerParams: { size: 10, steps: 5 }
		}),
		mh = new inveniemus.metaheuristics.GeneticAlgorithm({ 
			problem: problem, expansionRate: 0.75, size: 20, steps: 3 
		});
	mh.events.on('advanced', function () {
		var evalStat = mh.statistics.stat({ key:'evaluation', step: mh.step }),
			best = mh.state[0].mapping();
		server.logger.info("Advanced to step #"+ mh.step +". Evaluations "+ 
			evalStat.minimum() +" < "+ evalStat.average() +" < "+ evalStat.maximum() +
			". Best so far:\n"+ JSON.stringify(best) +"\n"
		);
	});
	mh.run().then(function () {
		server.logger.info("Finished. Stopping server.");
		setTimeout(process.exit, 10);
	}, function (error) {
		server.logger.error(error +'');
		setTimeout(process.exit, 10);
	});
})(); // main