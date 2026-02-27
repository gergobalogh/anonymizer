import { useState } from 'react';
import { WordPair, replace } from '../utils/replacer.ts';

interface Props {
  pairs: WordPair[];
}

export default function AnonymizePage({ pairs }: Props) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  function handleAnonymize() {
    setOutput(replace(input, pairs, false));
  }

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="text-page">
      <div className="toolbar">
        <button className="btn btn-primary" onClick={handleAnonymize}>
          Anonymize
        </button>
        <button className="btn" onClick={handleCopy} disabled={!output}>
          {copied ? 'Copied!' : 'Copy output'}
        </button>
        {pairs.length === 0 && (
          <span className="hint">No word pairs defined — add some in Word List first.</span>
        )}
      </div>
      <div className="panels">
        <div className="panel">
          <label className="panel-label">Input</label>
          <textarea
            className="code-area"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste code or text here…"
            spellCheck={false}
          />
        </div>
        <div className="panel">
          <label className="panel-label">Output (anonymized)</label>
          <textarea
            className="code-area"
            value={output}
            readOnly
            placeholder="Anonymized output will appear here…"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
