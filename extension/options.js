/**
 * The options page scripts.
 */
'use strict';

let stopDownload = false;
let allSoundboards;

function createDropDown(title, id, items, isLink) {
    const dropDown = document.createElement('div'),
        dropDownTrigger = document.createElement('div'),
        button = document.createElement('button'),
        buttonTitle = document.createElement('span'),
        buttonIcon = document.createElement('span'),
        i = document.createElement('i'),
        dropDownMenu = document.createElement('div'),
        dropDownContent = document.createElement('div');

    // Build dropdown
    dropDown.classList.add('dropdown', 'is-right');
    dropDown.setAttribute('id', 'dropdown-' + id);
    dropDownTrigger.classList.add('dropdown-trigger');
    button.classList.add('button');
    button.setAttribute('aria-haspopup', 'true');
    button.setAttribute('aria-controls', 'dropdown-menu' + id);
    buttonTitle.innerText = title;
    buttonIcon.classList.add('icon', 'is-small');
    i.classList.add('fas', 'fa-angle-down');
    i.setAttribute('aria-hidden', 'true');
    dropDownMenu.classList.add('dropdown-menu');
    dropDownMenu.setAttribute('id', 'dropdown-menu' + id);
    dropDownContent.classList.add('dropdown-content');

    dropDown.addEventListener('click', function (event) {
        event.stopPropagation();
        this.classList.toggle('is-active');
        closeDropDowns(this.id);
    });

    buttonIcon.appendChild(i);
    button.appendChild(buttonTitle);
    button.appendChild(buttonIcon);
    dropDownTrigger.appendChild(button);

    // Add dropdown items
    if (items.length) {
        items.forEach((item, index) => {
            const dropDownItem = document.createElement('div');
            dropDownItem.classList.add('dropdown-item');

            if (isLink) {
                const a = document.createElement('a');
                a.setAttribute('href', item);
                a.setAttribute('target', '_blank');
                a.innerText = item;
                dropDownItem.appendChild(a);
            } else {
                dropDownItem.innerText = item;
            }
            dropDownContent.appendChild(dropDownItem);
        });
    } else {
        const dropDownItem = document.createElement('div');
        dropDownItem.classList.add('dropdown-item');
        dropDownItem.innerText = 'None';
        dropDownContent.appendChild(dropDownItem);
    }

    // put it together
    dropDownMenu.appendChild(dropDownContent);
    dropDown.appendChild(dropDownTrigger);
    dropDown.appendChild(dropDownMenu);

    return dropDown;
}


