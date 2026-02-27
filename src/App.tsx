import { useState, useEffect } from 'react';
import { WordPair } from './utils/replacer.ts';
import AnonymizePage from './pages/AnonymizePage.tsx';
import DeanonymizePage from './pages/DeanonymizePage.tsx';
import WordListPage from './pages/WordListPage.tsx';

type Page = 'anonymize' | 'wordlist' | 'deanonymize';

const STORAGE_KEY = 'anonymizer_pairs';

function loadPairs(): WordPair[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WordPair[]) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [page, setPage] = useState<Page>('anonymize');
  const [pairs, setPairs] = useState<WordPair[]>(loadPairs);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pairs));
  }, [pairs]);

  return (
    <div className="app">
      <nav className="nav">
        <span className="nav-brand">Anonymizer</span>
        <div className="nav-tabs">
          <button
            className={`nav-tab${page === 'anonymize' ? ' active' : ''}`}
            onClick={() => setPage('anonymize')}
          >
            Anonymize
          </button>
          <button
            className={`nav-tab${page === 'wordlist' ? ' active' : ''}`}
            onClick={() => setPage('wordlist')}
          >
            Word List
            {pairs.length > 0 && <span className="badge">{pairs.length}</span>}
          </button>
          <button
            className={`nav-tab${page === 'deanonymize' ? ' active' : ''}`}
            onClick={() => setPage('deanonymize')}
          >
            Deanonymize
          </button>
        </div>
      </nav>

      <main className="main">
        {page === 'anonymize' && <AnonymizePage pairs={pairs} />}
        {page === 'wordlist' && <WordListPage pairs={pairs} setPairs={setPairs} />}
        {page === 'deanonymize' && <DeanonymizePage pairs={pairs} />}
      </main>
    </div>
  );
}
