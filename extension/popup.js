// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

// chrome.runtime.getBackgroundPage(function callback)

console.log('popup loaded');

const checkSounds = document.getElementById('checkSounds'),
    mapKey = document.getElementById('mapKey'),
    startDelay = document.getElementById("start"),
    playbackSpeed = document.getElementById("speed"),
    sample = document.getElementById("sample"),
    retrigger = document.getElementById("retrigger"),
    startOutput = document.getElementById("startOutput"),
    speedOutput = document.getElementById("speedOutput"),
    speedAll = document.getElementById('speedAll'),
    sounds = document.getElementById('sounds'),
    options = document.getElementById('options'),
    message = document.getElementById('message'),
    keys = document.querySelectorAll('.keyboard .key:not(.disabled)'),
    modal = document.getElementById("myModal"),
    info = document.getElementById("info"),
    stop = document.getElementById("stop"),
    close = document.getElementsByClassName("close")[0],
    anchors = document.getElementsByTagName('a'),
    soundboard = new SoundBoard();

speedAll.addEventListener('change', (event) => {
    soundboard.speedAll = !!event.target.checked;
});

// When the user clicks on the button, open the modal
info.onclick = function() {
    modal.style.display = "block";
};

// When the user clicks on <span> (x), close the modal
close.onclick = function() {
    modal.style.display = "none";
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
};

// After popup is loaded
document.addEventListener('DOMContentLoaded', function (e) {
    // Open links in new tabs
    for (let i = 0, length = anchors.length; i < length; i++) {
        let anchor = anchors[i];
        anchor.onclick = function(event) {
            chrome.tabs.create({url: this.getAttribute('href')});
            return false;
        };
    }

    // Check if we already have sound urls stored, but delay enough to let popup.html show
    setTimeout(checkForSounds, 50);
});

soundboard.playbackSpeedControl = playbackSpeed;
soundboard.playbackSpeedDisplay = speedOutput;


startOutput.innerHTML = startDelay.value; // Display the default slider value
speedOutput.innerHTML = playbackSpeed.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
startDelay.oninput = function() {
    startOutput.innerHTML = this.value;
};

playbackSpeed.oninput = function() {
    speedOutput.innerHTML = this.value;
    console.log(parseFloat(this.value));
    soundboard.speed = parseFloat(this.value);

};

for (const key of keys) {
    key.addEventListener('mousedown', function(event) {
        let keyCode = event.target.dataset.code;
        const keyDown = new KeyboardEvent(
            'keydown',
            {
                keyCode: keyCode
            });

        if (keyCode === soundboard.speedUp || soundboard.speedDown) {
            playbackSpeed.value = speedOutput.innerHTML = soundboard.speed;
        }

        // Dispatch the sudo key down event
        let dispatched = document.body.dispatchEvent(keyDown);
    });
    key.addEventListener('mouseup', function(event) {
        let keyCode = event.target.dataset.code;
        const keyUp = new KeyboardEvent(
            'keyup',
            {
                keyCode: keyCode
            });


        message.innerText = keyCode;

        if (keyCode === soundboard.speedUp || soundboard.speedDown) {
            playbackSpeed.value = speedOutput.innerHTML = soundboard.speed;
        }

        // Dispatch the sudo key up event
        let dispatched = document.body.dispatchEvent(keyUp);
    })
}

sample.onclick = function (element) {
    if (sounds.options.length > 1) {

        let key = parseInt(sounds.options[sounds.selectedIndex].value),
            soundUrl = sounds.options[sounds.selectedIndex].innerText,
            startOffset = parseInt(startDelay.value);

        let sound = soundboard.sounds[soundUrl];

        console.log('Sample sound: ', key, sound, startOffset);

        if (sound instanceof Switcher || sound instanceof Audio) {
            sound.currentTime = startOffset ? startOffset / 100 * sound.duration : 0;

            console.log(sound.currentTime, typeof sound.currentTime);

            sound.play();
        } else {
            message.innerText = 'Oops! Error playing sound. Try reloading.';
        }

    } else {
        message.innerText = 'No sounds loaded yet!';
    }
};

sounds.onchange = function (element) {
    let soundUrl = sounds.options[sounds.selectedIndex].innerText;
    console.log('Sound change', soundUrl, typeof soundboard.sounds[soundUrl] !== 'undefined' ? soundboard.sounds[soundUrl] : 'undefined');
    if (typeof soundboard.sounds[soundUrl] === 'undefined') {
        soundboard.loadSound(soundUrl, 1);
    }
};

