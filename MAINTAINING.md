# Maintaining this repository — and how the macOS half joins a release

Division of labour, decided 2026-08-22 (this supersedes the split written here earlier):

| Side | Owns |
| --- | --- |
| **Windows** (release machine) | The source repository's release tooling; the Windows installers; **the release itself** — it creates and publishes `vX.Y.Z`; `latest.json`; `SHA256SUMS.txt`; the release notes; and both documents in this repository, `README.md` and `docs/index.html`. |
| **Mac** | Building the macOS app from the release's source tag and uploading **only its own files** to the release that already exists: `ZtidalCode.app.tar.gz`, its `.sig`, the DMG, `latest-mac.json`, `SHA256SUMS-mac.txt`. Nothing else. |

## Rules for the Mac side — each one has already been broken once

- **Never create, edit, delete, re-draft or re-tag a release.** `v0.0.36` was deleted by an
  automated maintainer on 2026-08-22 and had to be republished; clients mid-download got 404s.
- **Never upload a file you did not build.** `latest.json`, `SHA256SUMS.txt`, `*.exe`, `*.msi`
  are the Windows side's. Your feed is `latest-mac.json`; it is a separate file on purpose, so
  that two machines publishing into one release never write the same file.
- **Never `--clobber`.** If an upload of yours needs replacing, say so; the Windows side decides.
- **Do not change the source repository's release tooling or push to `hardening` unannounced.**
  A parallel redesign of the release flow was reverted on 2026-08-22. The seam you build
  against is described below and in `branding/README.md`; if it does not fit, say what is wrong
  rather than replacing it.
- **Do not edit `README.md` or `docs/index.html` here.** Tell the Windows side what changed.

## The macOS procedure, per release

1. **Wait for the release to exist and be public.**
   `gh release view vX.Y.Z --repo ztidal/ZtidalCode-dist --json isDraft` must say `false`.
   The Windows side creates it; you join it.
2. **Check out exactly that source.** The Windows release tags the build commit:
   `git fetch origin --tags && git checkout vX.Y.Z`. `branding/ztidalcode.json` must read
   `X.Y.Z` — the feed you are about to write claims that version, so the build must be it.
3. **Prerequisites on the Mac.** Xcode command-line tools; `rustup target add aarch64-apple-darwin
   x86_64-apple-darwin`; Node 24 and `npm ci`. Signing, in the environment and nowhere else:
   `TAURI_SIGNING_PRIVATE_KEY` = the *contents* of `ztidalcode.key` (the private Gitea backup has
   it; Tauri ignores `_PATH`), `TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""`. Apple, if there
   is a Developer ID to use: `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`,
   and Tauri signs and notarizes. Without one the build is unsigned — it still runs, after
   right-click → Open on macOS 14 or System Settings → Privacy & Security → Open Anyway on 15,
   which is an acceptable hoop for a team. Say which kind shipped in your report: the guide and
   the landing page must tell users the exact hoop they will meet.
4. **Build, through both overlays.** The second points the updater at the macOS feed:
   ```bash
   npm run tauri -- build --config branding/ztidalcode.json --config branding/ztidalcode-mac.json \
     --target universal-apple-darwin
   ```
5. **Write the feed.** Use the same notes the Windows release shipped with
   (`gh release view vX.Y.Z --json body -q .body > NOTES.md`):
   ```bash
   node scripts/make-updater-json.mjs --platform macos --arch universal --notes-file NOTES.md \
     --bundle-dir src-tauri/target/universal-apple-darwin/release/bundle
   ```
   That verifies the `.sig` against the archive's bytes and checks the binary inside the `.app`
   carries *our* updater key before writing `latest-mac.json` and `SHA256SUMS-mac.txt`. If it
   refuses, the build is wrong, not the script.
6. **Upload your five files to the existing release.**
   ```bash
   B=src-tauri/target/universal-apple-darwin/release/bundle
   gh release upload vX.Y.Z --repo ztidal/ZtidalCode-dist latest-mac.json SHA256SUMS-mac.txt \
     $B/macos/ZtidalCode.app.tar.gz $B/macos/ZtidalCode.app.tar.gz.sig $B/dmg/ZtidalCode_X.Y.Z_universal.dmg
   ```
7. **Verify from outside:**
   `curl -sL https://github.com/ztidal/ZtidalCode-dist/releases/latest/download/latest-mac.json`
   must show `X.Y.Z` with `darwin-aarch64` and `darwin-x86_64`.
8. **Tell the Windows side it is up.** They add the macOS download to the landing page and the
   guide (the first time), and note the macOS half in the release.

Between the Windows publish and your upload, Mac clients asking for `latest-mac.json` get a 404.
The updater treats that as "no update" and tries again later, so nothing breaks — but do not
dawdle, and if a release ships with no macOS half at all, Mac clients simply stay where they are.

## Windows-side notes on the two documents here

**`README.md` is the usage guide.** It goes stale when a release changes how the app is used.
**`docs/index.html` needs editing only when a feature changes** — the version, download link, size
and installer name are fetched from the releases API at load, so a version bump needs nothing.
The hero is a picture now, `docs/hero.webp` (1672×941, exported at WebP quality 88 from the
owner's banner artwork), and a picture can go stale: when the app's look changes noticeably, or
a claim printed on it stops being true ("仅 Windows" the day a Mac build ships), replace it.
Mechanics that must survive any edit: the page is bilingual in one DOM (English is the markup,
Chinese rides in `data-zh`, swapped by `innerHTML`, so values may carry inline markup and must
stay well-formed); the download button is deliberately two spans (`#dl-label` belongs to the
language switcher, `#dl-size` to the releases-API script — they once overwrote each other);
`--brand` is the logo's hue at a lightness solved for contrast, not eyeballed; the SmartScreen
section promises `SHA256SUMS.txt` with flat filenames, which the release script generates.
