# Anonymizer

A single-page app that anonymizes and deanonymizes text using user-defined word pair substitutions.

## Usage

1. **Word List** — add `from → to` pairs (e.g. `Amazon → CompanyA`)
2. **Anonymize** — paste text, click Anonymize; all `from` values are replaced with their `to` counterparts
3. **Deanonymize** — paste anonymized text, click Deanonymize; replacements are reversed

Matching is case-insensitive and applies to partial matches, so `Akeneo` will also match inside `AkeneoProductCollectionBuilder` and `$akeneoEntities`.

## JSON Import Format

Word pairs can be imported from a JSON file. The file must be an array of objects with `from` and `to` string fields:

```json
[
  { "from": "Amazon", "to": "CompanyA" },
  { "from": "John Smith", "to": "Person1" },
  { "from": "secret-api-key", "to": "API_KEY" }
]
```

- The `id` field is optional and ignored on import — new IDs are assigned automatically
- Import **merges** into the existing list; pairs whose `from` already exists are skipped
- Objects missing `from` or `to` (or with non-string values) are silently skipped

The easiest way to get a valid file is to build your list in the app and use **Export JSON**, then use that file as a template.
