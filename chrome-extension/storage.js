// storage.js — chrome.storage.local wrapper with in-memory cache
// Globals: _cachedPairs, _anonOnPaste, _deanonOnCopy, _storageReady

var _cachedPairs = [];
var _anonOnPaste = true;
var _deanonOnCopy = true;

var _storageReady = new Promise(function(resolve) {
  chrome.storage.local.get(['pairs', 'anonOnPaste', 'deanonOnCopy'], function(result) {
    _cachedPairs = result.pairs || [];
    _anonOnPaste = result.anonOnPaste !== undefined ? result.anonOnPaste : true;
    _deanonOnCopy = result.deanonOnCopy !== undefined ? result.deanonOnCopy : true;
    resolve();
  });
});

chrome.storage.onChanged.addListener(function(changes, area) {
  if (area !== 'local') return;
  if (changes.pairs) {
    _cachedPairs = changes.pairs.newValue || [];
  }
  if ('anonOnPaste' in changes) {
    _anonOnPaste = changes.anonOnPaste.newValue;
  }
  if ('deanonOnCopy' in changes) {
    _deanonOnCopy = changes.deanonOnCopy.newValue;
  }
});
