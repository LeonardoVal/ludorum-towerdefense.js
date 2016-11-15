/*
 * The Sound class
 */
var Sound = exports.Sound = Class.extend({
	init: function(tag, loop) {
		this.source = tag.src;
		this.loop = !!loop;
		this.setVolume(1.0);
	},
	setVolume: function(value) {
		this.volume = Math.max(0, Math.min(1, value));

		if (this.element)
			this.element.volume = Sound.volume * this.volume;
	},
	play: function() {
		if (this.element || Sound.active > Sound.channels)
			return;

		var me = this;
		me.element = Sound.createAudio(this.source);
		me.setVolume(me.volume);
		var ended = function() {
			if (me.loop) {
				this.currentTime = 0;
				this.play();
			} else {
				me.element = undefined;
				this.removeEventListener('ended', ended);
				Sound.destroyAudio(this);
			}
		};

		me.element.addEventListener('ended', ended);

		if (Sound.enabled)
			me.element.play();
	},
}, function(sounds) {
	var deposit = [];
	sounds.volume = 1.0;
	sounds.channels = 6;
	sounds.active = 0;
	sounds.sounds = [];
	sounds.enabled = true;
	sounds.createAudio = function(src) {
		var d;
		sounds.active++;

		for (var i = deposit.length; i--; ) {
			d = deposit[i];

			if (!d.active && d.src === src) {
				d.active = true;
				d.element.currentTime = 0;
				return d.element;
			}
		}

		d = {
			active:true,
			src:src,
			element:new Audio(src),
		};
		deposit.push(d);
		return d.element;
	};
	sounds.destroyAudio = function(element) {
		sounds.active--;

		for (var i = deposit.length; i--; ) {
			if (deposit[i].element === element) {
				deposit[i].active = false;
				break;
			}
		}
	};
	sounds.disable = function() {
		if (sounds.enabled) {
			sounds.enabled = false;

			for (var i = deposit.length; i--; ) {
				if (deposit[i].active)
					deposit[i].element.pause();
			}
		}
	};
	sounds.enable = function() {
		if (!sounds.enabled) {
			sounds.enabled = true;

			for (var i = deposit.length; i--; ) {
				if (deposit[i].active)
					deposit[i].element.play();
			}
		}
	};
	sounds.setVolume = function(volume) {
		volume = Math.min(Math.max(volume, 0), 1);
		var change = volume / sounds.volume;
		sounds.volume = volume;

		for (var i = deposit.length; i--; )
			deposit[i].element.volume = change * deposit[i].element.volume;
	};
});