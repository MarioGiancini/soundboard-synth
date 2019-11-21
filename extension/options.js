// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';
// const kButtonColors = ['#3aa757', '#e8453c', '#f9bb2d', '#4688f1'];
// function constructOptions(kButtonColors) {
//   for (let item of kButtonColors) {
//     let button = document.createElement('button');
//     button.style.backgroundColor = item;
//     button.addEventListener('click', function() {
//       chrome.storage.sync.set({color: item}, function() {
//         console.log('color is ' + item);
//       })
//     });
//     page.appendChild(button);
//   }
// }
// constructOptions(kButtonColors);


document.addEventListener('DOMContentLoaded', function () {

  const bg = chrome.extension.getBackgroundPage(),
      total = document.createElement('div'),
      list = document.createElement('ul');

  chrome.storage.local.get(null, function(items) {
    let allKeys = Object.keys(items);
    console.log(allKeys);
    allKeys.forEach(function (key, index) {
      const li = document.createElement('li'),
          strong = document.createElement('strong'),
          code = document.createElement('code');
      strong.innerText = key + ': ';
      code.innerText = JSON.stringify(items[key]);
      code.style.display = 'block';
      code.style.textOverflow = 'none';
      li.appendChild(strong);
      li.appendChild(code);
      list.appendChild(li);
    });

    total.innerText = allKeys.toString();

  });
  document.body.appendChild(total);
  document.body.appendChild(list);


  // Object.keys(bg.soundboards).forEach(function (url) {
  //   const div = document.createElement('div');
  //   div.textContent = JSON.stringify(bg);
  //   document.body.appendChild(div);
  // })
}, false);
