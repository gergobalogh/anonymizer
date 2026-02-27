var _optPairs = [];

function _escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function _showMsg(text, isError) {
  var el = document.getElementById('formMsg');
  el.textContent = text;
  el.className = 'form-msg' + (text ? (isError ? ' error' : ' success') : '');
}

function _savePairs() {
  chrome.storage.local.set({ pairs: _optPairs });
}

function _render() {
  var n = _optPairs.length;
  document.getElementById('pairCount').textContent = n + ' pair' + (n !== 1 ? 's' : '');
  document.getElementById('exportBtn').disabled = n === 0;

  var body = document.getElementById('pairsBody');
  body.innerHTML = '';

  if (n === 0) {
    document.getElementById('emptyMsg').style.display = '';
    document.getElementById('tableWrapper').style.display = 'none';
  } else {
    document.getElementById('emptyMsg').style.display = 'none';
    document.getElementById('tableWrapper').style.display = '';

    _optPairs.forEach(function(pair) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><code>' + _escHtml(pair.from) + '</code></td>' +
        '<td><code>' + _escHtml(pair.to) + '</code></td>' +
        '<td><button class="btn btn-danger btn-sm" data-id="' + _escHtml(pair.id) + '">Delete</button></td>';
      body.appendChild(tr);
    });

    body.querySelectorAll('[data-id]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        _optPairs = _optPairs.filter(function(p) { return p.id !== btn.dataset.id; });
        _savePairs();
        _render();
      });
    });
  }
}

function _handleAdd() {
  var from = document.getElementById('fromInput').value.trim();
  var to = document.getElementById('toInput').value.trim();

  if (!from || !to) {
    _showMsg('Both fields are required.', true);
    return;
  }
  if (_optPairs.some(function(p) { return p.from === from; })) {
    _showMsg('"' + from + '" already exists.', true);
    return;
  }

  _optPairs = _optPairs.concat([{ id: crypto.randomUUID(), from: from, to: to }]);
  _savePairs();
  _render();

  document.getElementById('fromInput').value = '';
  document.getElementById('toInput').value = '';
  _showMsg('', false);
}

document.getElementById('addBtn').addEventListener('click', _handleAdd);

['fromInput', 'toInput'].forEach(function(id) {
  document.getElementById(id).addEventListener('keydown', function(e) {
    if (e.key === 'Enter') _handleAdd();
  });
});

document.getElementById('exportBtn').addEventListener('click', function() {
  var json = JSON.stringify(_optPairs, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'anonymizer-pairs.json';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('importBtn').addEventListener('click', function() {
  document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', function(e) {
  var file = e.target.files[0];
  if (!file) return;

  var reader = new FileReader();
  reader.onload = function(ev) {
    try {
      var parsed = JSON.parse(ev.target.result);
      if (!Array.isArray(parsed)) throw new Error('Expected an array.');

      var imported = parsed
        .filter(function(item) {
          return typeof item.from === 'string' && typeof item.to === 'string';
        })
        .map(function(item) {
          return { id: crypto.randomUUID(), from: item.from, to: item.to };
        });

      var existingFroms = new Set(_optPairs.map(function(p) { return p.from; }));
      var newPairs = imported.filter(function(p) { return !existingFroms.has(p.from); });

      _optPairs = _optPairs.concat(newPairs);
      _savePairs();
      _render();

      _showMsg(
        newPairs.length > 0
          ? 'Imported ' + newPairs.length + ' pair(s).'
          : 'No new pairs to import (all duplicates).',
        false
      );
    } catch (_) {
      _showMsg('Invalid JSON file.', true);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

// Sync if popup or another context modifies pairs externally
chrome.storage.onChanged.addListener(function(changes, area) {
  if (area !== 'local' || !changes.pairs) return;
  _optPairs = changes.pairs.newValue || [];
  _render();
});

// Initial load
chrome.storage.local.get(['pairs'], function(result) {
  _optPairs = result.pairs || [];
  _render();
});
