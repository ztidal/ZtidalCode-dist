# ZtidalCode

A desktop workspace for xAI's [Grok Build](https://x.ai/cli) coding agent: run several tasks side by
side, follow each one in a live timeline, and see where your credits go. `grok` stays in charge —
ZtidalCode drives it over [ACP](https://spec.acp.dev) and runs no agent loop of its own.

**[ztidal.github.io/ZtidalCode-dist](https://ztidal.github.io/ZtidalCode-dist/)** — what it looks like
and what it does, in one page. Send that to someone before this one.

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

**2. ZtidalCode.** Download the latest `ZtidalCode_<version>_x64-setup.exe` from
[Releases](https://github.com/ztidal/ZtidalCode-dist/releases). It installs per-user, needs no admin, and
from then on updates itself: one click, no prompt, and it relaunches when the update is in.

> There is also an `.msi` on every release. Take it only if you are rolling ZtidalCode out for other
> people — it installs per-machine, so it needs an administrator to install **and again for every
> update**. The `.exe` never asks.

> Our installers are **not** Authenticode-signed, so SmartScreen will warn about an unknown publisher.
> Check your download against `SHA256SUMS.txt` on the release first:
> ```powershell
> Get-FileHash .\ZtidalCode_*_x64-setup.exe -Algorithm SHA256
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

The timeline follows a reply as it is written, and lets go the moment you scroll up to read something
further back.

### Attaching files

**Ctrl+V** in the composer takes more than text.

- **Files copied in Explorer.** Copy anything, paste it in. Each becomes a chip — a thumbnail for
  pictures, the extension for everything else. Nothing is copied anywhere: the agent is pointed at the
  file where it already lives, whatever drive that is on.
- **A screenshot.** Win+Shift+S, then paste. This is the one case with no file behind it, so it is
  written to `%USERPROFILE%\.ztidalcode\pasted\` — never into your project.
- **Text** is untouched.

The **×** on a chip's corner removes it. Paths join the message only when you send, so removing a chip
removes the file and leaves nothing in your sentence to delete by hand. Attachments with no text are a
message too: paste a screenshot, press enter.

> **What the agent can do with an image.** It cannot see one — `grok` does not accept images over the
> protocol, and reading an image file as text fails. It writes code to inspect it instead, and is good
> at that. So *"read these files"* works properly; *"what does this screenshot say"* does not.

`Enter` sends. **`Ctrl+Enter` inserts a newline** — the reverse of most chat apps, because a prompt is
usually one thought and a stray newline used to swallow it. `↑` on an empty composer browses your
prompt history.

### While the agent is working

You do not have to wait for a turn to finish. Type and press enter — the send button reads **Queue**
while the agent is busy, so it is clear which one you are doing.

Queued messages wait in the timeline, in the order they will run, rather than in a panel of their own.
Each one carries its own controls:

| | |
| --- | --- |
| **↑ ↓** | Run it earlier or later |
| **Edit** | Change the wording before it runs |
| **Send now** | Interrupt the current turn and run this one immediately |
| **Remove** · **Clear all** | Drop this one, or the whole queue |

A message appears the instant you send it, before `grok` has acknowledged it — marked **Sending…**
until it does. Until this release the text left the composer and showed up nowhere for a round trip,
which read as the message having been swallowed.

### Keeping track

- **Pin** a session and it leaves its project for a **Pinned** header above them all. That header has
  no collapse arrow, because a pin behind a closed one is a pin you cannot see.
- **Archive** one and it moves to an **Archived** header at the bottom, closed. Nothing on disk changes,
  and it comes back the same way.
- Every row carries a small mark, and its colour is the task's state: hollow for one that is simply
  sitting there, filled and breathing while a turn runs, gold when the agent is waiting on you, and
  two more for a task being driven — by this window, or by another window or a terminal.
- **Needs input** is the one state that also says so in words, because it is a request rather than a
  state. Hovering any row names its state.

Rows are one line. The project, branch, time and token counts belong to whichever task you have open
and appear on that row alone — they are answers to questions you only ask about the task you are in.
A name too long for the rail shows in full when you hover it.

The **⋮** at a row's right — or a right-click anywhere on it — opens its menu:

| | |
| --- | --- |
| **Open in new window** | A second window, straight onto that task. |
| **Pin** / **Unpin** | Moves it to the `Pinned` header, or back. |
| **Rename** | Your own name over the agent's. Clear the field to get the agent's back; it keeps updating underneath either way. |
| **Archive** | To the `Archived` header. Reversible, and nothing on disk moves. |
| **Delete** | Moves the task's folder to `.trash` inside the session store. It leaves the list and `grok` stops seeing it, but nothing is erased — move the folder back and it all returns. |

### Settings

In the title bar:

| | |
| --- | --- |
| **New Window** | A second window for a different project. Each is its own process; they share your session and preference files safely. |
| **Theme** | Light, Dark, **Pure Dark**, **Warm Gold** and System. Pure Dark unless you say otherwise: a true black ground, for OLED panels and dark rooms. Warm Gold is that same black with the temperature flipped — gold titles, a gold-to-rose accent, your messages warm against the agent's cool. |
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
| `%USERPROFILE%\.ztidalcode` | Per-task permission modes, the names you give sessions, pins and the archive, pasted screenshots, logs, and the usage cache. Separate from upstream PinkCode's `.pinkcode`, so both can be installed side by side. |
| Browser storage | Theme, rail widths, which projects are open. Per-machine, and safe to lose — anything you would mind losing (names, pins, the archive) lives in `.ztidalcode` instead. Existing pins migrate there on first launch of 0.0.35. |

---

## Release contents

| Asset | What it is |
| --- | --- |
| `ZtidalCode_<version>_x64-setup.exe` | NSIS installer, per-user, no admin — take this one |
| `ZtidalCode_<version>_x64_en-US.msi` | MSI for deployment tooling; per-machine, admin on every update |
| `*.sig` | minisign signature for the matching artifact |
| `latest.json` | Updater manifest — the app reads this from the *latest* release |
| `SHA256SUMS.txt` | Hashes for manual verification |

Versions are our own line and deliberately do not track upstream's.
