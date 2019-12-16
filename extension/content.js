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
    console.log('LOOK!', request, sender);

    if (typeof request.type !== 'undefined' && request.type === 'load') {

        let resources = window.performance.getEntriesByType("resource");

        console.log('checking resources from content.js:', url, resources);

        // Parse the active window resources
        Promise.all(resources
            .map(resource => filterResource(resource)) // returns just the resource url names
            .filter(function (resource, index, self) {
                // filter our non-audio undefined items and only use unique values
                // https://codeburst.io/javascript-array-distinct-5edc93501dc4
                return typeof resource !== "undefined" && self.indexOf(resource) === index;
            })
        ).then(soundboardUrls => {
            console.log('Found sounds', soundboardUrls);

            // send message to background to update badge and storage value
            chrome.runtime.sendMessage({
                type: 'loaded',
                total: soundboardUrls.length.toString(),
                url: url,
                urls: soundboardUrls
            }, function (response) {
                if (response && typeof response.keyMap !== 'undefined') {
                    chrome.runtime.sendMessage({
                        type: 'map_keys',
                        keyMap: response.keyMap
                    });
                } else {
                    console.log('Could not do key mapping from storage', response);
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
        console.log('Doing initial sound check', soundboardUrls);

        // send message to background to update badge and storage value
        chrome.runtime.sendMessage({
            type: 'loaded',
            total: soundboardUrls.length.toString(),
            url: url,
            urls: soundboardUrls
        });

    });
};
