# AIRWAVE

[![License: MIT](https://img.shields.io/badge/license-MIT-2dd4f7?style=flat-square)](LICENSE)
[![Build step: none](https://img.shields.io/badge/build%20step-none-8b5cf6?style=flat-square)](#quick-start)
[![Dependencies: zero](https://img.shields.io/badge/dependencies-zero-2dd4f7?style=flat-square)](#quick-start)
[![Source: 1 file](https://img.shields.io/badge/source-1%20file-8b5cf6?style=flat-square)](#whats-implemented)
[![MediaPipe Hands](https://img.shields.io/badge/MediaPipe-Hands-2dd4f7?style=flat-square)](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker)
[![BPM](https://img.shields.io/badge/tempo-110--140%20BPM-8b5cf6?style=flat-square)](#controls)

**Play electronic dance music in mid-air.** Two hands, no controller, no install —
one HTML file that runs a 124 BPM synth engine off your webcam.

### ▶ [**Try it live**](https://rudra5417.github.io/airwave/)

Runs entirely in your browser. The camera feed never leaves your machine — there is no
server, no upload, no telemetry.

```
LEFT  hand   height      → the chord (from a progression) → drives bass + stabs + arp
RIGHT hand   height      → the drop  (kick → hats → bass → stabs → arp → lead)
             finger spread → filter brightness
```

---

## The idea

EDM is a **rhythmic, grid-locked** form. A continuous theremin glide fights it — which is
why the obvious version of this project doesn't work.

So the machine keeps time and your hands decide what it plays. The beat comes from the
audio clock, never from `requestAnimationFrame`, so a dropped frame cannot move the
groove. That's the whole difference between a drum machine and a bag of noise.

The second idea is **time quantisation**, and it's the same trick as pitch quantisation
applied to a different axis:

- **Harmony is quantised to a progression**, so you can't play a wrong chord.
- **Time is quantised to the grid**, so moving your hand doesn't retune a sounding note —
  it arms the note for the next step boundary.

Together they mean you can wave your hands around and get something that sounds
deliberate. Free pitch and free time are brutally hard; that's the real reason the
theremin became a punchline rather than an instrument.

## Controls

| Input | Action |
|---|---|
| **Left hand, up/down** | the chord — picked from the progression, drives bass, stabs and arp |
| **Right hand, up/down** | the drop — brings layers in one at a time |
| **Right hand, open/close** | filter brightness |
| **progression** | the chord sequence your left hand steps through |
| **scale** | minor / major / dorian / phrygian |
| `1` `2` `3` `4` | switch scale |
| `Space` | mute / unmute |
| **tempo** | 110–140 BPM |
| **pump** | the sidechain — the kick ducking the music bus |
| **smooth** | tracking filter; low is smooth but laggy, high is snappy but jittery |

Both hands down and the track falls back to a bare kick. Raise the right hand and it
builds; get it to the top and you're in the drop.

### The layers

Raising your right hand brings these in, in order. The drop meter names the current one.

| Energy | Adds |
|---|---|
| 0.00 | kick (four-on-the-floor) |
| 0.14 | closed hats on the offbeats |
| 0.24 | rolling bass |
| 0.30 | clap on 2 and 4 |
| 0.46 | chord stabs |
| 0.62 | 16th arpeggio |
| 0.76 | **supersaw lead** — seven detuned saws |

Filter cutoff, reverb send and delay send all ride the same macro, so a drop sounds like
a drop and not just "more notes".

### Harmony

Your left hand doesn't pick a note, it picks a **chord** from a progression. The vertical
range is split into one band per chord, so a four-chord progression gives your hand four
positions — the same four you'd play on a keyboard.

Chords are built by stacking 1–3–5 of the selected scale, which is what keeps every chord
diatonic to it. In A minor, `levels` gives **Am → C → G → F**.

| Progression | Degrees | In A minor |
|---|---|---|
| **levels** | i–III–VII–VI | Am · C · G · F |
| **anthem** | I–V–vi–IV | Am · Em · F · Dm |
| **deep house** | i–VI–iv | Am · F · Dm |
| **trance** | i–VII–VI–VII | Am · G · F · G |
| **dark** | i–i–VI–VII | Am · Am · F · G |
| **future bass** | I–iii–vi–IV | Am · C · F · Dm |
| **emotional** | vi–IV–I–V | F · Dm · Am · Em |
| **andalusian** | i–VII–VI–V | Am · G · F · Em |

All four scales are seven-note on purpose. Progressions are diatonic, and stacking a
pentatonic or chromatic scale yields sus-clusters with no chord name at all.

Every tonal layer reads from the same chord object, so the bass, the stabs and the arp
can't disagree about the key.

---

## Quick start

**Easiest —** [open the live demo](https://rudra5417.github.io/airwave/). No setup at all.

**Locally —** camera access needs a secure context, so `file://` won't work. Serve the
folder:

```bash
git clone https://github.com/Rudra5417/airwave
cd airwave
python3 -m http.server 8000
```

Open **http://localhost:8000** and allow camera access. Raise your left hand.

> Any static server works — `npx serve`, `caddy file-server`, whatever you have.

The **Latency budget** panel in the corner is the point of this project, not decoration.
It breaks the end-to-end delay into its five real components and tells you whether what
you're playing counts as an instrument. See [docs/latency.md](docs/latency.md).

---

## Why a camera and not radar

This started as a radar project. It isn't one, and the reason is a single number.

**The HLK-LD2450 mmWave tracker refreshes at 10 Hz** — 100 ms per position update, with
~75 mm distance resolution. For conversation, 100 ms is fine. For a musical instrument
it's a staircase, not a glide. The bar for an instrument is roughly **20 ms**, about ten
times tighter than the ~200 ms that makes conversation feel natural.

Multizone time-of-flight gets closer but forces a choice: the VL53L5CX does 8×8 at 15 Hz
*or* 4×4 at 60 Hz — fine or fast, never both.

A camera running MediaPipe Hands measures **18–32 ms end-to-end on a laptop** and returns
**21 landmarks per hand** at ~6.1 mm mean per-joint error. Two hands at once is what makes
a two-handed instrument possible at all.

Full comparison with sources: [docs/sensors.md](docs/sensors.md).

---

## What's implemented

**Vision**
- MediaPipe Tasks Vision hand tracking, GPU delegate with automatic CPU fallback
- Two hands tracked simultaneously, assigned to HARMONY/DROP slots with hysteresis so a
  hand near the centre doesn't flicker between roles
- **One Euro filter** (Casiez et al., CHI 2012) — not an EMA. The cutoff adapts to hand
  speed, so slow gestures are smooth and fast ones stay responsive.

**Sequencer**
- Lookahead scheduler driven by the audio clock — timing is immune to render-loop stalls
- 16-step pattern, tempo 110–140 BPM
- Layers gate on the energy macro

**Harmony**
- 8 progressions × 4 seven-note scales, chords built by stacking 1–3–5 of the scale
- One chord object feeds bass, stabs, arp and lead, so the layers can't disagree
- Chord names derived from the sounding intervals, never assumed from the degree
- `test/harmony.test.cjs` extracts these functions from `index.html` and checks the
  theory — diatonicity, naming, and the canonical progressions

**Synth — every sound is synthesised, no samples**
- Kick: sine with a pitch envelope, plus a click transient
- Hats: filtered noise, open and closed
- Clap: three fast noise bursts through a bandpass
- Bass: saw + square through a resonant lowpass
- Stabs: saw chord, short envelope
- Arp: triangle plucks cycling a chord
- Lead: **seven detuned saws** across ±27 cents
- **Sidechain pump** — the kick ducks the music bus, fast dip and slower recovery
- **Convolution reverb from a generated impulse response** — no audio file needed
- Dotted-eighth delay locked to the tempo
- Master compressor standing in for a limiter

**Everything else**
- Live latency instrumentation across all five budget stages
- Hand skeleton overlay, pitch ladder, 16-step indicator, drop meter
- Zero build step, zero npm, zero dependencies beyond the MediaPipe CDN

## Roadmap

- [ ] **Run the palm detector every N frames** and track between — the standard MediaPipe
      optimisation and the biggest available latency win
- [ ] Pattern variation per bar, so a long drop doesn't loop identically
- [ ] MIDI out over Web MIDI, so AIRWAVE can drive a real synth or DAW
- [ ] Recording / loop capture
- [ ] Per-finger articulation — 21 landmarks is a lot of unused signal
- [ ] Standalone hardware: ESP32 for synthesis (the open-source
      [ESP32 Theremin](https://github.com/FrancescoQ/ESP32_Theremin) proves 3 oscillators
      + effects at 15% CPU), Pi 5 for vision. Expect ~50–70 ms and a laggier feel.

## Known limitations

- **Needs light and line of sight.** Radar would work in the dark; a camera doesn't.
- **Audio output latency is a real, often-ignored cost** — measured at 26 ms in testing,
  a sixth of the total budget on its own. Wired headphones beat Bluetooth by a mile.
- Hands are assigned to roles by **screen position**, so crossing your arms swaps them
  mid-performance.
- One bar of pattern; no fills or song structure.
- The lead plays a fixed rhythm rather than the rhythm you gesture.

## License

MIT — see [LICENSE](LICENSE).

Contributions are accepted under the MIT terms **plus a relicensing clause**, so the
project's license stays changeable if a hardware product ever needs different terms.
See [CONTRIBUTING.md](CONTRIBUTING.md#license).
