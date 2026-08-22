# Maintaining this repository

Split of responsibilities, updated 2026-08-22:

| Side | Owns |
| --- | --- |
| **Windows PC** | Checks out the exact version and source commit locked by the Mac release owner, builds the Windows NSIS/MSI bundles and their `.sig` files, and uploads only those Windows artifacts to the prepared draft Release. It does not choose the version, regenerate the combined manifests, or publish the Release. |
| **Mac release owner** | Coordinates the version and locked source SHA; prepares the draft; builds and signs the Apple Silicon DMG/updater bundle; combines both platforms into `latest.json` and `SHA256SUMS.txt`; verifies and publishes the complete Release; maintains `README.md` and GitHub Pages; and mirrors final artifacts to Gitea. |

One release always means one version built from one source commit. A bundle from a different SHA does
not belong in the draft even when its version string happens to match.

## Release handoff

1. **Mac locks the release.** Record the version, tag and full source commit SHA, then prepare the
   matching draft Release. Send those exact values to the Windows PC.
2. **Windows builds only the locked SHA.** Verify `git rev-parse HEAD`, build with the ZtidalCode
   branding overlay, and upload the NSIS/MSI installers plus their updater signatures to the draft.
   Report filenames, sizes and hashes back to Mac. Do not upload `latest.json` or
   `SHA256SUMS.txt`.
3. **Mac builds the same SHA.** Produce the Apple Silicon DMG, `ZtidalCode.app.tar.gz` updater payload
   and its `.sig`, then upload them to the same draft.
4. **Mac assembles the release metadata from final bytes.** `latest.json` must name the matching Mac
   and Windows updater payloads, URLs and minisign signatures. Include the Darwin keys the shipped
   client accepts (`darwin-aarch64` and, while compatibility requires it, `darwin-aarch64-app`) and
   the Windows keys emitted by the release tooling. `SHA256SUMS.txt` uses flat asset filenames so it
   works from a normal Downloads folder.
5. **Mac verifies before publishing.** Download the draft assets again, check every checksum and
   updater signature, confirm the manifest version and URLs, and ensure README/Pages describe what
   actually shipped. Publish only when both platforms are complete.
6. **Mac finishes distribution.** Publish the GitHub Release, push the reviewed README/Pages update,
   confirm the live Pages/download paths, and mirror the same final artifacts and hashes to Gitea.

Treat a published Release as immutable. Replacing a payload without replacing its signature,
`latest.json` and `SHA256SUMS.txt` leaves the updater or manual verification inconsistent. If a
published release must be repaired, coordinate the complete replacement and re-verify it as another
release operation; never patch one asset in isolation.

## The public documents, and how each goes stale

**`README.md` is the usage guide.** It goes stale when a release changes how the app is installed or
used — a platform is added, a control moves, a behaviour changes, or a claim stops being true. Keep
macOS and Windows instructions together so neither silently becomes the second-class copy.

**`docs/index.html` is the landing page.** Its version, asset names, file sizes and download URLs come
from the latest GitHub Release at load. A plain version bump needs no hand-edited version string, but a
new asset naming convention or platform promise does require a page and test update. The app picture
in the hero is drawn in CSS from the same tokens the app uses, not screenshotted, so restyle it rather
than replacing it with an image.

## Landing page mechanics you must not break

- **Bilingual, one DOM.** English is the markup; Chinese rides in `data-zh` attributes. The switcher
  stores the English in `data-en` and swaps `innerHTML`, so `data-zh` values may carry inline markup
  and must remain well-formed HTML. New user-visible text needs both languages.
- **Automatic plus explicit downloads.** `#download` is the browser-detected primary action.
  `#download-mac` and `#download-windows` must always remain visible so detection never traps someone
  on the wrong platform. Unknown platforms and API failures fall back to the Releases page.
- **Asset selection lives in `docs/release-downloads.mjs`.** For releases `v0.0.36` and newer it
  prefers an Apple Silicon (`aarch64`/`arm64`) DMG on macOS and the x64 `setup.exe` on Windows, while
  retaining sensible platform fallbacks. Run `node --test docs/release-downloads.test.mjs` after any
  change to this contract.
- **The primary button is deliberately split.** `#dl-label` belongs to the language-aware renderer;
  `#dl-size` carries the dynamic file size. Do not merge them or let one update overwrite the other.
- **`--brand` is derived, not picked.** It is the logo's hue at the lightness that keeps the same
  contrast on this page's background as the colour it replaced (currently `#77b5e9`). If the logo
  changes, re-derive it rather than eyeballing it.
- **Security copy is part of the release contract.** Mac instructions must retain the Finder
  right-click **Open** Gatekeeper path until the app is Developer ID signed and notarized. Windows
  instructions must retain the SmartScreen warning until the installers are Authenticode-signed.
  Both platforms must say that in-app updates are minisign-verified.
- `SHA256SUMS.txt` is promised on every release with flat filenames. If the asset set changes, update
  the checksum generator and the guide together.
- Never hand-edit a version into the page. If the displayed version is wrong, the latest Release or
  release lookup is wrong; fix that source of truth.

## Style

Both documents explain *why* alongside *what*, in complete sentences, and say true things about the
shipped app rather than intended things about a planned one. When the app and the document disagree,
the document is the bug — fix it to match the app, or report the app if it is the one that broke its
word.
