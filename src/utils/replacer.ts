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
 * - Boundary matching: reject a match when it is immediately preceded or
 *   followed by an identifier character ([a-zA-Z0-9_$]).  This handles
 *   both plain word identifiers and PHP-style $variable names correctly.
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
    if (map.has(src)) continue; // skip duplicate sources
    map.set(src, dst);
    const escaped = escapeRegex(src);
    patterns.push(`(?<![a-zA-Z0-9_$])${escaped}(?![a-zA-Z0-9_$])`);
  }

  const combined = new RegExp(patterns.join('|'), 'g');
  return text.replace(combined, (match) => map.get(match) ?? match);
}
