/**	
*/
"use strict";
require('source-map-support').install();

/** Setting up the Capataz server.
*/
var path = require('path'),
	base = require('creatartis-base'),
	capataz = require('capataz'),
	//ludorum_towerdefense = require('./lib/ludorum-towerdefense'),
	
	server = capataz.Capataz.run({
		port: 80,
		workerCount: 4,
		desiredEvaluationTime: 30000, // 30 seconds.
		customFiles: path.dirname(module.filename) + '/lib',
		logFile: base.Text.formatDate(null, '"./tests/logs/simulation-"yyyymmdd-hhnnss".txt"'),
		maxDelay: 10000,
		maxRetries: 1000
	});
	
// ## Jobs #########################################################################################

var jobFunction = function (ludorum_towerdefense, scenario, size, steps) {
	var g0 = ludorum_towerdefense.scenarios[scenario].game(),
		ai = new ludorum_towerdefense.AIPlayer({ size: size, steps: steps }),
		r = {
			scenario: scenario,
			'money@0': g0.money,
			'hp@0': g0.hp
		};
	return ai.play(g0, function (gameFrom, move, gameTo) {
		r['money@'+ gameTo.level] = gameTo.money;
		r['hp@'+ gameTo.level] = gameTo.hp;
	}).then(function (gf) {
		r.reached = gf.level;
		r.result = gf.result();
		return r;
	});
}

// ## Main #########################################################################################
	
var SCENARIOS = ['Test01', 'Test02', 'Test03'],
	MATCH_COUNT = 200,
	AI_SIZE = 10,
	AI_STEPS = 5,
	STATS = new base.Statistics();
	
base.Future.all(
	base.Iterable.range(MATCH_COUNT).product(SCENARIOS).mapApply(function (i, scenario) {
		return server.schedule({
			info: scenario +' #'+ i,
			fun: jobFunction,
			imports: ['ludorum-towerdefense'],
			args: [scenario, AI_SIZE, AI_STEPS]
		}).then(function (data) {
			var reached = data.reached;
			STATS.add({ key: 'reached', scenario: data.scenario }, reached);
			STATS.add({ key: 'result', scenario: data.scenario }, data.result);
			if (reached < 11) {
				STATS.add({ key: 'defeats', scenario: data.scenario, level: reached}, data['money@'+ reached]);
			} else {
				STATS.add({ key: 'victories', scenario: data.scenario});
			}
			for (var i = 0; i <= reached; i++) {
				STATS.add({ key: 'money', scenario: data.scenario, level: i }, data['money@'+ i]);
				STATS.add({ key: 'hp', scenario: data.scenario, level: i }, data['hp@'+ i]);
			}
		});
	})
).then(function () {
	server.logger.info("Results:\n"+ STATS);
	server.logger.info("Finished. Stopping server.");
	//setTimeout(process.exit, 10);
}, function (error) {
	server.logger.error(error +'');
	//setTimeout(process.exit, 10);
});
// fin