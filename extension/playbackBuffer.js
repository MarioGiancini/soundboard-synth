// define variables

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let source;
let songLength;

const pre = document.querySelector('pre');
const myScript = document.querySelector('script');
const play = document.querySelector('.play');
const stop = document.querySelector('.stop');

const playbackControl = document.querySelector('.playback-rate-control');
const playbackValue = document.querySelector('.playback-rate-value');
playbackControl.setAttribute('disabled', 'disabled');

const loopStartControl = document.querySelector('.loopstart-control');
const loopStartValue = document.querySelector('.loopstart-value');
loopStartControl.setAttribute('disabled', 'disabled');

const loopEndControl = document.querySelector('.loopend-control');
const loopEndValue = document.querySelector('.loopend-value');
loopEndControl.setAttribute('disabled', 'disabled');

// use XHR to load an audio track, and
// decodeAudioData to decode it and stick it in a buffer.
// Then we put the buffer into the source

function getData() {
    source = audioCtx.createBufferSource();
    let request = new XMLHttpRequest();

    request.open('GET', 'viper.ogg', true);

    request.responseType = 'arraybuffer';


    request.onload = function() {
        var audioData = request.response;

        audioCtx.decodeAudioData(audioData, function(buffer) {
                myBuffer = buffer;
                songLength = buffer.duration;
                source.buffer = myBuffer;
                source.playbackRate.value = playbackControl.value;
                source.connect(audioCtx.destination);
                source.loop = true;

                loopStartControl.setAttribute('max', Math.floor(songLength));
                loopEndControl.setAttribute('max', Math.floor(songLength));
            },

            function(e) { console.log("Error with decoding audio data" + e.error); });

    };

    request.send();
}

// wire up buttons to stop and play audio, and range slider control

play.onclick = function() {
    getData();
    source.start(0);
    play.setAttribute('disabled', 'disabled');
    playbackControl.removeAttribute('disabled');
    loopStartControl.removeAttribute('disabled');
    loopEndControl.removeAttribute('disabled');
};

stop.onclick = function() {
    source.stop(0);
    play.removeAttribute('disabled');
    playbackControl.setAttribute('disabled', 'disabled');
    loopStartControl.setAttribute('disabled', 'disabled');
    loopEndControl.setAttribute('disabled', 'disabled');
};

playbackControl.oninput = function() {
    source.playbackRate.value = playbackControl.value;
    playbackValue.innerHTML = playbackControl.value;
};

loopStartControl.oninput = function() {
    source.loopStart = loopStartControl.value;
    loopStartValue.innerHTML = loopStartControl.value;
};

loopEndControl.oninput = function() {
    source.loopEnd = loopEndControl.value;
    loopEndValue.innerHTML = loopEndControl.value;
};


// dump script to pre element

pre.innerHTML = myScript.innerHTML;
