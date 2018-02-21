/* jshint esversion:6 */
document.addEventListener('DOMContentLoaded', function () {
	"use strict";
	var APP = window.APP = {
		visual: true,
		ELEMS: {
			canvas: document.querySelector("#game"),
			towerPanel: document.querySelector("#towers"),
			moneyInfo: document.querySelector("#money-info"),
			levelInfo: document.querySelector("#level-info"),
			healthInfo: document.querySelector("#health-info"),
			timeInfo: document.querySelector("#time-info"),
			soundInfo: document.querySelector("#sound-info"),
			startWaveButton: document.querySelector("#startWave"),
			nextwave: document.querySelector("#nextWave"),
			mario: document.querySelector("#Mario-info"),
			rope: document.querySelector("#Rope-info"),
			firewizzrobe: document.querySelector("#FireWizzrobe-info"),
			darknut: document.querySelector("#DarkNut-info"),
			speedy: document.querySelector("#Speedy-info"),
			armo: document.querySelector("#Armos-info"),
			waitMessage: document.querySelector("#wait-message")
		}
	}

	function main(user) { /////////////////////////////////////////////////////////////////////////
		console.log('Loading libraries using RequireJS ...');
		return new Promise(function (resolve, reject) {
			require.config({ 'baseUrl': '/js/' });
			require(['creatartis-base', 'sermat', 'inveniemus', 'ludorum-towerdefense'],
				function (base, Sermat, inveniemus, ludorum_towerdefense) {
					var global = base.global;
					global.base = base;
					global.Sermat = Sermat;
					global.inveniemus = inveniemus;
					global.ludorum_towerdefense = ludorum_towerdefense;
					console.log('Loaded: base, Sermat, inveniemus, ludorum_towerdefense.');

					//BEGIN Old code //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
					function startGame() {
						var first = !APP.logic,
							stage = 0;
						while (stage !== 1 && stage !== 2 && stage !== 3) {
							stage = +prompt("Ingrese el número del escenario", "1");
						}
						APP.stage = APP.STAGES[stage - 1];
						APP.logic = APP.stage.game().__logic__(APP.visual ? APP.view
							: new ludorum_towerdefense.View(canvas.width, canvas.height)
						);
						APP.nivelActual = 1;
						APP.record = {
							date: Date.now(),
							user: window.USER,
							game: APP.logic.gameId,
							levels: []
						};
						if (first) {
							addTowers();
							addHandlers();
						}
						startWaveButton.disabled = false;
						APP.logic.triggerEvent(events.moneyChanged, APP.logic.player);
						APP.logic.triggerEvent(events.healthChanged, APP.logic.player);
						addUnitInfo();
						APP.logic.start();
					}

					function EndGame(level, player) {
						EndWave(level, player);
						firebase.database().ref("matches/towerdefense").push(APP.record);
						//TODO APP.STAGES.push(APP.STAGES.shift());
						//TODO startGame();

					}

					function EndWave(level, player) {
						var towers = APP.logic.towers.map(function (tower) {
							return {
								x: tower.mazeCoordinates.x,
								y: tower.mazeCoordinates.y,
								sprite: tower.constructor.sprite
							};
						});
						APP.record.levels.push({
							level: level,
							hitpoints: player.hitpoints,
							money: player.money,
							towers: towers
						});
					}

					var constants = ludorum_towerdefense.constants,
						events = ludorum_towerdefense.events,
						resources = ludorum_towerdefense.resources,
						CanvasView = ludorum_towerdefense.CanvasView,
						types = ludorum_towerdefense.types,
						Sound = ludorum_towerdefense.Sound,
						TowerDefense = ludorum_towerdefense.TowerDefense;
					//var stagePrompt = prompt("Ingrese el número del escenario", "1");
					var towerButtons = [];
					var towerType = undefined;
					//FIXME
					var canvas = document.querySelector("#game");
					var towerPanel = document.querySelector("#towers");
					var moneyInfo = document.querySelector("#money-info");
					var levelInfo = document.querySelector("#level-info");
					var healthInfo = document.querySelector("#health-info");
					var timeInfo = document.querySelector("#time-info");
					var soundInfo = document.querySelector("#sound-info");
					var startWaveButton = document.querySelector("#startWave");
					var nextwave = document.querySelector("#nextWave");
					var mario = document.querySelector("#Mario-info");
					var rope = document.querySelector("#Rope-info");
					var firewizzrobe = document.querySelector("#FireWizzrobe-info");
					var darknut = document.querySelector("#DarkNut-info");
					var speedy = document.querySelector("#Speedy-info");
					var armo = document.querySelector("#Armos-info");

					var addHandlers = function () {
						var timeInfo = document.querySelector("#time-info"),
							moneyInfo = document.querySelector("#money-info"),
							levelInfo = document.querySelector("#level-info"),
							healthInfo = document.querySelector("#health-info"),
							startWaveButton = document.querySelector("#startWave");
						function getMousePosition(evt) {
							var rect = canvas.getBoundingClientRect();
							return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
						}

						APP.logic.addEventListener(events.waveFinished, function () {
							timeInfo.textContent = "Ya salieron todas!";
						});
						APP.logic.addEventListener(events.waveDefeated, function (player) {
							EndWave(APP.nivelActual, player);
							if (APP.nivelActual == APP.logic.waves.waves.length) {
								window.alert("¡FELICITACIONES! ¡GANASTE!");
								EndGame(APP.nivelActual, player);
							} else {
								APP.nivelActual += 1;
								levelInfo.textContent = APP.nivelActual;
							}
							addUnitInfo();
							timeInfo.textContent = "Preparate para el nivel " + APP.nivelActual;
							startWaveButton.disabled = false;
						});
						APP.logic.addEventListener(events.playerDefeated, function (player) {
							window.alert("Perdiste");
							EndGame(APP.nivelActual, player);
							timeInfo.textContent = "Game over ...";
						});
						APP.logic.addEventListener(events.waveCreated, function (wave) {
							timeInfo.textContent = "Faltan salir" + wave.units.length + " unidades";
							startWaveButton.disabled = true;
						});
						APP.logic.addEventListener(events.unitSpawned, function (remaining) {
							timeInfo.textContent = remaining + " unidades";
						});
						APP.logic.addEventListener(events.moneyChanged, function (player) {
							moneyInfo.textContent = player.money;
						});
						APP.logic.addEventListener(events.healthChanged, function (player) {
							healthInfo.textContent = player.hitpoints;
						});
						startWaveButton.addEventListener(events.click, function () {
							APP.logic.beginWave();
						});
						soundInfo.addEventListener(events.click, function () {
							var status = this.classList.contains("on");
							this.classList.remove(status ? 'on' : 'off');
							this.classList.add(status ? 'off' : 'on');
							Sound.setVolume(status ? 0 : 1);
						});
						canvas.addEventListener(events.click, function (evt) {
							var mousePos = getMousePosition(evt);
							var pos = APP.logic.transformCoordinates(mousePos.x, mousePos.y);
							evt.preventDefault();
							if (towerType) {
								APP.logic.buildTower(pos, towerType);
							} else {
								APP.logic.destroyTower(pos);
							}
						});
						canvas.addEventListener(events.contextmenu, function (evt) {
							var mousePos = getMousePosition(evt);
							var pos = APP.logic.transformCoordinates(mousePos.x, mousePos.y);
							evt.preventDefault();
							APP.logic.destroyTower(pos);
						});
						canvas.addEventListener(events.mouseover, function (evt) {
							APP.view.showGrid = true;
						});
						canvas.addEventListener(events.mouseout, function (evt) {
							APP.view.showGrid = false;
						});
					};

					var addTower = function (tower) {
						var img = APP.view.images[tower.sprite];

						var div = document.createElement("div");
						div.innerHTML = ['<div class=preview><div style="background: url(', img.src,
							") no-repeat; width: ", ~~(img.naturalWidth / tower.frames), "px; height: ",
							img.naturalHeight, 'px" class="preview-image"></div></div>',
							"<div class=title>", tower.nickName, "</div><div class=info>",
							"<div class=description>", tower.description, "</div>",
							"<div class=speed>", tower.speed, "</div>",
							"<div class=damage>", tower.shotType.damage, "</div>",
							"<div class=range>", tower.range, "</div>",
							"<div class=cost>", tower.cost, "</div></div>"
						].join("");
						towerButtons.push(div);
						div.addEventListener(events.click, function () {
							towerType = tower;

							for (var i = towerButtons.length; i--;)
								towerButtons[i].classList.remove("selected-tower");

							this.classList.add("selected-tower");
						});
						towerPanel.appendChild(div);
					};
					var addTowers = function () {
						for (var key in types.towers) {
							addTower(types.towers[key]);
						}
					};
					var addUnitInfo = function () {
						var level = APP.nivelActual;
						levelInfo.textContent = level;
						if (level < APP.logic.waves.waves.length) {
							var unitCounts = {
								Mario: 0, Rope: 0, FireWizzrobe: 0, DarkNut: 0,
								Speedy: 0, Armos: 0
							};
							APP.logic.waves.waves[level - 1].units.forEach(function (u) {
								unitCounts[u.unit]++;
							});

							document.querySelector('#nextWave p').innerHTML = 'Level ' + level;
							base.iterable(unitCounts).forEachApply(function (unit, count) {
								document.querySelector('#' + unit + '-info .title').innerHTML = count;
							});
						}
					};

					APP.view = new CanvasView(APP.ELEMS.canvas);
					/*TODO APP.STAGES = base.Randomness.shuffle([
							ludorum_towerdefense.scenarios.Test01,
							ludorum_towerdefense.scenarios.Test02,
							ludorum_towerdefense.scenarios.Test03
						]);*/
					APP.STAGES = [
						ludorum_towerdefense.scenarios.Test01,
						ludorum_towerdefense.scenarios.Test02,
						ludorum_towerdefense.scenarios.Test03
					];
					APP.view.loadResources(
						{ // Images
							background: "assets/background.png",
							airshot: "assets/sprites/airshot.png",
							airwolf: "assets/sprites/AirWolf.png",
							armos: "assets/sprites/Armos.png",
							canontower: "assets/sprites/canontower.png",
							darknut: "assets/sprites/DarkNut.png",
							firewizzrobe: "assets/sprites/FireWizzrobe.png",
							flak: "assets/sprites/flak.png",
							flameshot: "assets/sprites/flameshot.png",
							flametower: "assets/sprites/flametower.png",
							gatetohell: "assets/sprites/gatetohell.png",
							hellshot: "assets/sprites/hellshot.png",
							iceshot: "assets/sprites/iceshot.png",
							icetower: "assets/sprites/icetower.png",
							lasershot: "assets/sprites/lasershot.png",
							lasertower: "assets/sprites/lasertower.png",
							mgnest: "assets/sprites/mgnest.png",
							mgshot: "assets/sprites/mgshot.png",
							newunit: "assets/sprites/newUnit.png",
							rock: "assets/sprites/rock.png",
							rope: "assets/sprites/rope.png",
							shellshot: "assets/sprites/shellshot.png",
							suns: "assets/sprites/suns.png",
							sunshot: "assets/sprites/sunshot.png",
							mario: "assets/sprites/mario.png"
						},
						{ // Sounds
							"ak47-1": { ogg: "assets/effects/ak47-1.ogg", mp3: "assets/effects/ak47-1.mp3" },
							artillery: { ogg: "assets/effects/artillery.ogg", mp3: "assets/effects/artillery.mp3" },
							explosion: { ogg: "assets/effects/explosion.ogg", mp3: "assets/effects/explosion.mp3" },
							flak: { ogg: "assets/effects/flak.ogg", mp3: "assets/effects/flak.mp3" },
							flames: { ogg: "assets/effects/flames.ogg", mp3: "assets/effects/flames.mp3" },
							hellshot: { ogg: "assets/effects/hellshot.ogg", mp3: "assets/effects/hellshot.mp3" },
							humm: { ogg: "assets/effects/humm.ogg", mp3: "assets/effects/humm.mp3" },
							icy: { ogg: "assets/effects/icy.ogg", mp3: "assets/effects/icy.mp3" },
							laser: { ogg: "assets/effects/laser.ogg", mp3: "assets/effects/laser.mp3" },
							laugh: { ogg: "assets/effects/laugh.ogg", mp3: "assets/effects/laugh.mp3" },
							mgnest: { ogg: "assets/effects/mgnest.ogg", mp3: "assets/effects/mgnest.mp3" },
							wowpulse: { ogg: "assets/effects/wowpulse.ogg", mp3: "assets/effects/wowpulse.mp3" }
						},
						function progress(e) {
							APP.ELEMS.waitMessage.textContent = "Loading (" + e.name + ", " +
								~~(e.progress * 100) + "%)";
						}
					).then(function completed(e) {
						APP.view.background = APP.view.images["background"];
						APP.view.showGrid = false;
						document.querySelector("#frame").classList.remove("hidden");
						document.querySelector("#wait").classList.add("hidden");
						startGame();
					});
					//END Old code ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

					console.log('Ready.');
					resolve(null);
				}, function (err) {
					console.error(err);
					reject(err);
				}); // require
		});
	}

	// Firebase initialization ////////////////////////////////////////////////////////////////////
	try {
		var app = window.FIREBASE_APP = firebase.app();
		firebase.auth().getRedirectResult().then(function (result) {
			if (result.credential) {
				window.USER = result.user.email;
				return main();
			} else { // User is not logged.
				APP.ELEMS.waitMessage.innerHTML = "Checking user's login...";
				var provider = new firebase.auth.GoogleAuthProvider(),
					auth = firebase.auth();
				auth.useDeviceLanguage();
				auth.signInWithRedirect(provider);
			}
		}).catch(function (err) {
			console.log(err);
			APP.ELEMS.waitMessage.innerHTML = "User authentication failed!";
		});
	} catch (err) {
		console.error(err);
		APP.ELEMS.waitMessage.innerHTML = "Application initialization failed!";
	}
}); // 'DOMContentLoaded'