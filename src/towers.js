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