document.addEventListener('DOMContentLoaded', function () {

    const bg = chrome.extension.getBackgroundPage(),
        table = document.querySelector('.table tbody'),
        anchors = document.querySelectorAll('a'),
        fragment = document.createDocumentFragment(),
        importButton = document.getElementById('import'),
        exportAllButton = document.getElementById('export');

    anchors.forEach(anchor => {
        anchor.addEventListener('click', handleLinkClicks);
    });

    chrome.storage.local.getBytesInUse(null, function (bytesInUse) {
        const total = document.getElementById('all-settings');
        total.innerText = 'Storage used: ' + (bytesInUse > 0 ? bytesInUse / 1000 : 0) + 'MB';
    });

    chrome.storage.local.get(null, function (items) {
        // Store all soundboards for easy download since we're retrieving here
        allSoundboards = items;
        // Now create a table from all soundboards
        let allKeys = Object.keys(items);
        console.log(allKeys);
        allKeys.forEach(function (page, index) {
            const tr = document.createElement('tr'),
                th = document.createElement('th'),
                keyMap = document.createElement('td'),
                soundUrls = document.createElement('td'),
                exportPage = document.createElement('td'),
                downloadSounds = document.createElement('td'),
                removePage = document.createElement('td'),
                soloPlay = document.createElement('td'),
                soloPlayButton = document.createElement('button'),
                exportButton = document.createElement('button'),
                removeButton = document.createElement('button'),
                downloadButton = document.createElement('button');

            let hasKeyMap = false,
                dropDown = null;

            tr.setAttribute('data-url', page);

            // Check if this page has a key map
            if (typeof items[page].keyMap !== 'undefined' && Object.keys(items[page].keyMap).length) {
                hasKeyMap = true;
            }

            // Check if there's sound files and use full URL
            if (typeof items[page].urls !== 'undefined' && items[page].urls.length) {
                let pageUrls = items[page].urls,
                    numSounds = items[page].urls.length,
                    title = numSounds + ' Sound' + (numSounds > 1 ? 's' : '');

                // Check if there are url params stored and combine into full URLs
                // in case we need to access protected resources, etc
                if (typeof items[page].params !== 'undefined' && items[page].params.length) {
                    console.log('Have some params to append on', items[page], items[page].params);
                    pageUrls = items[page].urls.map(item => {
                        let queryString = Object.keys(items[page].params).map(key => {
                            return encodeURIComponent(key) + '=' + encodeURIComponent(this.params[key])
                        }).join('&');

                        return item + '?' + queryString;
                    });
                }
                // Create the dropdown from the URLs
                dropDown = createDropDown(title, index, pageUrls, true);
            }

            // Build table row
            th.innerHTML = '<a href="' + page + '" target="_blank">' + page + '</a>';

            // Build soundboard solo button
            soloPlayButton.classList.add('button', 'solo');
            soloPlayButton.setAttribute('title', 'Play Soundboard by Itself');
            soloPlayButton.innerHTML = '<i class="fas fa-play"></i>';
            soloPlayButton.addEventListener('click', function (event) {
                window.open(chrome.runtime.getURL('popup.html?soundboard=' + encodeURI(page)), '_blank');
            });
            soloPlay.appendChild(soloPlayButton);

            keyMap.innerHTML = hasKeyMap ? '<i class="fas fa-keyboard" aria-hidden="true" title="Has a keyboard map"></i>' : '<i class="fas fa-ban" aria-hidden="true" title="No keyboard map"></i>';
            soundUrls.classList.add('sound-urls');
            if (dropDown) {
                soundUrls.appendChild(dropDown);
            } else {
                soundUrls.innerText = 'None';
            }

            let textCentered = [soloPlay, keyMap, soundUrls, removePage, exportPage, downloadSounds];
            textCentered.forEach((column) => {
                column.classList.add('has-text-centered');
            });

            // Build remove button
            removeButton.classList.add('button', 'remove');
            removeButton.setAttribute('title', 'Remove Page?');
            removeButton.addEventListener('click', function (event) {
                removeSoundboard(removeButton);
            });
            removeButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
            removePage.appendChild(removeButton);

            // Build export button
            exportButton.classList.add('button', 'export');
            exportButton.setAttribute('title', 'Export Page');
            exportButton.innerHTML = '<i class="fas fa-file-export"></i>';
            exportButton.addEventListener('click', function (event) {
                exportSoundboard(exportButton);
            });
            exportPage.appendChild(exportButton);

            // Build download button
            downloadButton.innerHTML = '<i class="fas fa-download"></i>';
            downloadButton.classList.add('button', 'download');
            downloadButton.setAttribute('title', 'Click To Download All Sounds');
            downloadButton.addEventListener('click', event => {
                const tr = downloadButton.closest('tr'),
                    url = tr.dataset.url,
                    soundAnchors = document.querySelectorAll('tr[data-url="' + url + '"] .sound-urls .dropdown-item a');

                let soundUrls = [];

                soundAnchors.forEach(function (a) {
                    soundUrls.push(a.href);
                });

                downloadSoundFiles(soundUrls, url).then(result => {
                    console.log('Download complete', result);
                });
            });
            downloadSounds.appendChild(downloadButton);

            tr.appendChild(th);
            tr.appendChild(soloPlay);
            tr.appendChild(keyMap);
            tr.appendChild(soundUrls);
            tr.appendChild(exportPage);
            tr.appendChild(downloadSounds);
            tr.appendChild(removePage);
            fragment.appendChild(tr);
            table.appendChild(fragment);
        });

    });

    // Add listeners to top import and export buttons
    importButton.addEventListener('click', function (event) {
        // Do import
        showImportModal();
    });

    exportAllButton.addEventListener('click', function (event) {
        console.log('Downloading all soundboards...', allSoundboards);
        downloadObjectAsJson(allSoundboards, 'all');
    });

    // Hook up tab links
    let tabLinks = document.querySelectorAll(".tab-link");

    tabLinks.forEach(tab => {
        tab.addEventListener('click', function (event) {
            openTab(this, this.href.split('#')[1]);
        })
    });

    // Get all "navbar-burger" elements
    const navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

    // Check if there are any navbar burgers
    if (navbarBurgers.length > 0) {

        // Add a click event on each of them
        navbarBurgers.forEach(el => {
            el.addEventListener('click', () => {

                // Get the target from the "data-target" attribute
                const target = el.dataset.target;
                const $target = document.getElementById(target);

                console.log(target, $target);

                // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
                el.classList.toggle('is-active');
                $target.classList.toggle('is-active');

            });
        });
    }
}, false);

document.addEventListener('click', function (event) {
    closeDropDowns();
});

function closeDropDowns(excludeId) {
    excludeId = excludeId ? excludeId : '';
    const dropDowns = document.querySelectorAll('.dropdown:not(.is-hoverable)');
    dropDowns.forEach(function (dropdown) {
        if (dropdown.id !== excludeId) {
            dropdown.classList.remove('is-active');
        }
    });
}

