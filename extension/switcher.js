class Switcher {

    channels;
    currentTime;
    duration;
    index;
    loaded;
    num; // how many audio instances loaded
    _playbackRate;
    soundBoard; // instance of SoundBoard
    src;

    constructor(src, soundBoard, channels) {
        this.channels = [];
        this.num = channels;
        this.index = 0;
        this.loaded = 0;
        this.currentTime = 0;
        this.soundBoard = soundBoard;
        this.playbackRate = 1; // needs to be after soundBoard since we check it
        this.src = src;

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
            this.soundBoard.loadedResource(this.src);
        }
    }

    play() {
        let audio = this.channels[this.index++];
        audio.playbackRate = this.playbackRate;
        audio.currentTime = this.currentTime;
        audio.play();
        this.index = this.index < this.num ? this.index : 0;
    }

    pause() {
        this.channels[this.index].pause();
    }

    unpause() {
        this.channels[this.index].pause();
    }

    stop() {
        console.log('Stopping channels');
        this.channels.forEach(function(channel, index) {
            channel.pause();
            channel.currentTime = 0;
        });
    }

    reset() {
        this.channels[this.index].pause();
        this.channels[this.index].currentTime = 0;
        this.index = 0;
        this.currentTime = 0;
    }
}
