import { useState, useRef } from 'react';
import { WordPair } from '../utils/replacer.ts';

interface Props {
  pairs: WordPair[];
  setPairs: (pairs: WordPair[]) => void;
}

function newId(): string {
  return crypto.randomUUID();
}

export default function WordListPage({ pairs, setPairs }: Props) {
  const [fromVal, setFromVal] = useState('');
  const [toVal, setToVal] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    const from = fromVal.trim();
    const to = toVal.trim();
    if (!from || !to) {
      setError('Both fields are required.');
      return;
    }
    if (pairs.some((p) => p.from === from)) {
      setError(`"${from}" already exists.`);
      return;
    }
    setPairs([...pairs, { id: newId(), from, to }]);
    setFromVal('');
    setToVal('');
    setError('');
  }

  function handleDelete(id: string) {
    setPairs(pairs.filter((p) => p.id !== id));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAdd();
  }

  function handleExport() {
    const json = JSON.stringify(pairs, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'anonymizer-pairs.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as unknown;
        if (!Array.isArray(parsed)) throw new Error('Expected an array.');
        const imported: WordPair[] = (parsed as { from?: unknown; to?: unknown }[])
          .filter((item) => typeof item.from === 'string' && typeof item.to === 'string')
          .map((item) => ({
            id: newId(),
            from: item.from as string,
            to: item.to as string,
          }));
        // Merge: skip duplicates by "from"
        const existingFroms = new Set(pairs.map((p) => p.from));
        const newPairs = imported.filter((p) => !existingFroms.has(p.from));
        setPairs([...pairs, ...newPairs]);
        setError(
          newPairs.length > 0
            ? `Imported ${newPairs.length} pair(s).`
            : 'No new pairs to import (all duplicates).',
        );
      } catch {
        setError('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-imported
    e.target.value = '';
  }

  return (
    <div className="word-list-page">
      <div className="add-form">
        <input
          className="text-input"
          type="text"
          placeholder="From (original)"
          value={fromVal}
          onChange={(e) => setFromVal(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <span className="arrow">→</span>
        <input
          className="text-input"
          type="text"
          placeholder="To (replacement)"
          value={toVal}
          onChange={(e) => setToVal(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="btn btn-primary" onClick={handleAdd}>
          Add
        </button>
      </div>

      {error && <p className="form-msg">{error}</p>}

      <div className="list-actions">
        <span className="pair-count">{pairs.length} pair{pairs.length !== 1 ? 's' : ''}</span>
        <button className="btn btn-sm" onClick={handleExport} disabled={pairs.length === 0}>
          Export JSON
        </button>
        <button className="btn btn-sm" onClick={handleImportClick}>
          Import JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
      </div>

      {pairs.length === 0 ? (
        <p className="empty-msg">No word pairs yet. Add one above.</p>
      ) : (
        <div className="table-wrapper">
          <table className="pairs-table">
            <thead>
              <tr>
                <th>From (original)</th>
                <th>To (replacement)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pairs.map((pair) => (
                <tr key={pair.id}>
                  <td>
                    <code>{pair.from}</code>
                  </td>
                  <td>
                    <code>{pair.to}</code>
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(pair.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
