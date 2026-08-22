# Maintaining this repository

Split of responsibilities, decided 2026-08-22:

| Side | Owns |
| --- | --- |
| **Windows** (release machine) | Building and publishing releases: the installers, `.sig` files, `latest.json`, `SHA256SUMS.txt`, the release notes. Runs `npm run release` in the source repo. |
| **Mac** (this document's reader) | `README.md` (the usage guide) and `docs/index.html` (the landing page, published by GitHub Pages from `main` under `/docs`). |

The releases themselves are not editable from here: `latest.json` is what every
installed client trusts, and its signatures are bound to the exact bytes of the
installers beside it. Touch release assets and clients stop updating.

## The two documents, and how each goes stale

**`README.md` is the usage guide.** It goes stale when a release changes how the
app is *used* — a control moves, a behaviour changes, a claim stops being true.
It has drifted silently before (it described a pin behaviour three releases
gone before anyone noticed), which is why the Windows side's release checklist
now ends with a handoff to you.

**`docs/index.html` needs editing only when a feature changes.** The version,
download link, file size and installer filename are fetched from the GitHub
releases API at load — a plain version bump needs *no* edit here, ever. The app
picture in the hero is drawn in CSS from the same tokens the app uses, not
screenshotted, so restyle it rather than replacing it with an image.

## Landing page mechanics you must not break

- **Bilingual, one DOM.** English is the markup; Chinese rides in `data-zh`
  attributes. The switcher (bottom `<script>`) stores the English in `data-en`
  on first toggle and swaps `innerHTML` — so `data-zh` values may carry inline
  markup (`<code>`, links) and must stay well-formed HTML. New user-visible text
  needs a `data-zh`, or it will sit untranslated in an otherwise Chinese page.
- **The download button is deliberately two spans.** `#dl-label` belongs to the
  language switcher; `#dl-size` belongs to the releases-API script. They were
  once one string and the two scripts overwrote each other — do not merge them.
- **`--brand` is derived, not picked.** It is the logo's hue at the lightness
  that keeps the same contrast on this page's background as the colour it
  replaced (currently `#77b5e9`). If the logo changes, re-derive; do not eyeball.
- The SmartScreen note promises `SHA256SUMS.txt` on every release, with flat
  filenames (`sha256sum -c` works in a Downloads folder). The Windows release
  script generates it; if you reword that section, keep the promise accurate.
- A strict no: never hand-edit the version anywhere in the page. If a version
  appears wrong, the release is wrong, and that is the Windows side's to fix.

## Style

Both documents explain *why* alongside *what*, in complete sentences, and say
true things about the shipped app rather than intended things about a planned
one. When the app and the document disagree, the document is the bug — fix it
to match the app, or report the app if it is the one that broke its word.
