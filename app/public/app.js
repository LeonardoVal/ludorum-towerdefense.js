(function() {
	"use strict";

	var constants = ludorum_towerdefense.constants,
		events = ludorum_towerdefense.events,
		resources = ludorum_towerdefense.resources,
		Class = ludorum_towerdefense.Class,
		PathFinderNodeType = ludorum_towerdefense.PathFinderNodeType,
		MazeStrategy = ludorum_towerdefense.MazeStrategy,
		Direction = ludorum_towerdefense.Direction,
		Steps = ludorum_towerdefense.Steps,
		Point = ludorum_towerdefense.Point,
		Size = ludorum_towerdefense.Size,
		PathFinderNode = ludorum_towerdefense.PathFinderNode,
		PriorityQueue = ludorum_towerdefense.PriorityQueue,
		Maze = ludorum_towerdefense.Maze,
		PathFinder = ludorum_towerdefense.PathFinder,
		Wave = ludorum_towerdefense.Wave,
		CanvasView = ludorum_towerdefense.CanvasView,
		GameLogic = ludorum_towerdefense.GameLogic,
		WaveList = ludorum_towerdefense.WaveList,
		Loader = ludorum_towerdefense.Loader,
		ImageLoader = ludorum_towerdefense.ImageLoader,
		images = ludorum_towerdefense.images,
		SoundLoader = ludorum_towerdefense.SoundLoader,
		sounds = ludorum_towerdefense.sounds,
		types = ludorum_towerdefense.types,
		Sound = ludorum_towerdefense.Sound,
		TowerDefense = ludorum_towerdefense.TowerDefense
		;
	var scenarioPrompt = prompt("Ingrese el número del escenario", "1");
	var resources = {
		images : [
			{ name : 'background', value : 'Content/background.png' },
			{ name : 'airshot', value : 'Content/sprites/airshot.png' },
			{ name : 'airwolf', value : 'Content/sprites/AirWolf.png' },
			{ name : 'armos', value : 'Content/sprites/Armos.png' },
			{ name : 'canontower', value : 'Content/sprites/canontower.png' },
			{ name : 'darknut', value : 'Content/sprites/DarkNut.png' },
			{ name : 'firewizzrobe', value : 'Content/sprites/FireWizzrobe.png' },
			{ name : 'flak', value : 'Content/sprites/flak.png' },
			{ name : 'flameshot', value : 'Content/sprites/flameshot.png' },
			{ name : 'flametower', value : 'Content/sprites/flametower.png' },
			{ name : 'gatetohell', value : 'Content/sprites/gatetohell.png' },
			{ name : 'hellshot', value : 'Content/sprites/hellshot.png' },
			{ name : 'iceshot', value : 'Content/sprites/iceshot.png' },
			{ name : 'icetower', value : 'Content/sprites/icetower.png' },
			{ name : 'lasershot', value : 'Content/sprites/lasershot.png' },
			{ name : 'lasertower', value : 'Content/sprites/lasertower.png' },
			{ name : 'mgnest', value : 'Content/sprites/mgnest.png' },
			{ name : 'mgshot', value : 'Content/sprites/mgshot.png' },
			{ name : 'newunit', value : 'Content/sprites/newUnit.png' },
			{ name : 'rock', value : 'Content/sprites/rock.png' },
			{ name : 'rope', value : 'Content/sprites/rope.png' },
			{ name : 'shellshot', value : 'Content/sprites/shellshot.png' },
			{ name : 'suns', value : 'Content/sprites/suns.png' },
			{ name : 'sunshot', value : 'Content/sprites/sunshot.png' },
			{ name : 'mario', value : 'Content/sprites/mario.png' },
		],
		sounds : [
			//{ name : 'hold_the_line', value : { ogg : 'Content/music/hold_the_line.ogg', mp3 : 'Content/music/hold_the_line.mp3' }},
			{ name : 'burn_them_down', value : { ogg : 'Content/music/burn_them_down.ogg', mp3 : 'Content/music/burn_them_down.mp3' }},
			{ name : 'ak47-1', value : { ogg : 'Content/effects/ak47-1.ogg', mp3 : 'Content/effects/ak47-1.mp3' }},
			{ name : 'artillery', value : { ogg : 'Content/effects/artillery.ogg', mp3 : 'Content/effects/artillery.mp3' }},
			{ name : 'explosion', value : { ogg : 'Content/effects/explosion.ogg', mp3 : 'Content/effects/explosion.mp3' }},
			{ name : 'flak', value : { ogg : 'Content/effects/flak.ogg', mp3 : 'Content/effects/flak.mp3' }},
			{ name : 'flames', value : { ogg : 'Content/effects/flames.ogg', mp3 : 'Content/effects/flames.mp3' }},
			{ name : 'hellshot', value : { ogg : 'Content/effects/hellshot.ogg', mp3 : 'Content/effects/hellshot.mp3' }},
			{ name : 'humm', value : { ogg : 'Content/effects/humm.ogg', mp3 : 'Content/effects/humm.mp3' }},
			{ name : 'icy', value : { ogg : 'Content/effects/icy.ogg', mp3 : 'Content/effects/icy.mp3' }},
			{ name : 'laser', value : { ogg : 'Content/effects/laser.ogg', mp3 : 'Content/effects/laser.mp3' }},
			{ name : 'laugh', value : { ogg : 'Content/effects/laugh.ogg', mp3 : 'Content/effects/laugh.mp3' }},
			{ name : 'mgnest', value : { ogg : 'Content/effects/mgnest.ogg', mp3 : 'Content/effects/mgnest.mp3' }},
			{ name : 'wowpulse', value : { ogg : 'Content/effects/wowpulse.ogg', mp3 : 'Content/effects/wowpulse.mp3' }},
		],
	};


	var canvas = document.querySelector('#game');
	var towerPanel = document.querySelector('#towers');
	var towerButtons = [];
	var moneyInfo = document.querySelector('#money-info');
	var levelInfo = document.querySelector('#level-info');
	var healthInfo = document.querySelector('#health-info');
	var timeInfo = document.querySelector('#time-info');
	var soundInfo = document.querySelector('#sound-info');
	var startWaveButton = document.querySelector('#startWave');
	var nextwave = document.querySelector('#nextWave');
	var mario = document.querySelector('#Mario-info');
	var rope = document.querySelector('#Rope-info');
	var firewizzrobe = document.querySelector('#FireWizzrobe-info');
	var darknut = document.querySelector('#DarkNut-info');
	var speedy = document.querySelector('#Speedy-info');
	var armo = document.querySelector('#Armos-info');
	var nivelActual = 1;

	var towerType = undefined;
	var getMousePosition = function(evt) {
		var rect = canvas.getBoundingClientRect();
		return {
			x: evt.clientX - rect.left,
			y: evt.clientY - rect.top
		};
	};
	var buildPhase = function() {
		var time = 10;
		var f = function() {
			setTimeout(function() {
				time--;
				timeInfo.textContent = time + ' seconds left';

				if (time > 0) f();
				else logic.beginWave();
			}, 1000);
		};

		f();
	};
	var addHandlers = function() {
		logic.addEventListener(events.waveFinished, function() {
			timeInfo.textContent = 'Ya salieron todas!';
		});
		logic.addEventListener(events.waveDefeated, function(player) {

			if (nivelActual == 10) {
				window.alert("¡FELICITACIONES! ¡GANASTE!");
				EndGame(scenarioPrompt, nivelActual, player.hitpoints);
			} else {
				nivelActual += 1;
				levelInfo.textContent = nivelActual;
			}
			addUnitInfo();
			timeInfo.textContent = 'Preparate para el nivel ' + nivelActual;
			startWaveButton.disabled = false;
		});
		logic.addEventListener(events.playerDefeated, function(player) {
			window.alert("Perdiste");
			EndGame(scenarioPrompt, nivelActual, player.hitpoints);
			timeInfo.textContent = 'Game over ...';
		});
		logic.addEventListener(events.waveCreated, function(wave) {
			timeInfo.textContent = 'Faltan salir' + wave.units.length + ' unidades';
			startWaveButton.disabled = true;
		});
		logic.addEventListener(events.unitSpawned, function(remaining) {
			timeInfo.textContent = remaining + ' unidades';
		});
		logic.addEventListener(events.moneyChanged, function(player) {
			moneyInfo.textContent = player.money;
		});
		logic.addEventListener(events.healthChanged, function(player) {
			healthInfo.textContent = player.hitpoints;
		});
		startWaveButton.addEventListener(events.click, function() {
			logic.beginWave();
		});
		soundInfo.addEventListener(events.click, function() {
			var on = 'on';
			var off = 'off'
			var status = this.classList.contains('on');
			this.classList.remove(status ? on : off);
			this.classList.add(status ? off : on);
			Sound.setVolume(status ? 0 : 1);
		});
		canvas.addEventListener(events.click, function(evt) {
			var mousePos = getMousePosition(evt);
			var pos = logic.transformCoordinates(mousePos.x, mousePos.y);
			evt.preventDefault();

			if (towerType) logic.buildTower(pos, towerType);
			else logic.destroyTower(pos);
		});
		canvas.addEventListener(events.contextmenu, function(evt) {
			var mousePos = getMousePosition(evt);
			var pos = logic.transformCoordinates(mousePos.x, mousePos.y);
			evt.preventDefault();
			logic.destroyTower(pos);
		});
		canvas.addEventListener(events.mouseover, function(evt) {
			view.showGrid = true;
		});
		canvas.addEventListener(events.mouseout, function(evt) {
			view.showGrid = false;
		});
	};
	var addTower = function(tower) {
		levelInfo.textContent = nivelActual;
		var img = view.images[tower.sprite];
		
		var div = document.createElement('div');
		div.innerHTML = [
			'<div class=preview><div style="background: url(', img.src, ') no-repeat; width: ', ~~(img.naturalWidth / tower.frames), 'px; height: ', img.naturalHeight, 'px" class="preview-image"></div></div>',
			'<div class=title>', tower.nickName, '</div><div class=info>',
			'<div class=description>', tower.description, '</div>',
			'<div class=speed>', tower.speed, '</div>',
			'<div class=damage>', tower.shotType.damage, '</div>',
			'<div class=range>', tower.range, '</div>',
			'<div class=cost>', tower.cost, '</div></div>',
		].join('');
		towerButtons.push(div);
		div.addEventListener(events.click, function() {
			towerType = tower;

			for (var i = towerButtons.length; i--; )
				towerButtons[i].classList.remove('selected-tower');

			this.classList.add('selected-tower');
		});
		towerPanel.appendChild(div);
	};
	var addTowers = function() {
		addUnitInfo(1);
		for (var key in types.towers)
			addTower(types.towers[key]);
	};
	var addUnitInfo = function(level) {
		
		if (level === 0)
		{
			level = 0;
		} else {
			level = nivelActual;
		}
		if (level <= 10)
		{
			nextWave.innerHTML = "";
			var wave0 = logic.waves.waves[level-1].units;
			
			var cantmarios = 0;
			var cantropes = 0;
			var cantfirewizzrobes = 0;
			var cantdarknuts = 0;
			var cantspeedies = 0;
			var cantarmos = 0;
			for (var i = 0; i < wave0.length; i++) {
				if (wave0[i].unit == "Mario")
					cantmarios += 1;

				if (wave0[i].unit == "Rope")
					cantropes += 1;

				if (wave0[i].unit == "FireWizzrobe")
					cantfirewizzrobes += 1;

				if (wave0[i].unit == "DarkNut")
					cantdarknuts += 1;

				if (wave0[i].unit == "Speedy")
					cantspeedies += 1;

				if (wave0[i].unit == "Armos")
					cantarmos += 1;
			}

			var divM = document.createElement('div');
			divM.innerHTML = [
				'<p>Level: ',level,'</p>',
				'<div class=preview><div style="background: url(', "Content/icons/mario.png", ') no-repeat; width: 30px; height: 32px" class="preview-image"></div></div>',
				'<div class=title>', cantmarios, '</div><div class=info>'
			].join('');
			nextWave.appendChild(divM);

			var divR = document.createElement('div');
			divR.innerHTML = [
				'<div class=preview><div style="background: url(', "Content/icons/rope.png", ') no-repeat; width: 21px; height: 18px" class="preview-image"></div></div>',
				'<div class=title>', cantropes, '</div><div class=info>'
			].join('');
			nextWave.appendChild(divR);

			var divF = document.createElement('div');
			divF.innerHTML = [
				'<div class=preview><div style="background: url(', "Content/icons/firewizzrobe.png", ') no-repeat; width: 22px; height: 34px" class="preview-image"></div></div>',
				'<div class=title>', cantfirewizzrobes, '</div><div class=info>'
			].join('');
			nextWave.appendChild(divF);

			var divD = document.createElement('div');
			divD.innerHTML = [
				'<div class=preview><div style="background: url(', "Content/icons/darknut.png", ') no-repeat; width: 31px; height: 31px" class="preview-image"></div></div>',
				'<div class=title>', cantdarknuts, '</div><div class=info>'
			].join('');
			nextWave.appendChild(divD);

			var divS = document.createElement('div');
			divS.innerHTML = [
				'<div class=preview><div style="background: url(', "Content/icons/speedy.png", ') no-repeat; width: 29px; height: 29px" class="preview-image"></div></div>',
				'<div class=title>', cantspeedies, '</div><div class=info>'
			].join('');
			nextWave.appendChild(divS);

			var divA = document.createElement('div');
			divA.innerHTML = [
				'<div class=preview><div style="background: url(', "Content/icons/armos.png", ') no-repeat; width: 34px; height: 34px" class="preview-image"></div></div>',
				'<div class=title>', cantarmos, '</div><div class=info>'
			].join('');
			nextWave.appendChild(divA);
		}
	};
	var startMusic = function() {
		view.playSound('burn_them_down', true, 0.1);
		/*var sound = new Sound(sounds['burn_them_down'], true);
		sound.setVolume(0.01);
		sound.play();*/
	};
	var completed = function(e) {
		addTowers();
		addHandlers();
		view.background = view.images['background'];
		view.showGrid = false;
		document.querySelector('#frame').classList.remove('hidden');
		document.querySelector('#wait').classList.add('hidden');
		startMusic();
		logic.start();
	};
	var progress = function(e) {
		document.querySelector('#wait-message').textContent = 'Loading (' + e.name + ', ' + ~~(e.progress * 100) + '%)';
	};

	var width = 8;
	var height = 8;
	var path = [];
	var turrets = [];

	if (scenarioPrompt == 1) {
		constants.money = 25;
		path = [new Point(1,0), new Point(1,1), new Point(1,2), new Point(1,3), new Point(1,4), new Point(2,4), new Point(3,4), new Point(3,5), new Point(3,6), new Point(4,6), new Point(5,6), new Point(5,5), new Point(5,4), new Point(5,3), new Point(5,2), new Point(5,1), new Point(5,0)]; // Test01
		turrets = [new Point(2,3), new Point(4,5), new Point(4,3), new Point(2,1), new Point(2,5)];
	} else {
		if (scenarioPrompt == 2) {
			constants.money = 15;
			path = [new Point(0,4), new Point(1,4), new Point(2,4), new Point(2,5), new Point(2,6), new Point(3,6), new Point(4,6), new Point(4,5), new Point(4,4), new Point(4,3), new Point(4,2), new Point(5,2), new Point(6,2), new Point(7,2)]; // Test02
			turrets = [new Point(3,4), new Point(1,5), new Point(5,3)];
		} else {
			if (scenarioPrompt == 3) {
				constants.money = 14;
				path = [new Point(1,0), new Point(1,1), new Point(1,2), new Point(2,2), new Point(3,2), new Point(3,3), new Point(3,4), new Point(3,5), new Point(4,5), new Point(5,5), new Point(6,5), new Point(7,5)]; // Test03
				turrets = [new Point(2,3), new Point(4,4), new Point(2,1), new Point(5,6)];
			} else {
				if (scenarioPrompt == 4) {
					path = [new Point(0,4), new Point(1,4), new Point(2,4), new Point(3,4), new Point(4,4), new Point(4,3), new Point(4,2), new Point(5,2), new Point(6,2), new Point(7,2)];
					turrets = [new Point(2,3), new Point(4,5), new Point(5,3), new Point(2,5)];
				} else {
					console.log("Escenario incorrecto");
					path = [new Point(1,0), new Point(1,1), new Point(1,2), new Point(1,3), new Point(1,4), new Point(2,4), new Point(3,4), new Point(3,5), new Point(3,6), new Point(4,6), new Point(5,6), new Point(5,5), new Point(5,4), new Point(5,3), new Point(5,2), new Point(5,1), new Point(5,0)];
					turrets = [new Point(2,3), new Point(4,5), new Point(4,3), new Point(2,1), new Point(2,5)];
				}
			}
		}
	}
 
	/*var path1 = [new Point(1,0), new Point(1,1), new Point(1,2), new Point(1,3), new Point(1,4), new Point(2,4), new Point(3,4), new Point(3,5), new Point(3,6), new Point(4,6), new Point(5,6), new Point(5,5), new Point(5,4), new Point(5,3), new Point(5,2), new Point(5,1), new Point(5,0)]; // Test01
	var path2 = [new Point(0,4), new Point(1,4), new Point(2,4), new Point(2,5), new Point(2,6), new Point(3,6), new Point(4,6), new Point(4,5), new Point(4,4), new Point(4,3), new Point(4,2), new Point(5,2), new Point(6,2), new Point(7,2)]; // Test02
	var path3 = [new Point(1,0), new Point(1,1), new Point(1,2), new Point(2,2), new Point(3,2), new Point(3,3), new Point(3,4), new Point(3,5), new Point(4,5), new Point(5,5), new Point(6,5), new Point(7,5)]; // Test03
	var path4 = [new Point(0,4), new Point(1,4), new Point(2,4), new Point(3,4), new Point(4,4), new Point(4,3), new Point(4,2), new Point(5,2), new Point(6,2), new Point(7,2)];
	var path5 = [new Point(1,0), new Point(1,1), new Point(1,2), new Point(1,3), new Point(1,4), new Point(2,4), new Point(3,4), new Point(3,5), new Point(3,6), new Point(4,6), new Point(5,6), new Point(5,5), new Point(5,4), new Point(5,3), new Point(5,2), new Point(5,1), new Point(5,0)];
	var path = path4;
	var turrets1 = [new Point(2,3), new Point(4,5), new Point(4,3), new Point(2,1), new Point(2,5)];
	var turrets2 = [new Point(3,4), new Point(1,5), new Point(5,3)];
	var turrets3 = [new Point(2,3), new Point(4,4), new Point(2,1), new Point(5,6)];
	var turrets4 = [new Point(2,3), new Point(4,5), new Point(5,3), new Point(2,5)];
	var turrets5 = [new Point(2,3), new Point(4,5), new Point(4,3), new Point(2,1), new Point(2,5)];
	var turrets = turrets4;*/

	var maze = new Maze(new Size(width, height), path, turrets);

	var visual = true;
	var view = new CanvasView(canvas);


	if (visual) 
		var logic = (new GameLogic(view, maze));
	else
		var logic = new GameLogic(new ludorum_towerdefense.View(canvas.width, canvas.height), maze);



	if (scenarioPrompt == 1) {
		logic.setWaves(new WaveList([
			new Wave(logic, 10, [{unit: "Mario", time:1}, {unit: "Mario", time:400}, {unit: "Rope", time:1000}, {unit: "Rope", time:1200}]),
			
			new Wave(logic, 12, [{unit: "Mario", time:1}, {unit: "Rope", time:350}, {unit: "Mario", time:850}, {unit: "Mario", time:1100},
	 			{unit: "Rope", time:1800}, {unit: "Rope", time:2500}]),
			
			new Wave(logic, 16, [{unit: "Mario", time:1}, {unit: "Rope", time:350}, {unit: "FireWizzrobe", time:500}, {unit: "Rope", time:1000},
				{unit: "FireWizzrobe", time:1500}]),

			new Wave(logic, 20, [{unit: "Speedy", time:1}, {unit: "FireWizzrobe", time:200}, {unit: "Rope", time:500}, {unit: "FireWizzrobe", time:600},
				{unit: "FireWizzrobe", time:900}, {unit: "FireWizzrobe", time:1300}, {unit: "DarkNut", time:2800}]),

			new Wave(logic, 22, [{unit: "FireWizzrobe", time:1}, {unit: "Rope", time:600}, {unit: "FireWizzrobe", time:1500}, {unit: "Rope", time:2000},
				{unit: "FireWizzrobe", time:2800}, {unit: "DarkNut", time:3700}, {unit: "DarkNut", time:4500}, {unit: "FireWizzrobe", time:6000}]),

			new Wave(logic, 25, [{unit: "DarkNut", time:1}, {unit: "FireWizzrobe", time:500}, {unit: "FireWizzrobe", time:1000}, {unit: "FireWizzrobe", time:1600},
				{unit: "DarkNut", time:2500}, {unit: "DarkNut", time:3000}, {unit: "FireWizzrobe", time:4000}]),

			new Wave(logic, 25, [{unit: "DarkNut", time:1}, {unit: "FireWizzrobe", time:600}, {unit: "DarkNut", time:1000}, {unit: "Rope", time:2200},
				{unit: "FireWizzrobe", time:4000}, {unit: "FireWizzrobe", time:4900}, {unit: "Armos", time:6000}]),

			new Wave(logic, 22, [{unit: "FireWizzrobe", time:1}, {unit: "Rope", time:600}, {unit: "FireWizzrobe", time:1500}, {unit: "Rope", time:2000},
	 			{unit: "FireWizzrobe", time:2800}, {unit: "DarkNut", time:3700}, {unit: "DarkNut", time:4500}, {unit: "FireWizzrobe", time:6000}]),

			new Wave(logic, 50, [{unit: "Armos", time:1}, {unit: "Rope", time:1000}, {unit: "Rope", time:1400}, {unit: "Armos", time:3000},
				 {unit: "FireWizzrobe", time:4800}, {unit: "FireWizzrobe", time:5100}, {unit: "Armos", time:6000}, {unit: "DarkNut", time:7100},
				 {unit: "DarkNut", time:7800}, {unit: "Armos", time:8500}, {unit: "Armos", time:10000}]),

			new Wave(logic, 25, [{unit: "Armos", time:1}, {unit: "Armos", time:1000}, {unit: "Armos", time:2000}, {unit: "Armos", time:3000},
	 			{unit: "Armos", time:4000}, {unit: "Armos", time:5000}]),
			]));
	} else {
		if (scenarioPrompt == 2) {
			logic.setWaves(new WaveList([
			new Wave(logic, 10, [{unit: "Mario", time:1}, {unit: "Mario", time:400}, {unit: "Rope", time:1000}, {unit: "Rope", time:1200}]),
			new Wave(logic, 12, [{unit: "Mario", time:1}, {unit: "Rope", time:350}, {unit: "Mario", time:850}, {unit: "Mario", time:1100},
				{unit: "Rope", time:1800}, {unit: "Rope", time:2500}]),
			new Wave(logic, 16, [{unit: "Mario", time:1}, {unit: "Rope", time:350}, {unit: "FireWizzrobe", time:500}, {unit: "FireWizzrobe", time:800},
				{unit: "Rope", time:1000}, {unit: "FireWizzrobe", time:1500}]),
			new Wave(logic, 20, [{unit: "Speedy", time:1}, {unit: "FireWizzrobe", time:200}, {unit: "Rope", time:500}, {unit: "Rope", time:550},
				{unit: "FireWizzrobe", time:600}, {unit: "Rope", time:680}, {unit: "FireWizzrobe", time:900}, {unit: "FireWizzrobe", time:1300}, {unit: "DarkNut", time:2800}]),
			new Wave(logic, 22, [{unit: "FireWizzrobe", time:1}, {unit: "Rope", time:500}, {unit: "Rope", time:550}, {unit: "FireWizzrobe", time:1000},
				{unit: "Rope", time:1200}, {unit: "Rope", time:1350}, {unit: "FireWizzrobe", time:1600},
				{unit: "DarkNut", time:2500}, {unit: "DarkNut", time:3000}, {unit: "FireWizzrobe", time:4000}, {unit: "FireWizzrobe", time:4200}]),
			new Wave(logic, 25, [{unit: "DarkNut", time:1}, {unit: "FireWizzrobe", time:500}, {unit: "FireWizzrobe", time:1000}, {unit: "DarkNut", time:1200},
					{unit: "FireWizzrobe", time:1600}, {unit: "FireWizzrobe", time:2500}, {unit: "DarkNut", time:3000}, {unit: "FireWizzrobe", time:4000}, {unit: "DarkNut", time:4200}]),
			new Wave(logic, 20, [{unit: "DarkNut", time:1}, {unit: "FireWizzrobe", time:250}, {unit: "FireWizzrobe", time:600}, {unit: "DarkNut", time:1000},
					{unit: "Rope", time:2200}, {unit: "Rope", time:2300}, {unit: "Rope", time:2400}, {unit: "Rope", time:2500}, {unit: "Rope", time:2600},
					{unit: "FireWizzrobe", time:4000}, {unit: "DarkNut", time:4200}, {unit: "FireWizzrobe", time:4400}, {unit: "Armos", time:6000}]),
			new Wave(logic, 25, [{unit: "DarkNut", time:1}, {unit: "DarkNut", time:250}, {unit: "DarkNut", time:600}, {unit: "DarkNut", time:1000},
					{unit: "FireWizzrobe", time:2200}, {unit: "FireWizzrobe", time:2300}, {unit: "Rope", time:2400}, {unit: "Rope", time:2500}, {unit: "FireWizzrobe", time:2600},
					{unit: "Armos", time:4000}, {unit: "DarkNut", time:5000}, {unit: "FireWizzrobe", time:5400}, {unit: "FireWizzrobe", time:6000}, {unit: "Armos", time:8000}]),
			new Wave(logic, 30, [{unit: "Armos", time:1}, {unit: "Rope", time:1000}, {unit: "Rope", time:1300}, {unit: "Rope", time:1400},
					{unit: "Armos", time:3000}, {unit: "FireWizzrobe", time:3100}, {unit: "FireWizzrobe", time:3300}, {unit: "FireWizzrobe", time:3400},
					{unit: "Armos", time:5000}, {unit: "DarkNut", time:5100}, {unit: "DarkNut", time:5300}, {unit: "DarkNut", time:5400}, {unit: "Armos", time:6500}, {unit: "Armos", time:7000}]),
			new Wave(logic, 25, [{unit: "Armos", time:1}, {unit: "Armos", time:1000}, {unit: "Armos", time:2000}, {unit: "Armos", time:3000},
					{unit: "Armos", time:4000}, {unit: "Armos", time:5000}]),
			]));
		} else {
			if (scenarioPrompt == 3) {
				logic.setWaves(new WaveList([
			new Wave(logic, 8, [{unit: "Mario", time:1}, {unit: "Mario", time:700}, {unit: "Rope", time:1800}, {unit: "Rope", time:2800},
				{unit: "DarkNut", time:4000}]),
			new Wave(logic, 8, [{unit: "Mario", time:1}, {unit: "Mario", time:350}, {unit: "Mario", time:700}, {unit: "Rope", time:1800},
				{unit: "Rope", time:2300}, {unit: "Rope", time:2800},{unit: "FireWizzrobe", time:3800}, {unit: "DarkNut", time:5000}]),
			new Wave(logic, 9, [{unit: "Mario", time:1}, {unit: "Rope", time:350}, {unit: "Mario", time:400}, {unit: "Rope", time:600},
				{unit: "Rope", time:800}, {unit: "Rope", time:1000}, {unit: "FireWizzrobe", time:1500}]),
			new Wave(logic, 12, [{unit: "FireWizzrobe", time:1}, {unit: "Rope", time:450}, {unit: "FireWizzrobe", time:600}, {unit: "FireWizzrobe", time:900},
				{unit: "FireWizzrobe", time:1200}]),
			new Wave(logic, 15, [{unit: "FireWizzrobe", time:1}, {unit: "Rope", time:500}, {unit: "Rope", time:550}, {unit: "Rope", time:600},
				{unit: "Rope", time:650}, {unit: "Rope", time:700}, {unit: "FireWizzrobe", time:1600}, {unit: "FireWizzrobe", time:4000}, {unit: "FireWizzrobe", time:4200}]),
			new Wave(logic, 20, [{unit: "DarkNut", time:1}, {unit: "FireWizzrobe", time:500}, {unit: "FireWizzrobe", time:1000}, {unit: "DarkNut", time:1200},
				{unit: "FireWizzrobe", time:1600}, {unit: "DarkNut", time:2500}, {unit: "DarkNut", time:3000}, {unit: "FireWizzrobe", time:4000}, {unit: "DarkNut", time:4200}]),
			new Wave(logic, 20, [{unit: "DarkNut", time:1}, {unit: "FireWizzrobe", time:250}, {unit: "FireWizzrobe", time:600}, {unit: "DarkNut", time:1000},
				{unit: "Rope", time:2200}, {unit: "Rope", time:2300}, {unit: "Rope", time:2400}, {unit: "Rope", time:2500}, {unit: "Rope", time:2600},
				{unit: "FireWizzrobe", time:4000}, {unit: "DarkNut", time:4200}, {unit: "FireWizzrobe", time:4400}, {unit: "Armos", time:6000}]),
			new Wave(logic, 25, [{unit: "DarkNut", time:1}, {unit: "DarkNut", time:250}, {unit: "DarkNut", time:600}, {unit: "DarkNut", time:1000},
				{unit: "FireWizzrobe", time:2200}, {unit: "FireWizzrobe", time:2300}, {unit: "Rope", time:2400}, {unit: "Rope", time:2500}, {unit: "FireWizzrobe", time:2600},
				{unit: "Armos", time:4000}, {unit: "DarkNut", time:5000}, {unit: "FireWizzrobe", time:5400}, {unit: "FireWizzrobe", time:6000}, {unit: "Armos", time:8000}]),
			new Wave(logic, 30, [{unit: "Armos", time:1}, {unit: "Rope", time:1000}, {unit: "Rope", time:1300}, {unit: "Rope", time:1400},
				{unit: "Armos", time:3000}, {unit: "FireWizzrobe", time:3100}, {unit: "FireWizzrobe", time:3300}, {unit: "FireWizzrobe", time:3400},
				{unit: "Armos", time:5000}, {unit: "DarkNut", time:5100}, {unit: "DarkNut", time:5300}, {unit: "DarkNut", time:5400}, {unit: "Armos", time:6500}, {unit: "Armos", time:7000}]),
			new Wave(logic, 25, [{unit: "Armos", time:1}, {unit: "Armos", time:1000}, {unit: "Armos", time:2000}, {unit: "Armos", time:3000},
					{unit: "Armos", time:4000}, {unit: "Armos", time:5000}]),

			]));
			} else {
				if (scenarioPrompt == 4) {
					logic.setWaves(new WaveList([
						new Wave(logic, 8, [{unit: "Mario", time:1}, {unit: "Mario", time:700}, {unit: "Rope", time:1800}, {unit: "Rope", time:2800}, {unit: "DarkNut", time:4000}]),
						
						new Wave(logic, 8, [{unit: "Mario", time:1}, {unit: "Mario", time:350},
											 {unit: "Mario", time:700}, {unit: "Rope", time:1800},
											 {unit: "Rope", time:2300}, {unit: "Rope", time:2800},
											 {unit: "FireWizzrobe", time:3800}, {unit: "DarkNut", time:5000}]),
						
						new Wave(logic, 9, [{unit: "Mario", time:1}, {unit: "Rope", time:350}, {unit: "Rope",time:600},
											 {unit: "Rope", time:800}, {unit: "Rope", time:1000}, {unit: "FireWizzrobe", time:1500}]),
						
						new Wave(logic, 15, [{unit: "FireWizzrobe", time:1}, {unit: "Rope", time:500}, {unit: "Rope", time:550}, {unit: "Rope", time:600},
											 {unit: "Rope", time:650}, {unit: "Rope", time:700}, {unit: "FireWizzrobe", time:1600},
											 {unit: "FireWizzrobe", time:4000}, {unit: "FireWizzrobe", time:4200}]),
						
						new Wave(logic, 20, [{unit: "DarkNut", time:1}, {unit: "FireWizzrobe", time:500}, {unit: "FireWizzrobe", time:1000}, {unit: "DarkNut", time:1200},
											 {unit: "FireWizzrobe", time:1600}, {unit: "DarkNut", time:2500}, {unit: "DarkNut", time:3000},
											 {unit: "FireWizzrobe", time:4000}, {unit: "DarkNut", time:4200}]),
						
						new Wave(logic, 20, [{unit: "DarkNut", time:1}, {unit: "FireWizzrobe", time:250}, {unit: "FireWizzrobe", time:600}, {unit: "DarkNut", time:1000},
											 {unit: "Rope", time:2200}, {unit: "Rope", time:2300}, {unit: "Rope", time:2400},
											 {unit: "Rope", time:2500}, {unit: "Rope", time:2600}, {unit: "FireWizzrobe", time:4000},
											 {unit: "DarkNut", time:4200}, {unit: "FireWizzrobe", time:4400}, {unit: "Armos", time:6000}]),
						
						new Wave(logic, 25, [{unit: "DarkNut", time:1}, {unit: "DarkNut", time:250}, {unit: "DarkNut", time:600}, {unit: "DarkNut", time:1000},
											 {unit: "FireWizzrobe", time:2200}, {unit: "FireWizzrobe", time:2300}, {unit: "Rope", time:2400},
											 {unit: "Rope", time:2500}, {unit: "FireWizzrobe", time:2600}, {unit: "Armos", time:4000},
											 {unit: "DarkNut", time:5000}, {unit: "FireWizzrobe", time:5400}, {unit: "FireWizzrobe", time:6000}, {unit: "Armos", time:8000}]),

						new Wave(logic, 30, [{unit: "Armos", time:1}, {unit: "Rope", time:1000}, {unit: "Rope", time:1300}, {unit: "Rope", time:1400},
											 {unit: "Armos", time:3000}, {unit: "FireWizzrobe", time:3100}, {unit: "FireWizzrobe", time:3300},
											 {unit: "FireWizzrobe", time:3400}, {unit: "Armos", time:5000}, {unit: "DarkNut", time:5100},
											 {unit: "DarkNut", time:5300}, {unit: "DarkNut", time:5400}, {unit: "Armos", time:6500}, {unit: "Armos", time:7000}]),

						]));
				} else {
					console.log("Escenario incorrecto");
					
				}
			}
		}
	}
	
	/*logic.setWaves(new WaveList([
		new Wave(logic, 8, [{unit: "Mario", time:1}, {unit: "Mario", time:700}, {unit: "Rope", time:1800}, {unit: "Rope", time:2800}, {unit: "DarkNut", time:4000}]),
		
		new Wave(logic, 8, [{unit: "Mario", time:1}, {unit: "Mario", time:350},
							 {unit: "Mario", time:700}, {unit: "Rope", time:1800},
							 {unit: "Rope", time:2300}, {unit: "Rope", time:2800},
							 {unit: "FireWizzrobe", time:3800}, {unit: "DarkNut", time:5000}]),
		
		new Wave(logic, 9, [{unit: "Mario", time:1}, {unit: "Rope", time:350}, {unit: "Rope",time:600},
							 {unit: "Rope", time:800}, {unit: "Rope", time:1000}, {unit: "FireWizzrobe", time:1500}]),
		
		new Wave(logic, 15, [{unit: "FireWizzrobe", time:1}, {unit: "Rope", time:500}, {unit: "Rope", time:550}, {unit: "Rope", time:600},
							 {unit: "Rope", time:650}, {unit: "Rope", time:700}, {unit: "FireWizzrobe", time:1600},
							 {unit: "FireWizzrobe", time:4000}, {unit: "FireWizzrobe", time:4200}]),
		
		new Wave(logic, 20, [{unit: "DarkNut", time:1}, {unit: "FireWizzrobe", time:500}, {unit: "FireWizzrobe", time:1000}, {unit: "DarkNut", time:1200},
							 {unit: "FireWizzrobe", time:1600}, {unit: "DarkNut", time:2500}, {unit: "DarkNut", time:3000},
							 {unit: "FireWizzrobe", time:4000}, {unit: "DarkNut", time:4200}]),
		
		new Wave(logic, 20, [{unit: "DarkNut", time:1}, {unit: "FireWizzrobe", time:250}, {unit: "FireWizzrobe", time:600}, {unit: "DarkNut", time:1000},
							 {unit: "Rope", time:2200}, {unit: "Rope", time:2300}, {unit: "Rope", time:2400},
							 {unit: "Rope", time:2500}, {unit: "Rope", time:2600}, {unit: "FireWizzrobe", time:4000},
							 {unit: "DarkNut", time:4200}, {unit: "FireWizzrobe", time:4400}, {unit: "Armos", time:6000}]),
		
		new Wave(logic, 25, [{unit: "DarkNut", time:1}, {unit: "DarkNut", time:250}, {unit: "DarkNut", time:600}, {unit: "DarkNut", time:1000},
							 {unit: "FireWizzrobe", time:2200}, {unit: "FireWizzrobe", time:2300}, {unit: "Rope", time:2400},
							 {unit: "Rope", time:2500}, {unit: "FireWizzrobe", time:2600}, {unit: "Armos", time:4000},
							 {unit: "DarkNut", time:5000}, {unit: "FireWizzrobe", time:5400}, {unit: "FireWizzrobe", time:6000}, {unit: "Armos", time:8000}]),

		new Wave(logic, 30, [{unit: "Armos", time:1}, {unit: "Rope", time:1000}, {unit: "Rope", time:1300}, {unit: "Rope", time:1400},
							 {unit: "Armos", time:3000}, {unit: "FireWizzrobe", time:3100}, {unit: "FireWizzrobe", time:3300},
							 {unit: "FireWizzrobe", time:3400}, {unit: "Armos", time:5000}, {unit: "DarkNut", time:5100},
							 {unit: "DarkNut", time:5300}, {unit: "DarkNut", time:5400}, {unit: "Armos", time:6500}, {unit: "Armos", time:7000}]),

		]));*/
	view.loadResources(resources, completed, progress);

})();

function EndGame(scenario, lvl, hitpoints)
{
	console.log(scenario);
	console.log(lvl);
	console.log(hitpoints);
	firebase.database().ref('matches/' + scenario + '/' + window.user.uid).push({
				date: (new Date()).toLocaleString(), 
				email: user.email, 
				name: user.displayName, 
				level: lvl,
				hitpoints: hitpoints
			});
}