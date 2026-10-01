# Contributing

AIRWAVE is a single HTML file with no build step. That's a design constraint, not a
missing feature — keep it that way.

## Ground rules

1. **No build step, no npm, no bundler.** Everything lives in `index.html`. If a change
   requires a toolchain to run, it doesn't belong here.
2. **No dependencies beyond the MediaPipe CDN.** The whole point is that anyone can open
   the file and play.
3. **Keep it playable.** Latency is the product. A change that adds 20 ms to the budget
   needs to justify itself.

## Running locally

Camera access requires a secure context, so `file://` will not work:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Before you open a PR

CI runs these automatically, but running them first saves a round trip:

```bash
# 1. the module script must parse
python3 - <<'EOF'
import re, pathlib
html = pathlib.Path('index.html').read_text()
m = re.search(r'<script type="module">(.*?)</script>', html, re.S)
pathlib.Path('airwave.mjs').write_text(m.group(1))
EOF
node --check airwave.mjs && rm airwave.mjs
```

2. **Verify in a real browser with a real camera.** A green CI run means the file parses;
   it says nothing about whether the instrument sounds or feels right. That's on you.

3. **Report your latency numbers** if you touch the sensing or audio path. The HUD shows
   all five stages — paste what you measured and on what hardware.

## What's most wanted

- **Running the palm detector every N frames** and tracking between — the standard
  MediaPipe optimisation, and the biggest available latency win.
- **Pattern variation per bar** — a long drop currently loops one bar identically.
- **Per-finger articulation** — 21 landmarks is a lot of unused signal.
- **Web MIDI out**, so AIRWAVE can drive a real synth or DAW.

## Reporting a bug

Include your browser and version, whether inference is on the GPU or CPU delegate
(check the console for the fallback warning), and your HUD numbers. "It's laggy" without
the five stages is not actionable.

## License

By contributing you agree that your work is released under the [MIT License](LICENSE),
**and** that the maintainer may relicense the project — including your contribution —
under any other license in the future.

That second clause is deliberate, and worth understanding before you contribute. Without
it, a single merged pull request would permanently freeze the project's license: the
maintainer would hold a *licence* to use your code but would not *own* it, and could never
relicense the combined work. With it, the option stays open — for example if a hardware
product ever needs different terms for the firmware.

**You keep the copyright to your own contribution.** This grants no ownership of your
work, only the right to relicense it.
