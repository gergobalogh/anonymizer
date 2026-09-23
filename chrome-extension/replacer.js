// replacer.js — verbatim port of src/utils/replacer.ts to vanilla JS globals
// Exports globals: _escapeRegex, _anonReplace

function _escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Single-pass replacement to avoid cascading substitutions.
 *
 * Strategy:
 * - Sort pairs by source length descending so longer tokens match before
 *   shorter ones (prevents "foo" stealing a match inside "foobar").
 * - Combine all patterns into one regex and run a single .replace() pass.
 *
 * @param {string} text
 * @param {Array<{id: string, from: string, to: string}>} pairs
 * @param {boolean} reverse
 * @returns {string}
 */
function _anonReplace(text, pairs, reverse) {
  if (reverse === undefined) reverse = false;
  const valid = pairs.filter(function(p) { return (reverse ? p.to : p.from).length > 0; });
  if (valid.length === 0) return text;

  const sorted = valid.slice().sort(function(a, b) {
    const lenA = (reverse ? a.to : a.from).length;
    const lenB = (reverse ? b.to : b.from).length;
    return lenB - lenA;
  });

  const map = new Map();
  const patterns = [];

  for (const pair of sorted) {
    const src = reverse ? pair.to : pair.from;
    const dst = reverse ? pair.from : pair.to;
    const key = src.toLowerCase();
    if (map.has(key)) continue; // skip duplicate sources ignoring case
    map.set(key, dst);
    patterns.push(_escapeRegex(src));
  }

  const combined = new RegExp(patterns.join('|'), 'gi');
  return text.replace(combined, function(match) {
    const key = match.toLowerCase();
    return map.has(key) ? map.get(key) : match;
  });
}
