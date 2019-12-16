class Switcher {

    channels;
    currentTime;
    duration;
    index;
    loaded;
    num; // how many audio instances loaded
    _playbackRate;
    soundBoard; // instance of SoundBoard
    skipOnLoad; // skip notify when the Switcher is fully loaded
    src;

    constructor(src, soundBoard, channels, skipOnLoad) {
        this.channels = [];
        this.num = channels;
        this.index = 0;
        this.loaded = 0;
        this.currentTime = 0;
        this.soundBoard = soundBoard;
        this.playbackRate = 1; // needs to be after soundBoard since we check it
        this.src = src;
        this.skipOnLoad = !!skipOnLoad;

        let switcher = this;

        for (let i = 0; i < this.num; i++) {
            let audio = new Audio(src);
            audio.addEventListener('loadedmetadata', function(e) {
                switcher.checkLoaded();
                if (!i) {
                    switcher.duration = this.duration;
                }
            });

            this.channels.push(audio);
        }
    }

    get playbackRate() {
        return this._playbackRate;
    }

    set playbackRate(rate) {
        this._playbackRate = rate;
        if (this.soundBoard.speedAll) {
            this.channels.forEach(function(channel, index) {
                channel.playbackRate = rate;
            });
        }
    }

    checkLoaded() {
        this.loaded++;

        if (this.loaded === this.num) {
            this.loadComplete = true;
            this.soundBoard.loadedResource(this.src, this.skipOnLoad);

            ga('send', {
                hitType: 'event',
                eventCategory: 'Audio',
                eventAction: 'loaded',
                eventLabel: this.src,
                eventValue: this.duration
            });
        }
    }

    play() {
        this.index++;
        this.index = this.index < this.num ? this.index : 0;
        let audio = this.channels[this.index];
        audio.playbackRate = this.playbackRate;
        audio.currentTime = this.currentTime && typeof this.currentTime === 'number' ? this.currentTime : 0;
        audio.play();
    }

    pause() {
        this.channels[this.index].pause();
    }

    stop() {
        const switcher = this;
        let wasPlaying = false;
        this.channels.forEach(function(channel, index) {
            if (!channel.paused) {
                wasPlaying = true;
                channel.pause();
                channel.currentTime = switcher.currentTime;
            }
        });

        // Stop is called on all Switchers so on send events no sources that were playing
        if (wasPlaying) {
            ga('send', {
                hitType: 'event',
                eventCategory: 'Audio',
                eventAction: 'stop',
                eventLabel: switcher.src
            });
        }
    }

    reset() {
        this.channels[this.index].pause();
        this.channels[this.index].currentTime = 0;
        this.index = 0;
        this.currentTime = 0;
    }
}
