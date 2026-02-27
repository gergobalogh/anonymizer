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
 * - Boundary matching: reject a match when it is immediately preceded or
 *   followed by an identifier character ([a-zA-Z0-9_$]).  This handles
 *   both plain word identifiers and PHP-style $variable names correctly.
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
    if (map.has(src)) continue; // skip duplicate sources
    map.set(src, dst);
    const escaped = _escapeRegex(src);
    patterns.push('(?<![a-zA-Z0-9_$])' + escaped + '(?![a-zA-Z0-9_$])');
  }

  const combined = new RegExp(patterns.join('|'), 'g');
  return text.replace(combined, function(match) {
    return map.has(match) ? map.get(match) : match;
  });
}
