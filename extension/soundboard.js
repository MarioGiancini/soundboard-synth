class SoundBoard {

    numSounds;
    extensions = ['m4a', 'mp3', 'ogg', 'wav'];
    sounds = {};
    _speed = 1;
    speeds = [];
    speedAll = false;
    controls = {};
    _volume = 1;
    _resources = [];
    resourcesLoaded = 0;
    loaded;
    randomSessions = {};
    resetReplay = false;
    stopPrevious = false;
    previousSound;
    mapRetrigger;
    mapSound;
    mapStart = 0;
    _keyMap = {};
    body;
    message;
    playbackSpeedControl;
    playbackSpeedDisplay;
    playStartControl;
    playStartDisplay;
    playSampleControl;

    constructor(numSounds) {
        this.numSounds = numSounds && Number.isInteger(numSounds) ? numSounds : 20;
        this.body = document.querySelector('body');
        this.message = document.getElementById("message");
        this.playbackSpeedControl = document.getElementById("speed");
        this.playbackSpeedDisplay = document.getElementById("speedOutput");
        this.playStartControl = document.getElementById("start");
        this.playStartDisplay = document.getElementById("startOutput");
        this.playSampleControl = document.getElementById("sample");

        for (let i = 1; i <= 16; i++) {
            this.speeds.push(i * .25);
        }

        this.controls = {
            speedUp: 187, // "=" or "+" key
            speedDown: 189, // "-" key
            playSample: 32, // space key
            startForward: 39, // right arrow key
            startBackward: 37 // left arrow key
        };

        console.log('Speeds set:', this.speeds);

        // Add keyboard listeners
        let soundBoard = this;
        this.body.onkeydown = function(e) {

            let keyCode = e.keyCode,
                keyName = e.key;
            let key = document.querySelector('[data-code="' + keyCode + '"]');

            if (key) {

                key.classList.add('tap');

                if (keyCode === soundBoard.controls.speedUp) {
                    let newSpeedKey = soundBoard.speeds.indexOf(soundBoard.speed) + 1,
                        maxSpeedKey = soundBoard.speeds.length - 1;

                    soundBoard.speed = newSpeedKey >= maxSpeedKey ? soundBoard.speeds[maxSpeedKey] : soundBoard.speeds[newSpeedKey];
                    console.log('Playback speed set to ' + soundBoard.speed);
                    soundBoard.playbackSpeedControl.value = soundBoard.playbackSpeedDisplay.innerHTML = soundBoard.speed;

                    chrome.runtime.sendMessage({
                        type: "speed",
                        data: {
                            type: "basic",
                            iconUrl: "images/get_started128.png",
                            title: "Sound Speed Increase",
                            message: "Sound speed set to " + soundBoard.speed
                        }, function(response) {
                            console.log(response);
                        }
                    });

                } else if (keyCode === soundBoard.controls.speedDown) {
                    let newSpeedKey = soundBoard.speeds.indexOf(soundBoard.speed) - 1;

                    soundBoard.speed = newSpeedKey < 0 ? soundBoard.speeds[0] : soundBoard.speeds[newSpeedKey];
                    console.log('Playback speed set to ' + soundBoard.speed);
                    soundBoard.playbackSpeedControl.value = soundBoard.playbackSpeedDisplay.innerHTML = soundBoard.speed;

                    chrome.runtime.sendMessage({
                        type: "speed",
                        data: {
                            type: "basic",
                            iconUrl: "images/get_started48.png",
                            title: "Sound Speed Decrease",
                            message: "Sound speed set to " + soundBoard.speed
                        }, function(response) {
                            console.log(response);
                        }
                    });
                } else if (keyCode === soundBoard.controls.startForward) {
                    let startVal = parseInt(soundBoard.playStartControl.value) + 5;
                    if (startVal > 100) {
                        startVal = 100;
                    }
                    soundBoard.playStartControl.value = soundBoard.playStartDisplay.innerHTML = startVal;
                } else if (keyCode === soundBoard.controls.startBackward) {
                    let startVal = parseInt(soundBoard.playStartControl.value) - 5;
                    if (startVal < 0) {
                        startVal = 0;
                    }
                    soundBoard.playStartControl.value = soundBoard.playStartDisplay.innerHTML = startVal;
                } else if (keyCode === soundBoard.controls.playSample) {
                    soundBoard.playSampleControl.click();
                }

                // If we have a sound url ready to be mapped, store it to keyMap
                if (soundBoard.mapSound) {

                    soundBoard.setKeyMapCode(keyCode, keyName);

                    key.classList.add('mapped');

                    // load mapped sound
                    soundBoard.loadSound(soundBoard.mapSound, soundBoard.mapRetrigger ? 1 : soundBoard.numSounds);

                    // Reset mapping values
                    soundBoard.mapRetrigger = null;
                    soundBoard.mapSound = null;
                    soundBoard.mapStart = 0;

                    // Show mapping complete
                    soundBoard.message.innerText = 'Mapping complete!';
                    console.log('Mapping complete. You mapped the ' + keyName + ' key to ' + soundBoard.sounds[soundBoard._keyMap[keyCode].src].src);
                } else if (typeof soundBoard._keyMap[keyCode] !== 'undefined') {
                    let sound = soundBoard.sounds[soundBoard._keyMap[keyCode].src],
                        startOffset = soundBoard._keyMap[keyCode].start;

                    sound.currentTime = startOffset && typeof startOffset === 'number' ? (startOffset / 100) * sound.duration : 0;

                    soundBoard.play(sound, keyCode);
                    soundBoard.message.innerText = soundBoard._keyMap[keyCode].src;
                }
            }
        };

        this.body.onkeyup = function (e) {
            let key = document.querySelector('[data-code="' + e.keyCode + '"]');
            if (key) {
                key.classList.remove('tap');
            }
        };

        // Clear all tapped keys if we blur on the soundboard
        window.onblur = () => {
            let keys = document.querySelectorAll('.key.tap');
            keys.forEach(key => {
                key.classList.remove('tap');
            });
        };
    }

    set keyMap(map) {
        let oldMap = document.querySelectorAll('.mapped');
        // Remove old mapped keys on keyboard
        oldMap.forEach((key) => {
            key.classList.remove('mapped');
        });

        if (typeof map === 'object') {
            this._keyMap = map;
            const soundBoard = this;
            Object.keys(this.keyMap).forEach(function(key, index) {
                // remap each
                let mappedKey = document.querySelector('[data-code="' + key + '"]'),
                    map = soundBoard.keyMap[key]; // map has: key, src (url), start, and retrigger
                mappedKey.classList.add('mapped');

                // load mapped sound
                soundBoard.loadSound( map.src, map.retrigger ? 1 : soundBoard.numSounds);
            });
        }
    }

    get keyMap() {
        return this._keyMap;
    }

    setKeyMapCode(keyCode, keyName) {
        const soundBoard = this;
        soundBoard._keyMap[keyCode] = {
            key: keyName,
            src: soundBoard.mapSound, // the url of the sound, index/key of sounds object
            start: soundBoard.mapStart ? soundBoard.mapStart : 0,
            retrigger: soundBoard.mapRetrigger
        };

        const updateSoundboard = {
            keyMap: soundBoard._keyMap,
            urls: soundBoard.resources
        };

        console.log('CHECKING KEYMAP', soundBoard._keyMap);

        // Set the latest version of this soundboard's keymap and resources
        chrome.storage.local.set({[soundBoard.url]: updateSoundboard}, function () {
            console.log('Soundboard Key Map updated.', {[soundBoard.url]: updateSoundboard});
        });
    }

    set volume(int) {
        if (int > 1) {
            int = 1;
        } else if (int < 0) {
            int = 0;
        }
        this._volumne = int;
    }

    get volume() {
        return this._volume;
    }

    set speed(num) {
        if (this.speeds.indexOf(num) > -1) {
            this._speed = num;
        }
        if (this.speedAll) {
            const speed = this.speed,
                soundBoard = this;
            Object.keys(this.sounds).forEach(function (sound, index) {
                soundBoard.sounds[sound].playbackRate = speed;
            });
        }
    }

    get speed() {
        return this._speed;
    }

    set resources(resources) {
        this._resources = resources;
    }

    get resources() {
        return this._resources;
    }

    loadMappedKey(key, keyCode) {

    }

    setResources(resources) {
        this._resources = resources;
    }


    loadedResource(src) {
        this.resourcesLoaded++;
        let x = this.resourcesLoaded,
            y = this.resources.length;

        chrome.runtime.sendMessage({
            type: "loading_switcher",
            data: {
                completed: x,
                total: y,
                current: src,
            }
        });

        console.log('Loading ' + x + ' of ' + y + ' complete.', 'Audio file: ' + src);

        if (x === y) {
            console.log('All soundboard resources loaded!');
        }
    }

    play(audio, mapped) {
        if (audio instanceof Switcher) {

            if (this.stopPrevious && this.previousSound instanceof Switcher) {
                this.previousSound.pause();
                this.previousSound = null;
            }

            if (this.resetReplay) {
                audio.currentTime = 0;
            }

            if (mapped) {
                // console.log(audio.duration, audio.currentTime, mapped);
            }

            audio.playbackRate = this.speed;
            audio.play();

            this.previousSound = audio;
        } else {
            console.log('Oops.. can only play Audio objects.');
        }
    }

    stop() {
        const soundBoard = this;
        Object.keys(this.sounds).forEach(function(sound, index) {
            soundBoard.sounds[sound].stop();
        });
    }

    loadSounds() {
        const soundBoard = this;
        this.resourcesLoaded = 0;
        this.resources.forEach(function (url, index) {
            soundBoard.loadSound(url, soundBoard.numSounds);
        });
    }

    loadSound(url, numSounds) {
        this.sounds[url] = new Switcher(url, this, numSounds);
    }

    repeatSound(url, repeat) {
        if (repeat && Number.isInteger(repeat)) {
            // Reset sounds array
            this.sounds = [];
            // Add the sound for as many times requested
            for (let i = 1; i <= repeat; i++) {
                // setup Audio object to repeat
                this.sounds.push(new Switcher(url, this));
            }
        } else {
            console.log('Number of times to repeat a sound must be a number.');
        }
    }

    playInterval(int = 100) {
        if (Number.isInteger(int)) {
            console.log('Starting play interval. Total time: ' + int * this.sounds.length + 'ms');
            let soundBoard = this;
            Object.keys(soundBoard.sounds).forEach(function(audio, index) {
                let interval = int * index;
                setTimeout(function() {
                    soundBoard.play(soundBoard.sounds[audio]);
                    console.log('Doing play interval at ' + interval + ' for audio file' + audio);
                }, interval);

            });
        } else {
            console.log('Interval must be a number');
        }
    }

    playAll() {
        let soundBoard = this;
        console.log('LOUD NOISES!!!');
        Object.keys(soundBoard.sounds).forEach(function(audio, index) {
            soundBoard.play(soundBoard.sounds[audio]);
        });
    }

    playRandom(soundBoard, record) {
        soundBoard = soundBoard ? soundBoard : this;
        const soundUrls = Object.keys(soundBoard.sounds);
        let sound = Math.floor(Math.random() * Math.floor(soundUrls.length));

        soundUrls.forEach(function(url, index) {
            if (index === sound && typeof soundBoard.sounds[url] !== 'undefined' && soundBoard.sounds[url] instanceof Switcher) {
                soundBoard.play(soundBoard.sounds[url]);

                if (record && Array.isArray(soundBoard.randomSessions[record].sounds)) {
                    soundBoard.randomSessions[record].sounds.push(soundBoard.sounds[url]);
                }
            }
        });


    }

    getRandom() {
        let sound = Math.floor(Math.random() * Math.floor(this.sounds.length));
        if (typeof this.sounds[sound] !== 'undefined' && this.sounds[sound] instanceof Switcher) {
            return this.sounds[sound].src;
        } else {
            console.log('Could not find a loaded audio file.');
        }
    }

    playRandomLoop(interval, duration) {

        let soundBoard = this,
            session = new Date().getTime();

        if (!Number.isInteger(interval)) {
            interval = 1000;
        }

        if (!Number.isInteger(duration)) {
            duration = 10000;
        }

        soundBoard.randomSessions[session] = {
            interval: interval,
            sounds: []
        };

        let loop = setInterval(function() {
            soundBoard.playRandom(soundBoard, session);
        }, interval);

        setTimeout(function() {
            clearInterval(loop);
        }, duration);
    }

    playLastRandomLoop(interval) {
        let soundBoard = this,
            keys = Object.keys(this.randomSessions),
            loop;
        if (keys.length) {
            loop = this.randomSessions[keys[keys.length - 1]];
            interval = interval ? interval : loop.interval;
            loop.sounds.forEach(function (sound, index) {
                setTimeout(function() {
                    soundBoard.play(sound);
                }, interval * index);
            });
        }
    }

    mapKey(url, retrigger, start) {
        // Start should be a percentage
        if (!start || !Number.isInteger(start) || start > 100 || start < 0) {
            start = 0;
        }

        console.log('Listening for key to map sound: ' + this.sounds[url].src);

        this.mapRetrigger = retrigger;
        this.mapSound = url.toString(); // will be the key in this.sounds object
        this.mapStart = start;
    }
}
