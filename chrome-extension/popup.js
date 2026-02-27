document.addEventListener('DOMContentLoaded', function() {
  var pairCountEl = document.getElementById('pairCount');
  var anonOnPasteEl = document.getElementById('anonOnPaste');
  var deanonOnCopyEl = document.getElementById('deanonOnCopy');
  var openOptionsEl = document.getElementById('openOptions');

  function updatePairCount(pairs) {
    var n = pairs.length;
    pairCountEl.textContent = n + ' pair' + (n !== 1 ? 's' : '');
  }

  // Load current state from storage
  chrome.storage.local.get(['pairs', 'anonOnPaste', 'deanonOnCopy'], function(result) {
    updatePairCount(result.pairs || []);
    anonOnPasteEl.checked = result.anonOnPaste !== undefined ? result.anonOnPaste : true;
    deanonOnCopyEl.checked = result.deanonOnCopy !== undefined ? result.deanonOnCopy : true;
  });

  anonOnPasteEl.addEventListener('change', function() {
    chrome.storage.local.set({ anonOnPaste: anonOnPasteEl.checked });
  });

  deanonOnCopyEl.addEventListener('change', function() {
    chrome.storage.local.set({ deanonOnCopy: deanonOnCopyEl.checked });
  });

  openOptionsEl.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });

  // Keep pair count in sync if options page changes storage
  chrome.storage.onChanged.addListener(function(changes, area) {
    if (area !== 'local' || !changes.pairs) return;
    updatePairCount(changes.pairs.newValue || []);
  });
});
