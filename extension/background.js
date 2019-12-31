/**
 * The background script.
 */

/**
 * @var chrome
 * @link https://developer.chrome.com/extensions/
 */

'use strict';

chrome.runtime.onInstalled.addListener(function () {
    // TODO: DO we need to do anything on initial soundboard synth installation?
    // console.log('Soundboards installed.');
});

/**
 * Here's where merging of found sounds and stored sounds happens, then store updated sounds
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // use local for now to debug, then change to sync

    if (typeof request.type !== 'undefined' && request.type === 'loaded') {
        console.log('REQUEST: loaded', request);

        let soundboardUrls = [],
            keyMap = {};

        if (request.total > 0) {
            chrome.browserAction.setBadgeText({"text": request.total});
            chrome.browserAction.setBadgeBackgroundColor({"color": "#00d1b2"});

            // Get currently stored sound files and key mappings by unique url
            // Do storage of update within callback of get request
            chrome.storage.local.get([request.url], function(result) {
                if (result[request.url] && typeof result[request.url] !== 'undefined' && typeof result[request.url].urls !== 'undefined') {
                    console.log('Soundboard files currently are ', request.url, result);
                    soundboardUrls = result[request.url].urls;
                } else {
                    console.log('No soundboard found at:', request.url, result);
                }

                if (result[request.url] && typeof result[request.url].keyMap !== 'undefined') {
                    console.log('Keymaps currently are ', result[request.url].keyMap);
                    keyMap = result[request.url].keyMap;
                } else {
                    console.log('No keymaps found at:', request.url, result);
                }

                // Combine any stored urls with new found urls and only store unique
                const allUrls = request.urls.concat(soundboardUrls).filter(function (resource, index, self) {
                    return typeof resource !== "undefined" && self.indexOf(resource) === index;
                });

                let storeSoundboard = {
                    urls: allUrls,
                    keyMap: keyMap,
                    params: request.params // always store updated params since these could change
                };

                chrome.storage.local.set({[request.url]: storeSoundboard}, function () {
                    console.log('Soundboards updated.', {[request.url]: storeSoundboard});
                });

                // Now add other info to pass along that does need to be stored
                storeSoundboard.url = request.url;
                storeSoundboard.message = "Soundboards updated";

                sendResponse(storeSoundboard);

            });

        } else {
            chrome.browserAction.setBadgeText({"text": ""});
        }

    }
});



// When we switch tabs lets update the badge to reflect how many audio files we have on hand
chrome.tabs.onActivated.addListener(function (tab) {
    chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
        let url = tabs[0].url.split(/[#?]/)[0],
            badge = '';

        console.log('On Activated', url);

        chrome.storage.local.get([url], function(result) {
            if(typeof result[url] !== 'undefined' && typeof result[url].urls !== 'undefined') {
                badge = result[url].urls.length.toString();
            }
            chrome.browserAction.setBadgeText({"text": badge});

            console.log('Tab changed to: ', tab, url, result);
        });

    });

    // TODO: Should check for existing soundboard urls based on url and update badge
});

// When the user clicks on the extension icon
chrome.browserAction.onClicked.addListener(function (tab) {
    console.log('Soundboard opened!', tab);
});