stop.onclick = function (element) {
    soundboard.stop();
    console.log('Stop clicked');
};

checkSounds.onclick = function (element) {
    checkForSounds(true)
};

options.onclick = function (element) {
    if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
    } else {
        window.open(chrome.runtime.getURL('options.html'));
    }
};

// TODO: finish key mapping storage and retrieval

mapKey.onclick = function (element) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {

        if (sounds.options.length > 1) {

            let key = parseInt(sounds.options[sounds.selectedIndex].value),
                soundRetrigger = retrigger.checked,
                soundUrl = sounds.options[sounds.selectedIndex].innerText,
                url = tabs[0].url.split(/[#?]/)[0];

            soundboard.url = url;

            console.log(sounds, key, url, soundRetrigger, tabs[0].url);

            soundboard.mapKey(soundUrl, soundRetrigger, parseInt(startDelay.value));

            message.innerText = 'Press a key to complete mapping';

            // Keymap storage is done in Soundboard class setKeyMapCode()

            //chrome.tabs.sendMessage(tabs[0].id, {type: 'map_key', key: key, delay: parseInt(startDelay.value)}, mapComplete);
        } else {
            message.innerText = 'No sounds loaded yet!';
        }

    });
};

function checkForSounds(force) {

    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {

        if (force) {
            console.log('Rechecking for audio files...');
            chrome.tabs.sendMessage(tabs[0].id, {type: 'load'}, showResources);
        } else {
            // Get array of current sound files by unique url of the current tab
            const thisUrl = [tabs[0].url.split(/[#?]/)[0]];
            soundboard.url = thisUrl;
            chrome.storage.local.get(thisUrl, function (result) {

                if (typeof result[thisUrl] !== 'undefined' && typeof result[thisUrl].urls !== 'undefined' && result[thisUrl].urls.length) {
                    console.log('Soundboard currently is ', result[thisUrl]);
                    // send saved url and soundboard resources
                    showResources(result);
                } else {
                    console.log('No soundboard files saved yet so sending to background...', tabs[0].url, result);
                    chrome.tabs.sendMessage(tabs[0].id, {type: 'load'}, showResources);

                }

            });
        }
    });
}

function showResources(response) {
    const resources = document.getElementById('message');
    const sounds = document.getElementById('sounds');``
    let message = "No audio files found. Try reloading the page or extension.";

    console.log('SHOW RESOURCES',response);

    if (response && typeof response[soundboard.url] !== "undefined" && typeof response[soundboard.url].urls !== "undefined" && response[soundboard.url].urls.length) {
        message = "Loading " + response[soundboard.url].urls.length + " sound files...";

        loadResources(response[soundboard.url].urls, response[soundboard.url].keyMap);

    } else if (response && typeof response.type !== 'undefined' && response.type === 'initialize') {
        // initial load of page shouldn't have stored key maps
        loadResources(response.urls, false)
    } else {
        resources.textContent = message;
    }


    console.log('Response', response);
}

function loadResources(urls, keyMap) {
    const resources = document.getElementById('message');
    const sounds = document.getElementById('sounds');
    let message = "No audio files found. Try reloading the page or extension.";

    // reset all exist options
    sounds.innerHTML = '<option value="" disabled>Select A Sound</option>';

    urls.forEach(function (sound, index) {
        let option = document.createElement('option');
        option.value = index;
        option.innerText = sound;

        sounds.appendChild(option);
    });

    // Set stored key map
    if (keyMap && typeof keyMap === 'object') {
        soundboard.keyMap = keyMap;
    }

    soundboard.setResources(urls);
    // soundboard.loadSounds();

    // Check if the first selected sound exists as a Switcher in soundboard.sounds,
    // if not load it with a single channel
    if (typeof soundboard.sounds[urls[0]] === 'undefined') {
        soundboard.loadSound(urls[0], 1);
    }
}

// function loadSoundBoard() {
//
// }



// chrome.runtime.onMessage.addListener(
//     function(request, sender, sendResponse) {
//         if (request.type === "start_soundboard") {
//             // Build soundboard from class
//             soundboard.setResources(soundboardUrls);
//             soundboard.loadSounds();
//         }
//     }
// );

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        // if map_keys
        if (request.type === "map_keys") {
            // Soundboard is ready to map
            console.log('Got KEY MAP!', request);
            soundboard.keyMap = request.keyMap;
        }
    }
);
