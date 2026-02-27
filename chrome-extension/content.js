// content.js — paste/copy interceptor with toast notification
// Depends on globals from replacer.js and storage.js being loaded first.

function _showToast(message) {
  var toast = document.getElementById('__anon_toast__');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = '__anon_toast__';
    toast.style.cssText = [
      'position:fixed',
      'bottom:20px',
      'right:20px',
      'background:#161b22',
      'color:#c9d1d9',
      'border:1px solid #30363d',
      'border-radius:6px',
      'padding:8px 14px',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'font-size:13px',
      'z-index:2147483647',
      'transition:opacity 0.3s ease',
      'pointer-events:none',
      'opacity:0',
    ].join(';');
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.opacity = '1';

  clearTimeout(toast._anonTimeout);
  toast._anonTimeout = setTimeout(function() {
    toast.style.opacity = '0';
  }, 2000);
}

function _pasteHandler(event) {
  if (!_anonOnPaste || _cachedPairs.length === 0) return;

  var target = event.target;
  if (!target) return;

  var tagName = target.tagName;
  var isEditable = target.isContentEditable || tagName === 'TEXTAREA' || tagName === 'INPUT';
  if (!isEditable) return;

  var raw = event.clipboardData.getData('text/plain');
  if (!raw) return;

  var replaced = _anonReplace(raw, _cachedPairs, false);
  if (replaced === raw) return;

  event.preventDefault();

  if (target.isContentEditable) {
    // ProseMirror / contenteditable: execCommand integrates with the editor's
    // transaction model and undo stack. Deprecated but only reliable approach.
    document.execCommand('insertText', false, replaced);
  } else {
    // textarea / input: mutate value and fire React-compatible input event
    var start = target.selectionStart;
    var end = target.selectionEnd;
    var before = target.value.substring(0, start);
    var after = target.value.substring(end);
    target.value = before + replaced + after;
    target.selectionStart = target.selectionEnd = start + replaced.length;
    target.dispatchEvent(new InputEvent('input', { bubbles: true, data: replaced }));
  }

  _showToast('Anonymized on paste');
}

function _copyHandler(event) {
  if (!_deanonOnCopy || _cachedPairs.length === 0) return;

  var raw = window.getSelection().toString();
  if (!raw) return;

  var replaced = _anonReplace(raw, _cachedPairs, true);
  if (replaced === raw) return;

  event.preventDefault();
  event.clipboardData.setData('text/plain', replaced);

  _showToast('Deanonymized on copy');
}

// Wait for storage to load before attaching listeners
_storageReady.then(function() {
  document.addEventListener('paste', _pasteHandler, true);
  document.addEventListener('copy', _copyHandler, true);
});
