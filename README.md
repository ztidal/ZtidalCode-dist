# ZtidalCode

A desktop workspace for xAI's [Grok Build](https://x.ai/cli) coding agent: run several tasks side by
side, follow each one in a live timeline, and see where your credits go. `grok` stays in charge —
ZtidalCode drives it over [ACP](https://spec.acp.dev) and runs no agent loop of its own.

This repository holds the installers. The source is private; it is a hardened fork of
[PinkCode](https://github.com/3xian/PinkCode). This repo is public for one reason: the in-app updater
fetches `latest.json` anonymously, and release assets on a private repository require authentication.

---

## Install

**1. Grok Build.** ZtidalCode does not bundle it and never handles your credentials — it reuses the
session `grok login` creates. You need SuperGrok, X Premium+, or SuperGrok Heavy.

```powershell
irm https://x.ai/cli/install.ps1 | iex
```

Then `grok login` once.

**2. ZtidalCode.** Download the latest `ZtidalCode_<version>_x64-setup.exe` (or the `.msi`) from
[Releases](https://github.com/ztidal/ZtidalCode-dist/releases). Installs per-user; no admin needed.

> Our installers are **not** Authenticode-signed, so SmartScreen will warn about an unknown publisher.
> Check your download against `SHA256SUMS.txt` on the release first:
> ```powershell
> Get-FileHash .\ZtidalCode_0.0.8_x64-setup.exe -Algorithm SHA256
> ```
> In-app updates carry a minisign signature and are verified against a key compiled into the build, so
> an update cannot be substituted even though these assets are public.

---

## Using it

Three columns: the **session rail** on the left, the **timeline** in the middle, **Files / Git** on the
right. Drag either inner edge to resize, double-click an edge to reset, `Ctrl+H` to fold the right one
away.

### Starting work

Sessions group by the folder they run in. **Projects are collapsed by default** and remember what you
left open.

- **`+` on a project header** starts a task already pointed at that folder.
- **New Task** in the rail header lets you pick any folder.
- Type in the filter box to search across every session — results come back as a flat list.

A new task starts on the newest model the agent offers, at its highest reasoning effort, and — read the
next section — **with full permissions**.

### Permissions

**A new task approves the agent's tool calls without asking.** Edits land and commands run with no
prompt. This is deliberate: the team works in repositories it already trusts. Two things still hold —
a repository cannot choose the mode its own tasks start in, and a task never inherits the mode of the
task before it.

Change it for one task with the mode chip beside the composer, or `Shift+Tab` to cycle
**Normal → Plan → Auto → Always-approve**. The chip always names the real mode; if it does not say
Always approve, the task will stop and ask.

Change it for every task on a machine, no rebuild needed:

```powershell
setx PINKCODE_DEFAULT_PERMISSION_MODE ask
```

or put `{"defaultPermissionMode":"default"}` in `%USERPROFILE%\.ztidalcode\config.json`.

Approving a **plan** and answering a question the agent asks you are always prompts, in every mode.

### The timeline

Opening a session lands on the latest activity. Scroll up and a **Jump to latest** button appears.
Filter chips narrow the stream to one kind of event; **Load earlier activity** pages backwards.

`Enter` sends. **`Ctrl+Enter` inserts a newline** — the reverse of most chat apps, because a prompt is
usually one thought and a stray newline used to swallow it. `↑` on an empty composer browses your
prompt history.

### Keeping track

- **Pin** a session (the pin on its card) to sort it to the top. Its project sorts up with it and opens
  on launch, so a pin always leads somewhere.
- A session the app is currently driving is marked in the rail, and distinguished from one running
  elsewhere — in another window, or in a terminal.
- **Needs input** appears on a card when the agent is waiting on you.

### Settings

In the title bar:

| | |
| --- | --- |
| **New Window** | A second window for a different project. Each is its own process; they share your session and preference files safely. |
| **Theme** | Light / Dark / System. Dark unless you say otherwise. |
| **Check for Updates** | Also runs at launch. Signature-verified before it installs. |

### Slash commands

Type `/` in the composer. Some are answered by ZtidalCode, the rest by `grok`.

`/usage` `/context` `/session-info` `/help` `/copy` · `/new` `/compact` `/fork` `/rewind` `/undo`
`/export` `/model` `/effort` `/plan` `/auto` `/always-approve`

### Keyboard

| | |
| --- | --- |
| `Enter` | Send |
| `Ctrl+Enter` | Newline |
| `Shift+Tab` | Cycle session mode |
| `↑` (empty composer) | Prompt history |
| `Ctrl+H` | Fold the Files / Git panel |
| `Tab` / `↑` `↓` / `Esc` | Accept, move through, dismiss the slash menu |
| `←` `→` on a splitter | Nudge width (`Shift` coarser, `Home` resets) |

### Where things are kept

| | |
| --- | --- |
| `%USERPROFILE%\.grok` | Grok Build's own sessions and credentials. ZtidalCode reads these; it does not own them. |
| `%USERPROFILE%\.ztidalcode` | Per-task permission modes and usage cache. Separate from upstream PinkCode's `.pinkcode`, so both can be installed side by side. |
| Browser storage | Theme, rail widths, pins, which projects are open. Per-machine, and safe to lose. |

---

## Release contents

| Asset | What it is |
| --- | --- |
| `ZtidalCode_<version>_x64-setup.exe` | NSIS installer, per-user — what the updater installs |
| `ZtidalCode_<version>_x64_en-US.msi` | MSI, for deployment tooling |
| `*.sig` | minisign signature for the matching artifact |
| `latest.json` | Updater manifest — the app reads this from the *latest* release |
| `SHA256SUMS.txt` | Hashes for manual verification |

Versions are our own line and deliberately do not track upstream's.
