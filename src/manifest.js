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

