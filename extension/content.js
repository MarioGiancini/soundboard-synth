/**
 * The content script.
 */

const extensions = ['m4a', 'mp3', 'ogg', 'wav'],
    url = window.location.href.split(/[#?]/)[0]; // remove queries or hashes

function filterResource(resource) {
    let file = resource.name.split(/[#?]/)[0], // remove queries or hashes
        fileExt = file.split('.').pop();
    if (fileExt && extensions.indexOf(fileExt) > -1) {
        return resource.name;
    }
}

// Get all the audio resources available on the page after window is loaded
// Then send a message with the available audio urls to background
// Background should update the extension badge to show number available
// Then badge can be clicked to do a browser action to load all Audio objects into a soundboard
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    if (typeof request.type !== 'undefined' && request.type === 'load') {

        let resources = window.performance.getEntriesByType("resource");

        // Parse the active window resources
        Promise.all(resources
            .map(resource => filterResource(resource)) // returns just the resource url names
            .filter(function (resource, index, self) {
                // filter our non-audio undefined items and only use unique values
                // https://codeburst.io/javascript-array-distinct-5edc93501dc4
                return typeof resource !== "undefined" && self.indexOf(resource) === index;
            })
        ).then(soundboardUrls => {
            // Now look through any audio element sources if available
            const audios = document.getElementsByTagName('audio');
            let audioUrls = [];
            for (let a = 0; a < audios.length; a++) {
                let soundUrl = '';
                // First check audio element for src attribute
                if (audios[a].src) {
                    soundUrl = audios[a].src;
                } else {
                    // if no src then check for <source> element
                    let sources = audios[a].getElementsByTagName('source');
                    soundUrl = sources[0] !== undefined ? sources[0].src : soundUrl;
                }

                if (soundUrl) {
                    audioUrls.push(soundUrl)
                }
            }

            // Now merge any found audio element sounds with Resource sounds
            soundboardUrls = soundboardUrls.concat(audioUrls).filter(function (resource, index, self) {
                return typeof resource !== "undefined" && self.indexOf(resource) === index;
            });

            // send message to background to update badge and storage value
            chrome.runtime.sendMessage({
                type: 'loaded',
                total: soundboardUrls.length.toString(),
                url: url,
                urls: soundboardUrls
            }, function (response) {
                // TODO: Key maps are pulled from popup.js now so may not need this
                if (response && typeof response.keyMap !== 'undefined') {
                    chrome.runtime.sendMessage({
                        type: 'map_keys',
                        keyMap: response.keyMap
                    });
                }
            });


            sendResponse({
                type: 'initialize',
                url: url,
                urls: soundboardUrls
            });
        });
    }
});

// TODO: Do we need to increase resource buffer size?
// window.performance.setResourceTimingBufferSize(1000);

window.onload = (event) => {
    // Attempt to check resources on initial page load
    Promise.all(window.performance.getEntriesByType("resource")
        .map(resource => filterResource(resource)) // returns just the resource url names
        .filter(function (resource, index, self) {
            // filter our non-audio undefined items and only use unique values
            // https://codeburst.io/javascript-array-distinct-5edc93501dc4
            return typeof resource !== "undefined" && self.indexOf(resource) === index;
        })
    ).then(soundboardUrls => {
        // Now look through any audio element sources if available
        const audios = document.getElementsByTagName('audio');
        let audioUrls = [];
        for (let a = 0; a < audios.length; a++) {
            let soundUrl = '';
            // First check audio element for src attribute
            if (audios[a].src) {
                soundUrl = audios[a].src;
            } else {
                // if no src then check for <source> element
                let sources = audios[a].getElementsByTagName('source');
                soundUrl = sources[0] !== undefined ? sources[0].src : soundUrl;
            }

            if (soundUrl) {
                audioUrls.push(soundUrl)
            }
        }

        // Now merge any found audio element sounds with Resource sounds
        soundboardUrls = soundboardUrls.concat(audioUrls).filter(function (resource, index, self) {
            return typeof resource !== "undefined" && self.indexOf(resource) === index;
        });

        console.log('Soundboard Synth initial sound check found this many sounds:', soundboardUrls.length);

        // send message to background to update badge and storage value
        chrome.runtime.sendMessage({
            type: 'loaded',
            total: soundboardUrls.length.toString(),
            url: url,
            urls: soundboardUrls
        });

    });
};