function openTab(tab, tabName) {
    let tabContent, tabLinks;
    tabContent = document.querySelectorAll(".tab-content");
    tabContent.forEach((tab, index) => {
        tab.style.display = "none";
    });

    tabLinks = document.querySelectorAll(".tab-link");
    tabLinks.forEach((link, index) => {
        link.classList.remove('is-active');
    });

    console.log('Show tab:', tabName);
    document.getElementById(tabName).style.display = "block";
    tab.classList.add('is-active');
}

function removeSoundboard(button) {
    let url = button.closest('tr').dataset.url;
    if (confirm('Are you sure you want to remove the page? \n' + url + '\n\nThis cannot be undone.')) {
        chrome.storage.local.remove(url, function (removed) {
            console.log('Item removed', url, removed);
            let el = document.querySelector('tr[data-url="' + url + '"]');
            el.remove();
        });
    }
}

function exportSoundboard(button) {
    let url = button.closest('tr').dataset.url;
    chrome.storage.local.get(url, function (data) {
        console.log('Downloading soundboard page', url, data);
        downloadObjectAsJson(data, getDomainFromUrl(url));
    });
}

function downloadObjectAsJson(exportObj, exportName) {
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj)),
        downloadAnchorNode = document.createElement('a'),
        currentTime = new Date().getTime();
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${exportName}-${currentTime}.json`);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    ga('send', {
        hitType: 'event',
        eventCategory: 'Options',
        eventAction: 'export',
        eventLabel: exportName
    });
}

function showNotification(type, header, message) {
    const article = document.createElement('article'),
        messageHeader = document.createElement('div'),
        p = document.createElement('p'),
        messageBody = document.createElement('div'),
        closeButton = document.createElement('button');

    article.classList.add('message', type);
    p.innerHTML = header;
    messageBody.innerHTML = message;
    closeButton.classList.add('delete');
    closeButton.setAttribute('aria-label', 'delete');

    messageHeader.appendChild(p);
    messageHeader.appendChild(closeButton);

    article.appendChild(messageHeader);
    article.appendChild(messageBody);

}

function showImportModal() {
    let event = 'import',
        title = 'Import Soundboards',
        id = 'importSoundboards',
        content = `
    <p>Select a single soundboard export file or an multi-soundboard export file.</p>
    <input type="file" id="${id}" accept="text/json,.json">
    `;
    showModal(title, content, event);
    document.getElementById(id).addEventListener("change", importSoundboards, false);
}

function showDownloadModal(page, count, flavorText) {
    let event = 'download',
        title = 'Preparing Download From ' + page,
        content = `
    <p>${flavorText}</p>
    <p>Downloading <span id="current">1</span> of <span id="count">${count}</span></p>
    <progress id="progress" class="progress is-primary is-large" value="1" max="100">0%</progress>
    <p>A zip file will download automatically once complete.</p>
  `;
    showModal(title, content, event)
}

function showModal(title, content, modalEvent) {
    const modal = document.createElement('div'),
        background = document.createElement('div'),
        card = document.createElement('div'),
        cardTitle = document.createElement('p'),
        cardHeader = document.createElement('header'),
        cardBody = document.createElement('section'),
        cardFooter = document.createElement('footer'),
        closeButton = document.createElement('button'),
        cancelButton = document.createElement('button');

    modal.classList.add('modal', 'is-active');
    modal.id = modalEvent;
    background.classList.add('modal-background');
    card.classList.add('modal-card');
    cardTitle.classList.add('modal-card-title');
    cardTitle.innerHTML = title;
    cardHeader.classList.add('modal-card-head');
    cardBody.classList.add('modal-card-body');
    cardBody.innerHTML = content;
    cardFooter.classList.add('modal-card-foot');
    closeButton.classList.add('close', 'delete');
    cancelButton.classList.add('cancel', 'button');
    cancelButton.innerText = 'cancel';
    closeButton.setAttribute('aria-label', 'close');
    closeButton.addEventListener('click', function (event) {
        modal.classList.add('fade-out');
        setTimeout(function () {
            modal.style.display = 'none';
            modal.remove();
        }, 400);
        ga('send', {
            hitType: 'event',
            eventCategory: 'Options',
            eventAction: 'click',
            eventLabel: 'closeModal'
        });
    });
    cancelButton.addEventListener('click', function (event) {
        modal.classList.add('fade-out');
        setTimeout(function () {
            modal.style.display = 'none';
            modal.remove();
        }, 400);
        ga('send', {
            hitType: 'event',
            eventCategory: 'Options',
            eventAction: 'click',
            eventLabel: 'cancel' + modalEvent.replace(/^\w/, c => c.toUpperCase())
        });
    });

    // Put the modal together
    cardHeader.appendChild(cardTitle);
    cardHeader.appendChild(closeButton);
    cardFooter.appendChild(cancelButton);
    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    card.appendChild(cardFooter);

    modal.appendChild(background);
    modal.appendChild(card);
    document.body.appendChild(modal);
}

/**
 * Fetch a blob from a URL
 * @param url
 * @return {Promise<boolean|Blob>}
 */
async function fetchBlob(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }
        const blob = await response.blob();
        console.log('Audio blob created', blob);
        return blob;
    } catch (error) {
        console.log('There has been a problem with your fetch operation: ', error.message);
        return false;
    }
}

/**
 * Get the domain of a url by creating an anchor element.
 * @link https://stackoverflow.com/questions/8498592/extract-hostname-name-from-string/8498668#8498668
 * @param url string
 * @return {HTMLAnchorElement}
 */
function getDomainFromUrl(url) {
    let a = document.createElement('a'),
        hostName;
    a.href = url;
    hostName = a.hostname;
    a.remove();
    return hostName;
}

/**
 * Download all the audio files from an array of urls
 * @param files
 * @param page
 * @return {Promise<boolean|void>}
 */
async function downloadSoundFiles(files, page) {
    const zip = new JSZip(),
        today = new Date(),
        domain = getDomainFromUrl(page);

    let successes = [],
        failures = [],
        readme = 'This is a generated file created from Soundboard Synth.\nSounds downloaded from: ' + page,
        folderName = 'soundboard-' + domain + '-' + today.getTime(),
        fileCount = 1;

    const folder = zip.folder(folderName);
    let flavorText = 'Woah... whatcha gonna do with all those sound files bruh?? Grab a <i class="fas fa-coffee"></i> this make take a sec...'
    showDownloadModal(page, files.length, flavorText);

    for (const file of files) {
        let sound = await fetchBlob(file),
            current = document.getElementById('current'),
            progress = document.getElementById('progress'),
            percent = Math.floor(fileCount / files.length * 100).toString();

        if (stopDownload) {
            break;
        }

        if (sound) {
            let fileName = file.replace(/^.*[\\\/]/, '');
            successes.push(file);

            // Add a file to the directory,
            folder.file(fileName, sound);
        } else {
            failures.push(file);
        }
        // Show progress
        current.innerText = fileCount.toString();
        progress.value = percent;
        progress.innerText = percent;
        fileCount++;
    }

    if (stopDownload) {
        console.log('Download cancelled');
        // Fade out and close the modal
        document.querySelector(domain + '.close').click();
        return false;
    } else {

        // Update readme with successes and failures
        if (successes.length) {
            readme += '\n\nDownloaded Successfully: \n';
            readme += successes.join('\n');
        }

        if (failures.length) {
            readme += '\n\nFailed To Download: \n';
            readme += failures.join('\n');
            readme += '\n\nNOTE: Download failures can happen for a number of reasons. Sometimes websites use authorization tokens to access sounds. Try revisiting the page, click play on the desired sounds, then click "Check For Sounds" button to reload. Then retry the download.\n\n';
        }

        readme += '\n\nThanks for using Soundboard Synth!! <3 https://soundboardsynth.com';

        // Add a readme text file listing sound file and page contents
        folder.file("_readme.txt", readme);

        // Generate the zip file asynchronously
        zip.generateAsync({type: "blob"})
            .then(function (content) {
                // Force down of the Zip file using FileSaver
                saveAs(content, folderName + '.zip');
                // Fade out and close the modal
                document.querySelector('#download .close').click();

                ga('send', {
                    hitType: 'event',
                    eventCategory: 'Options',
                    eventAction: 'download',
                    eventLabel: domain
                });
            });
    }
}

/**
 * Handles files from and file input as the event handler directly
 * @link https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications
 */
function importSoundboards() {
    const files = this.files;
    const file = files[0];
    const reader = new FileReader();
    console.log('Found Soundboard import file:', file);
    reader.onload = function (event) {
        const soundBoards = JSON.parse(event.target.result),
            soundBoardUrls = Object.keys(soundBoards);
        console.log('Read import file', soundBoards);
        for (let f = 0; f < soundBoardUrls.length; f++) {
            let soundBoard = soundBoardUrls[f];
            // Set imported soundboard's keymap and resources
            chrome.storage.local.set({[soundBoard]: soundBoards[soundBoard]}, function () {
                console.log(`Imported ${soundBoard}`, soundBoards[soundBoard]);
            });
        }
        console.log('Finished Import!');
        window.location.reload();
    };
    reader.readAsText(file);
}

function handleLinkClicks(event) {
    ga('send', 'event', {
        eventCategory: 'Options',
        eventAction: 'click',
        eventLabel: event.target.href,
        transport: 'beacon'
    });
}
