# ZtidalCode — release artifacts

Installers and the updater manifest for **ZtidalCode**, an internal hardened fork of
[PinkCode](https://github.com/3xian/PinkCode) (a desktop GUI for xAI's Grok Build coding agent).

The source lives in a private repository. This repository is public for one reason: the in-app updater
fetches `latest.json` anonymously, and GitHub release assets on a private repository require
authentication.

## Verifying a download

Installers are **not** Authenticode-signed, so Windows SmartScreen will warn about an unknown publisher.
Check the download against `SHA256SUMS.txt` on the release before installing:

```powershell
Get-FileHash .\ZtidalCode_0.0.1_x64-setup.exe -Algorithm SHA256
```

In-app updates carry a minisign signature (`.sig`) verified against a public key compiled into the
installed build, so an update cannot be substituted even though the assets are public.

## Contents of a release

| Asset | What it is |
| --- | --- |
| `ZtidalCode_<version>_x64-setup.exe` | NSIS installer (per-user), what the updater installs |
| `ZtidalCode_<version>_x64_en-US.msi` | MSI, for deployment tooling |
| `*.sig` | minisign signature for the matching artifact |
| `latest.json` | updater manifest — the app reads this from the *latest* release |
| `SHA256SUMS.txt` | hashes for manual verification |

Versions are our own line (`0.0.1`, `0.0.2`, …) and deliberately do not track upstream's.
