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

function getAudioSources() {
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
    return audioUrls;
}

function mapUrlsAndParams(soundboardUrls, urlParams) {
    urlParams = typeof urlParams === 'object' ? urlParams : {};
    soundboardUrls.concat(getAudioSources()).filter(function (resource, index, self) {
        return typeof resource !== "undefined" && self.indexOf(resource) === index;
    }).map(url => {
        /**
         * Parse the resource URL
         * @link https://developer.mozilla.org/en-US/docs/Web/API/URL
         * @link https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
         * @type {URL}
         */
        let urlParsed = new URL(url);
        let params = {},
            urlOnly = urlParsed.origin + urlParsed.pathname;

        // Loop through any search params and add them to our object
        for (const [param, value] of urlParsed.searchParams) {
            params[param] = value;
        }

        // If this URL has any params lets add them to our params object to use when loading
        if (Object.keys(params)) {
            urlParams[urlOnly] = params;
        }

        // Return the resource URL without the query string
        return urlOnly;
    });

    return [ soundboardUrls, urlParams ];
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
            // Now merge any found audio element sounds with Resource sounds and separate any query params
            let urlParams = {};
            [soundboardUrls, urlParams] = mapUrlsAndParams(soundboardUrls, urlParams);

            // send message to background to update badge and storage value
            chrome.runtime.sendMessage({
                type: 'loaded',
                total: soundboardUrls.length.toString(),
                url: url,
                urls: soundboardUrls,
                params: urlParams
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
                urls: soundboardUrls,
                params: urlParams
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
        // Now merge any found audio element sounds with Resource sounds and separate any query params
        let urlParams = {};
        [soundboardUrls, urlParams] = mapUrlsAndParams(soundboardUrls, urlParams);

        console.log('Soundboard Synth initial sound check found this many sounds:', soundboardUrls.length);

        // send message to background to update badge and storage value
        chrome.runtime.sendMessage({
            type: 'loaded',
            total: soundboardUrls.length.toString(),
            url: url,
            urls: soundboardUrls,
            params: urlParams
        });

    });
};
