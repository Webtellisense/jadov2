# Jado M0.5 fixture media

These assets were created for the ten fictional M0.5 businesses. They are not Google content, competitor assets, owner-supplied photographs or evidence of real work.

- Logos: ten original SVG emblems authored for Jado, each with a distinct motif. White/pale backgrounds and a padded `object-fit: contain` tile preserve the whole mark.
- Photography: 36 original images generated with OpenAI image generation on 16 November 2026. Six contact sheets were generated specifically for the ten businesses, sliced into separate photographs and encoded as local WebP assets. No third-party photographer or competitor content was copied.
- `PROVENANCE.json` records original contact-sheet filenames, SHA-256 hashes, business mapping, extraction coordinates, output dimensions and encoded byte counts. Original generation sources remain in the task workspace, while all deployable assets are committed here.
- Each photograph has a smaller 320px variant for Data Saver/responsive loading. Full card assets stay below 60,000 bytes. A local Next Image loader selects the existing files; no remote image host or billed image-transform API is used.

The seed stores media paths and descriptive alt text in its namespaced PostgreSQL records. Repeating the seed uses these same committed assets deterministically; it never generates new images at runtime. The single staging disclosure outside main content identifies the demonstration nature of businesses, imagery and contact details.
