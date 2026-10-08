# Steak Monday

RSVP and order ticket for Steak Monday (Monday evening, October 26, 2026). The web address
still says steak-sunday, which is the original name. Sister site to
[The Meat Tracker](https://jakeworcester-byte.github.io/meat-tracker/).

Static site, no build step. GitHub Pages serves it straight from `main`.

## Where the answers go

A Google Form in Jake's account is the database. The page posts to it quietly,
and every submission lands in the **Steak Sunday RSVPs** Google Sheet:

| Tab | What it is |
|---|---|
| Form Responses 1 | Every submission, including resubmits |
| Host View | One row per guest (their newest answer), cocktail tally, headcount |

Guests can resubmit as often as they like. The page remembers their last order in
their own browser, and Host View always shows the newest ticket per name. Any row
whose guest name starts with `[TEST]` is hidden from Host View.

## Personal links

Add `?guest=` to preselect a name:
`https://jakeworcester-byte.github.io/steak-sunday/?guest=Heather%20Elliott`

## Changing things

Everything editable lives in `assets/config.js`: guest list, date, and the form
field IDs. Copy lives in `assets/app.js` (drinks, verdicts, kitchen wire lines).

## Publishing a change

GitHub Pages lets browsers cache files for 10 minutes. After editing a file in
`assets/`, bump the `?v=` number on its link at the bottom of `index.html` so
guests get the new version right away.
