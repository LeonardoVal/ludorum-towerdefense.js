/**TODO
*/

var scenarios = exports.scenarios = {

	/** Simple test game. 01
	*/
	Test01: new (TowerDefense.Definition)({
		mapWidth: 8,
		mapHeight: 8,
		creepPath: [
			[1,0], [1,1], [1,2], [1,3], [1,4], [2,4], [3,4], [3,5], [3,6], [4,6], [5,6], [5,5],
			[5,4], [5,3], [5,2], [5,1], [5,0]
		],
		towerPlaces: [
			[2,3], [4,5], [4,3], [2,1], [2,5]
		],
		waves: [
			[10, [[1, "Mario"], [400, "Mario"], [1000, "Rope"], [1200, "Rope"]]],

			[12, [[1, "Mario"], [350, "Rope"],
				  [850, "Mario"], [1100, "Mario"],
				  [1800, "Rope"], [2500, "Rope"]]],

			[16, [[1, "Mario"], [350, "Rope"], [500, "FireWizzrobe"],
				  [1000, "Rope"], [1500, "FireWizzrobe"]]],

			[20, [[1, "Speedy"], [200, "FireWizzrobe"], [500, "Rope"],
				  [600, "FireWizzrobe"], [900, "FireWizzrobe"],
				  [1300, "FireWizzrobe"], [2800, "DarkNut"]]],

			[22, [[1, "FireWizzrobe"], [600, "Rope"],
				  [1500, "FireWizzrobe"], [2000, "Rope"],
				  [2800, "FireWizzrobe"], [3700, "DarkNut"], [4500, "DarkNut"],
				  [6000, "FireWizzrobe"]]],

		  	[25, [[1, "DarkNut"], [500, "FireWizzrobe"], [1000, "FireWizzrobe"],
				  [1600, "FireWizzrobe"], [2500, "DarkNut"], [3000, "DarkNut"],
				  [4000, "FireWizzrobe"]]],

			[25, [[1, "DarkNut"], [600, "FireWizzrobe"], [1000, "DarkNut"],
				  [2200, "Rope"], [2500, "Rope"], [2600, "Rope"],
				  [4000, "FireWizzrobe"], [4900, "FireWizzrobe"], [6000, "Armos"]]],

			[30, [[1, "DarkNut"], [1000, "DarkNut"],
				  [2200, "FireWizzrobe"], [2800, "FireWizzrobe"],
				  [4000, "Armos"], [5000, "DarkNut"], [5400, "FireWizzrobe"], [6000, "FireWizzrobe"]]],

			[50, [[1, "Armos"], [1000, "Rope"], [1400, "Rope"],
				  [3000, "Armos"], [4800, "FireWizzrobe"], [5100, "FireWizzrobe"],
				  [6000, "Armos"], [7100, "DarkNut"], [7800, "DarkNut"],
				  [8500, "Armos"], [10000, "Armos"]]],

			[25, [[1, "Armos"],[1000, "Armos"],[2000, "Armos"],[3000, "Armos"],[4000, "Armos"],[5000, "Armos"]]]
		],
		startMoney: 25,
		startHP: 10
	}), // Test01


	/** Simple test game. 02
	*/
	Test02: new (TowerDefense.Definition)({
		mapWidth: 8,
		mapHeight: 8,
		creepPath: [
			[0,4], [1,4], [2,4], [2,5], [2,6], [3,6], [4,6], [4,5], [4,4], [4,3], [4,2], [5,2],
			[6,2], [7,2]
		],
		towerPlaces: [
			[3,4], [1,5], [5,3]
		],
		waves: [

			[10, [[1, "Mario"], [400, "Mario"], [1000, "Rope"], [1200, "Rope"]]],

			[12, [[1, "Mario"], [350, "Rope"],
				  [850, "Mario"], [1100, "Mario"],
				  [1800, "Rope"], [2500, "Rope"]]],

			[16, [[1, "Mario"], [350, "Rope"], [500, "FireWizzrobe"],
				  [800, "FireWizzrobe"], [1000, "Rope"], [1500, "FireWizzrobe"]]],

			[20, [[1, "Speedy"], [200, "FireWizzrobe"], [500, "Rope"], [550, "Rope"],
				  [600, "FireWizzrobe"], [680, "Rope"], [900, "FireWizzrobe"],
				  [1300, "FireWizzrobe"], [2800, "DarkNut"]]],

			[22, [[1, "FireWizzrobe"], [500, "Rope"], [550, "Rope"],
				  [1000, "FireWizzrobe"], [1200, "Rope"], [1350, "Rope"],
				  [1600, "FireWizzrobe"], [2500, "DarkNut"], [3000, "DarkNut"],
				  [4000, "FireWizzrobe"], [4200, "FireWizzrobe"]]],

		  	[25, [[1, "DarkNut"], [500, "FireWizzrobe"], [1000, "FireWizzrobe"], [1200, "DarkNut"],
				  [1600, "FireWizzrobe"], [2500, "DarkNut"], [3000, "DarkNut"],
				  [4000, "FireWizzrobe"], [4200, "DarkNut"]]],

			[20, [[1, "DarkNut"], [250, "FireWizzrobe"], [600, "FireWizzrobe"], [1000, "DarkNut"],
				  [2200, "Rope"], [2300, "Rope"], [2400, "Rope"], [2500, "Rope"], [2600, "Rope"],
				  [4000, "FireWizzrobe"], [4200, "DarkNut"], [4400, "FireWizzrobe"], [6000, "Armos"]]],

			[25, [[1, "DarkNut"], [250, "DarkNut"], [600, "DarkNut"], [1000, "DarkNut"],
				  [2200, "FireWizzrobe"], [2300, "FireWizzrobe"], [2400, "Rope"], [2500, "Rope"], [2600, "FireWizzrobe"],
				  [4000, "Armos"], [5000, "DarkNut"], [5400, "FireWizzrobe"], [6000, "FireWizzrobe"], [8000, "Armos"]]],

			[30, [[1, "Armos"], [1000, "Rope"], [1300, "Rope"], [1400, "Rope"],
				  [3000, "Armos"], [3100, "FireWizzrobe"], [3300, "FireWizzrobe"], [3400, "FireWizzrobe"],
				  [5000, "Armos"], [5100, "DarkNut"], [5300, "DarkNut"], [5400, "DarkNut"],
				  [6500, "Armos"], [7000, "Armos"]]],

			[25, [[1, "Armos"],[1000, "Armos"],[2000, "Armos"],[3000, "Armos"],[4000, "Armos"],[5000, "Armos"]]]
		],
		startMoney: 15,
		startHP: 10
	}), // Test02


	/** Simple test game. 03
	*/
	Test03: new (TowerDefense.Definition)({
		mapWidth: 8,
		mapHeight: 8,
		creepPath: [
			//[1,0], [1,1], [1,2], [2,2], [3,2], [3,3], [3,4], [3,5], [4,5], [5,5], [6,5], [7,5]
			[0,4], [1,4], [2,4], [3,4], [4,4], [4,3], [4,2], [5,2], [6,2], [7,2]
		],
		towerPlaces: [
			//[2,3], [4,4], [2,1], [5,6]
			[2,3], [4,5], [5,3], [2,5]
		],
		waves: [
			[8, [[1, "Mario"], [700, "Mario"], [1800, "Rope"], [2800, "Rope"], [4000, "DarkNut"]]],

			[8, [[1, "Mario"], [350, "Mario"], [700, "Mario"],
				  [1800, "Rope"], [2300, "Rope"], [2800, "Rope"],
				  [3800, "FireWizzrobe"], [5000, "DarkNut"]]],

			[9, [[1, "Mario"], [350, "Rope"],  [400, "Mario"], [600, "Rope"],
				  [800, "Rope"], [1000, "Rope"], [1500, "FireWizzrobe"]]],

			[12, [[1, "FireWizzrobe"], [450, "Rope"],
				  [600, "FireWizzrobe"], [900, "FireWizzrobe"], [1200, "FireWizzrobe"]]],

			[15, [[1, "FireWizzrobe"], [500, "Rope"], [550, "Rope"],
				  [600, "Rope"], [650, "Rope"], [700, "Rope"],
				  [1600, "FireWizzrobe"], [4000, "FireWizzrobe"], [4200, "FireWizzrobe"]]],

		  	[20, [[1, "DarkNut"], [500, "FireWizzrobe"], [1000, "FireWizzrobe"], [1200, "DarkNut"],
				  [1600, "FireWizzrobe"], [2500, "DarkNut"], [3000, "DarkNut"],
				  [4000, "FireWizzrobe"], [4200, "DarkNut"]]],

			[20, [[1, "DarkNut"], [250, "FireWizzrobe"], [600, "FireWizzrobe"], [1000, "DarkNut"],
				  [2200, "Rope"], [2300, "Rope"], [2400, "Rope"], [2500, "Rope"], [2600, "Rope"],
				  [4000, "FireWizzrobe"], [4200, "DarkNut"], [4400, "FireWizzrobe"], [6000, "Armos"]]],

			[25, [[1, "DarkNut"], [250, "DarkNut"], [600, "DarkNut"], [1000, "DarkNut"],
				  [2200, "FireWizzrobe"], [2300, "FireWizzrobe"], [2400, "Rope"], [2500, "Rope"], [2600, "FireWizzrobe"],
				  [4000, "Armos"], [5000, "DarkNut"], [5400, "FireWizzrobe"], [6000, "FireWizzrobe"], [8000, "Armos"]]],

			[30, [[1, "Armos"], [1000, "Rope"], [1300, "Rope"], [1400, "Rope"],
				  [3000, "Armos"], [3100, "FireWizzrobe"], [3300, "FireWizzrobe"], [3400, "FireWizzrobe"],
				  [5000, "Armos"], [5100, "DarkNut"], [5300, "DarkNut"], [5400, "DarkNut"],
				  [6500, "Armos"], [7000, "Armos"]]],

			[25, [[1, "Armos"],[1000, "Armos"],[2000, "Armos"],[3000, "Armos"],[4000, "Armos"],[5000, "Armos"]]]
		],
		startMoney: 14,
		startHP: 10
	}) // Test03 y 04
	
}; // scenarios