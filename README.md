# AIRWAVE

**Play music in mid-air.** Your webcam tracks your hand; a scale-locked synthesizer
turns its position into sound. No install, no build step, no dependencies — one HTML file.

```
hand height      → pitch   (continuous, quantised to a scale)
distance         → volume
finger spread    → timbre  (filter cutoff)
```

The instrument is deliberately **scale-locked**. Free-hand pitch control is brutally
hard — it's the real reason the theremin became a punchline. Quantising to a scale
means you can wave your hands around and sound like a musician, and it also hides
residual tracker jitter that would otherwise make every note warble.

---

## Quick start

Camera access needs a secure context, so `file://` won't work. Serve the folder:

```bash
git clone https://github.com/Rudra5417/airwave
cd airwave
python3 -m http.server 8000
```

Open **http://localhost:8000** and allow camera access. Hold a hand up in frame.

> Any static server works — `npx serve`, `caddy file-server`, whatever you have.

### Controls

| Input | Action |
|---|---|
| **Hand up/down** | pitch (two octaves) |
| **Hand toward/away from camera** | volume |
| **Open/close fingers** | timbre (filter cutoff) |
| `1` `2` `3` `4` | pentatonic / major / minor / free |
| `Space` | mute / unmute |
| **glide** button | portamento between notes |
| **smooth** slider | tracking filter — low is smooth but laggy, high is snappy but jittery |

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
**21 landmarks per hand** at ~6.1 mm mean per-joint error. That's not just faster, it's a
richer instrument: position *and* hand pose, which is what lets finger spread drive timbre.

Full comparison with sources: [docs/sensors.md](docs/sensors.md).

---

## What's implemented

- MediaPipe Tasks Vision hand tracking, GPU delegate with automatic CPU fallback
- **One Euro filter** for tracking (not an EMA) — adapts its cutoff to hand speed, so
  slow gestures are smooth and fast gestures stay responsive. This is the part that
  decides whether it sounds like an instrument or a drunk theremin.
- 4-oscillator synth (3 detuned saws + sub) → resonant lowpass → delay
- Auto-calibrating volume: it learns your hand-size range rather than assuming one
- Live latency instrumentation across all five budget stages
- Hand skeleton overlay, pitch ladder, level meter
- Zero build step, zero npm, zero dependencies beyond the MediaPipe CDN

## Roadmap

- [ ] Two-handed control (left = modulation, right = pitch)
- [ ] Per-finger articulation — 21 landmarks is a lot of unused signal
- [ ] MIDI out over Web MIDI, so it can drive a real synth or DAW
- [ ] Recording / loop pedal
- [ ] Standalone hardware: ESP32 for synthesis (the open-source
      [ESP32 Theremin](https://github.com/FrancescoQ/ESP32_Theremin) proves 3 oscillators
      + effects at 15% CPU), Pi 5 for vision. Expect ~50–70 ms and a laggier feel.

## Known limitations

- **Needs light and line of sight.** Radar would work in the dark; a camera doesn't.
- **Audio output latency is a real, often-ignored cost** — measured at 26 ms in testing,
  which is a sixth of the total budget on its own. Headphones help.
- One hand is tracked; the second is currently ignored.
- Handedness/mirroring assumes a front-facing camera.

## License

MIT — see [LICENSE](LICENSE).
