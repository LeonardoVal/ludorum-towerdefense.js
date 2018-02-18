/** Gruntfile for [ludorum-towerdefense](http://github.com/LeonardoVal/ludorum-towerdefense).
*/
module.exports = function (grunt) {
	var FB_APP_PATH = 'apps/towerdefense-creatartis.firebaseapp.com/';

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		copy: {
			'firebase-app': {
				files: [
					{ src: 'node_modules/requirejs/require.js', nonull: true,
						dest: FB_APP_PATH +'public/js/require.js' },
					{ src: 'node_modules/creatartis-base/build/creatartis-base.min.js', nonull: true,
						dest: FB_APP_PATH +'public/js/creatartis-base.js' },
					{ src: 'node_modules/sermat/build/sermat-umd-min.js', nonull: true,
						dest: FB_APP_PATH +'public/js/sermat.js' },
					{ src: 'node_modules/inveniemus/build/inveniemus.min.js', nonull: true,
						dest: FB_APP_PATH +'public/js/inveniemus.js' },
					{ src: 'node_modules/ludorum/build/ludorum.min.js', nonull: true,
						dest: FB_APP_PATH +'public/js/ludorum.js' },
					{ src: 'build/ludorum-towerdefense.min.js', nonull: true,
						dest: FB_APP_PATH +'public/js/ludorum-towerdefense.js' },
				]
			}
		}
	});

	require('creatartis-grunt').config(grunt, {
		sourceNames: ["__prologue__",
			"manifest", "oop", "path", "resources", "video", "sound", "main", "logic",
			"units", "shots", "towers", "towerdefense", "ai-players", "scenarios",
			"__epilogue__"],
		deps: [
			{ id: 'creatartis-base', name: 'base' },
			{ id: 'sermat', name: 'Sermat', path: 'node_modules/sermat/build/sermat-umd-min.js' },
			{ id: 'inveniemus' }
		],
		targets: {
			build_umd: { fileName: 'build/ludorum-towerdefense', wrapper: 'umd' }
		}
	});

	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.registerTask('default', ['build']);
	grunt.registerTask('firebase', ['build', 'copy:firebase-app']);
};
