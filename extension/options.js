/**
 * The options page scripts.
 */
'use strict';

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
      fragment = document.createDocumentFragment();

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
          removeButton = document.createElement('button');

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

      removeButton.classList.add('button', 'remove');
      removeButton.setAttribute('title', 'Remove Page?');
      removeButton.addEventListener('click', function(event) {
        removeSoundboard(removeButton);
      });
      removeButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
      removePage.appendChild(removeButton);
      exportPage.innerHTML = '<button class="button remove" title="Click To Export Page Settings"><i class="fas fa-file-export"></i></button>';
      downloadSounds.innerHTML = '<button class="button remove" title="Click To Download All Sounds"><i class="fas fa-download"></i></button>';

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

}
