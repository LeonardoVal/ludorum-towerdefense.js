/* MazeStrategy ENUM
 */
var MazeStrategy = exports.MazeStrategy = {
	manhattan        : 1,
	maxDXDY          : 2,
	diagonalShortCut : 3,
	euclidean        : 4,
	euclideanNoSQR   : 5,
	custom           : 6,
	air              : 7
};

/* Direction ENUM
 */
var Direction = exports.Direction = {
	right : 0,
	top : 1,
	left : 2,
	bottom : 3,
};

var Steps = exports.Steps = {
	WithDiagonals : [[0, -1], [1, 0], [0, 1], [-1, 0], [1, -1], [1, 1], [-1, 1], [-1, -1]],
	OnlyStraight : [[0, -1], [1, 0], [0, 1], [-1, 0]],
};

/* Point STRUCT
 */
var Point = exports.Point = Class.extend({
	init: function(x, y) {
		this.x = x || 0;
		this.y = y || 0;
	},
	clone: function() {
		return new Point(this.x, this.y);
	},
	add: function(pt) {
		return new Point(this.x + pt.x, this.y + pt.y);
	},
	subtract: function(pt) {
		return new Point(this.x - pt.x, this.y - pt.y);
	},
	projectOn: function(pt) {
		return this.x * pt.x + this.y * pt.y;
	},
	norm: function() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	},
	square: function() {
		return this.x * this.x + this.y * this.y;
	},
	scale: function(factor) {
		return new Point(this.x * factor, this.y * factor);
	},
	normalize: function() {
		var norm = 1.0 / this.norm();
		return this.scale(norm);
	},
	regularize: function() {
		if (this.x === 0 && this.y === 0)
			return new Point(2 * Math.round(Math.random()) - 1, 2 * Math.round(Math.random()) - 1);

		return this;
	},
	toDirection: function() {
		if (this.x > this.y)
			return this.x > -this.y ? Direction.right : Direction.top;
		else if (this.x > -this.y)
			return Direction.bottom;
		return Direction.left;
	},
});

/* Size STRUCT
 */
var Size = exports.Size = Class.extend({
	init: function(width, height) {
		this.width = width || 0;
		this.height = height || 0;
	},
	clone: function() {
		return new Size(this.width, this.height);
	},
	divide: function(sz) {
		return new Size(this.width / sz.width, this.height / sz.height);
	}
});

/* Maze CLASS
 */
var Maze = exports.Maze = Class.extend({
	init: function(size, path, turrets) {
		this.gridDim = size;
		var grid = [];

		for (var i = 0; i < size.width + 1; i++) {
			var a = [];

			for (var j = 0; j < size.height; j++)
				a.push(1);

			grid.push(a);
		}

		this.grid = grid;
		this.path = path;
		this.start = path[0];
		this.end = path[path.length-1];
		this.paths = {};
		this.turrets = turrets;
	},
	
	tryBuild: function(point, weight) {
		if (this.grid[point.x][point.y] !== 1)
			return false;

		for (var i = 0; i < this.turrets.length; i++) {
			if (this.turrets[i].x == point.x && this.turrets[i].y == point.y) {
				this.grid[point.x][point.y] = weight || 0;
				return true;
			}
		}
		return false;
	},
	tryRemove: function(point) {
		if (this.grid[point.x][point.y] !== 1) {
			this.grid[point.x][point.y] = 1;
			this.paths = {};
			return true;
		}
		
		return false;
	},
	getPath: function() {
		return this.path;
	}
});

