// --- AudioDevice (Base Class) ---
function AudioDevice(name) {
	var _volume = 100; // Master volume
	var _deviceName = name;

	this.setVolume = function (v) {
		if (typeof v === "number" && v >= 0 && v <= 100) _volume = v;
	};

	this.getVolume = function () {
		return _volume;
	};

	this.getName = function () {
		return _deviceName;
	};
}

// --- MediaFile ---
function MediaFile(name, extension, size, duration) {
	this.name = name;
	this.extension = extension;
	this.size = size;
	this.duration = duration;
}

MediaFile.prototype.info = function () {
	return (
		this.name +
		this.extension +
		", " +
		this.size +
		"MB, " +
		this.duration +
		"s"
	);
};

// --- MemoryCard ---
function MemoryCard(type, capacityMB) {
	var _connectedTo = null;
	var _files = [];
	var _usedSpace = 0;

	this.type = type;
	this.capacity = capacityMB;

	this.getUsedSpace = function () {
		return _usedSpace;
	};

	this.getFiles = function () {
		return _files.slice();
	};

	this.getConnectedController = function () {
		return _connectedTo;
	};

	this.connect = function (controller) {
		if (_connectedTo === null) {
			_connectedTo = controller;
			return true;
		} else {
			console.log(
				"Memory card already connected to controller:",
				_connectedTo.getName()
			);
			return false;
		}
	};

	this.disconnect = function () {
		_connectedTo = null;
	};

	this.addFile = function (file) {
		if (!(file instanceof MediaFile)) return;
		if (file.size + _usedSpace <= this.capacity) {
			_files.push(file);
			_usedSpace += file.size;
		} else {
			console.log("Not enough space to add file", file.name);
		}
	};
}

// --- AudioDriver ---
function AudioDriver(name, channels) {
	AudioDevice.call(this, name);
	var _channelVolumes = Array(channels).fill(100);
	var _connectedTo = null;
	var _totalChannels = channels;

	this.setChannelVolume = function (channel, v) {
		if (
			channel >= 0 &&
			channel < _totalChannels &&
			typeof v === "number" &&
			v >= 0 &&
			v <= 100
		)
			_channelVolumes[channel] = v;
	};

	this.getChannelVolume = function (channel) {
		return _channelVolumes[channel];
	};

	this.connect = function (controller) {
		_connectedTo = controller;
	};

	this.getConnectedController = function () {
		return _connectedTo;
	};

	this.info = function () {
		return {
			name: this.getName(),
			masterVolume: this.getVolume(),
			channelVolumes: _channelVolumes.slice(),
			connectedTo: _connectedTo ? _connectedTo.getName() : null,
		};
	};
}

AudioDriver.prototype = Object.create(AudioDevice.prototype);
AudioDriver.prototype.constructor = AudioDriver;

// --- AudioController ---
function AudioController(name, supportedTypes, maxDrivers) {
	AudioDevice.call(this, name);
	var _memoryCard = null;
	var _drivers = [];
	var _currentFileIndex = 0;
	var _currentTime = 0;
	var _isPlaying = false;
	var _playTimeout;
	var _autoPlay = true;

	var self = this;

	this.setAutoPlay = function (value) {
		_autoPlay = !!value;
	};

	this.getAutoPlay = function () {
		return _autoPlay;
	};

	this.connectMemoryCard = function (card) {
		if (card && typeof card.connect === "function" && card.connect(this)) {
			_memoryCard = card;
			console.log("Memory card connected");
		} else {
			console.log("Cannot connect memory card.");
		}
	};

	this.disconnectMemoryCard = function () {
		if (_memoryCard) {
			_memoryCard.disconnect();
			_memoryCard = null;
		}
	};

	this.addDriver = function (driver) {
		if (_drivers.length < maxDrivers) {
			driver.connect(this);
			_drivers.push(driver);
		}
	};

	this.playPause = function () {
		if (!_memoryCard) return console.log("No memory card inserted");
		var files = _memoryCard.getFiles();
		if (files.length === 0) return console.log("No files to play");
		var file = files[_currentFileIndex];
		if (supportedTypes.indexOf(file.extension) === -1)
			return console.log("Unsupported format");

		if (_isPlaying) {
			clearTimeout(_playTimeout);
			_isPlaying = false;
			console.log("Paused at", _currentTime, "s");
		} else {
			_isPlaying = true;
			(function play() {
				if (!_isPlaying) return;
				if (_currentTime >= file.duration) {
					console.log("Finished playing", file.name);
					_currentTime = 0;
					_isPlaying = false;
					if (_autoPlay) {
						self.next();
						setTimeout(function () {
							self.playPause();
						}, 1000);
					}
					return;
				}
				console.log(
					"Playing",
					file.name,
					"-",
					_currentTime,
					"/",
					file.duration
				);
				_currentTime++;
				_playTimeout = setTimeout(play, 1000);
			})();
		}
	};

	this.next = function () {
		_currentTime = 0;
		var files = _memoryCard.getFiles();
		if (files.length > 0) {
			_currentFileIndex = (_currentFileIndex + 1) % files.length;
		}
	};

	this.prev = function () {
		_currentTime = 0;
		var files = _memoryCard.getFiles();
		if (files.length > 0) {
			_currentFileIndex =
				(_currentFileIndex - 1 + files.length) % files.length;
		}
	};

	this.info = function () {
		return {
			name: this.getName(),
			memoryCardConnected: !!_memoryCard,
			drivers: _drivers.map(function (d) {
				return d.getName();
			}),
			volume: this.getVolume(),
			currentFile: _memoryCard
				? _memoryCard.getFiles()[_currentFileIndex]
				: null,
			currentTime: _currentTime,
			isPlaying: _isPlaying,
			autoPlay: _autoPlay,
		};
	};
}

AudioController.prototype = Object.create(AudioDevice.prototype);
AudioController.prototype.constructor = AudioController;

// --- Tests ---
/* 
var file1 = new MediaFile("track1", ".mp3", 5, 10);
var file2 = new MediaFile("track2", ".mp3", 8, 12);

var card1 = new MemoryCard("Flash", 50);
card1.addFile(file1);
card1.addFile(file2);

var driver1 = new AudioDriver("Headphones", 2);
var driver2 = new AudioDriver("Speakers", 2);

var ctrl1 = new AudioController("MP3 Player", [".mp3", ".wav"], 2);
var ctrl2 = new AudioController("Mixer", [".mp3", ".wav"], 1);

// Test 1: connect card to ctrl1
ctrl1.connectMemoryCard(card1);
// Test 2: try to connect the same card to another controller (should fail)
ctrl2.connectMemoryCard(card1);
// Test 3: connect drivers
ctrl1.addDriver(driver1);
ctrl1.addDriver(driver2);
// Test 4: play/pause
ctrl1.playPause();
setTimeout(() => ctrl1.playPause(), 3000);
// Test 5: next track
setTimeout(() => {
	ctrl1.next();
	ctrl1.playPause();
}, 5000);
// Test stop
setTimeout(() => ctrl1.setAutoPlay(0), 30000);
 */
