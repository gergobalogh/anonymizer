export interface WordPair {
  id: string;
  from: string;
  to: string;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Single-pass replacement to avoid cascading substitutions.
 *
 * Strategy:
 * - Sort pairs by source length descending so longer tokens match before
 *   shorter ones (prevents "foo" stealing a match inside "foobar").
 * - Combine all patterns into one regex and run a single .replace() pass.
 */
export function replace(text: string, pairs: WordPair[], reverse = false): string {
  const valid = pairs.filter((p) => (reverse ? p.to : p.from).length > 0);
  if (valid.length === 0) return text;

  const sorted = [...valid].sort((a, b) => {
    const lenA = (reverse ? a.to : a.from).length;
    const lenB = (reverse ? b.to : b.from).length;
    return lenB - lenA;
  });

  const map = new Map<string, string>();
  const patterns: string[] = [];

  for (const pair of sorted) {
    const src = reverse ? pair.to : pair.from;
    const dst = reverse ? pair.from : pair.to;
    const key = src.toLowerCase();
    if (map.has(key)) continue; // skip duplicate sources ignoring case
    map.set(key, dst);
    patterns.push(escapeRegex(src));
  }

  const combined = new RegExp(patterns.join('|'), 'gi');
  return text.replace(combined, (match) => map.get(match.toLowerCase()) ?? match);
}
