/**
 * The options page scripts.
 */
'use strict';

let stopDownload = false;

function createDropDown(title, id, items, isLink) {
  const dropDown = document.createElement('div'),
      dropDownTrigger = document.createElement('div'),
      button =  document.createElement('button'),
      buttonTitle =  document.createElement('span'),
      buttonIcon =  document.createElement('span'),
      i =  document.createElement('i'),
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
      fragment = document.createDocumentFragment();

  anchors.forEach(anchor => {
    anchor.addEventListener('click', handleLinkClicks);
  });

  console.log()

  chrome.storage.local.getBytesInUse(null, function (bytesInUse) {
    const total = document.getElementById('all-settings');
    total.innerText = 'Storage used: ' + (bytesInUse > 0 ? bytesInUse / 1000 : 0) + 'MB';
  });

  chrome.storage.local.get(null, function(items) {
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
          removeButton = document.createElement('button'),
          downloadButton = document.createElement('button');

      let hasKeyMap = false,
          dropDown = null;

      tr.setAttribute('data-url', page);

      // Loop through each pages key map and sound files
      Object.keys(items[page]).forEach(function(item, x) {

        if (item === 'keyMap' && Object.keys(items[page][item]).length) {
          hasKeyMap = true;
        }

        if (item === 'urls' && items[page][item].length) {
          let numSounds = items[page][item].length;
          let title = numSounds + ' Sound' + (numSounds > 1 ? 's' : '');
          dropDown = createDropDown(title, index, items[page][item], true);
        }
      });

      // Build table row
      th.innerHTML = '<a href="' + page + '" target="_blank">' + page + '</a>';
      keyMap.innerHTML = hasKeyMap ? '<i class="fas fa-keyboard" aria-hidden="true" title="Has a keyboard map"></i>' : '<i class="fas fa-ban" aria-hidden="true" title="No keyboard map"></i>';
      soundUrls.classList.add('sound-urls');
      if (dropDown) {
        soundUrls.appendChild(dropDown);
      } else {
        soundUrls.innerText = 'None';
      }

      let textCentered = [keyMap, soundUrls, removePage, exportPage, downloadSounds];
      textCentered.forEach((column) =>  {
        column.classList.add('has-text-centered');
      });

      // Build remove button
      removeButton.classList.add('button', 'remove');
      removeButton.setAttribute('title', 'Remove Page?');
      removeButton.addEventListener('click', function(event) {
        removeSoundboard(removeButton);
      });
      removeButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
      removePage.appendChild(removeButton);

      // Build export button
      exportPage.innerHTML = '<button class="button remove" title="Click To Export Page Settings"><i class="fas fa-file-export"></i></button>';

      // Build download button
      downloadButton.innerHTML = '<i class="fas fa-download"></i>';
      downloadButton.classList.add('button', 'remove');
      downloadButton.setAttribute('title', 'Click To Download All Sounds');
      downloadButton.addEventListener('click',  event => {
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
      tr.appendChild(keyMap);
      tr.appendChild(soundUrls);
      tr.appendChild(exportPage);
      tr.appendChild(downloadSounds);
      tr.appendChild(removePage);
      fragment.appendChild(tr);
      table.appendChild(fragment);
    });

  });

  let tabLinks = document.querySelectorAll(".tab-link");

  tabLinks.forEach(tab => {
    tab.addEventListener('click', function (event) {
      console.log('CLICK TAB', event.currentTarget);
      openTab(this, this.href.split('#')[1]);
    })
  });

  // Get all "navbar-burger" elements
  const navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

  // Check if there are any navbar burgers
  if (navbarBurgers.length > 0) {

    // Add a click event on each of them
    navbarBurgers.forEach( el => {
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
  console.log(tab, tabName);
  tabContent = document.querySelectorAll(".tab-content");
  tabContent.forEach((tab, index) => {
    tab.style.display = "none";
  });

  tabLinks = document.querySelectorAll(".tab-link");
  tabLinks.forEach((link, index) => {
    console.log(link.classList);
    link.classList.remove('is-active');
  });

  console.log('Show tab:', tabName);
  document.getElementById(tabName).style.display = "block";
  tab.classList.add('is-active');
}

function removeSoundboard(button) {
  let url = button.closest('tr').dataset.url;
  if (confirm('Are you sure you want to remove the page? \n' + url + '\n\nThis cannot be undone.')) {
    chrome.storage.local.remove(url, function(removed) {
      console.log('Item removed', url, removed);
      let el = document.querySelector('tr[data-url="' + url + '"]');
      el.remove();
    });
  }
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

function showDownloadModal(page, count, flavorText) {
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
  modal.id = 'download';
  background.classList.add('modal-background');
  card.classList.add('modal-card');
  cardTitle.classList.add('modal-card-title');
  cardTitle.innerHTML = 'Preparing Download From ' + page;
  cardHeader.classList.add('modal-card-head');
  cardBody.classList.add('modal-card-body');
  cardBody.innerHTML = `
    <p>${flavorText}</p>
    <p>Downloading <span id="current">1</span> of <span id="count">${count}</span></p>
    <progress id="progress" class="progress is-primary is-large" value="1" max="100">0%</progress>
    <p>A zip file will download automatically once complete.</p>
  `;
  cardFooter.classList.add('modal-card-foot');
  closeButton.classList.add('close', 'delete');
  cancelButton.classList.add('cancel', 'button');
  cancelButton.innerText = 'cancel';
  closeButton.setAttribute('aria-label', 'close');
  closeButton.addEventListener('click', function(event) {
    modal.classList.add('fade-out');
    setTimeout(function() {
      modal.style.display = 'none';
      modal.remove();
    }, 400)
  });
  cancelButton.addEventListener('click', function(event) {
    modal.classList.add('fade-out');
    setTimeout(function() {
      modal.style.display = 'none';
      modal.remove();
    }, 400);
    ga('send', {
      hitType: 'event',
      eventCategory: 'Options',
      eventAction: 'click',
      eventLabel: page
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
 * Get the location properties of a url by creating an anchor element.
 * Get the domain by using a.hostname
 * @param url string
 * @return {HTMLAnchorElement}
 */
function getLocation(url) {
  const a = document.createElement("a");
  a.href = url;
  return a;
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
      domain = getLocation(page).hostname;

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
        percent = Math.floor(fileCount/files.length * 100).toString();

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
            eventLabel: page
          });
        });
  }
}

function handleLinkClicks(event) {
  ga('send', 'event', {
    eventCategory: 'Options',
    eventAction: 'click',
    eventLabel: event.target.href,
    transport: 'beacon'
  });
}
