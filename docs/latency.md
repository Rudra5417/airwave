# The latency budget

An instrument is a latency problem before it's an audio problem. This page explains what
AIRWAVE measures, why each stage matters, and how to read your own numbers.

## The five stages

AIRWAVE's HUD breaks end-to-end delay into the components that actually exist:

| Stage | What it is | Typical |
|---|---|---|
| **capture** | half a frame interval — average wait for a fresh camera frame | 16 ms @ 30 fps |
| **inference** | `detectForVideo()` — palm detect + landmark regression | 9–24 ms |
| **audio buffer** | `AudioContext.baseLatency` — the render quantum | ~5 ms |
| **audio output** | `AudioContext.outputLatency` — device buffer + DAC | 10–26 ms |
| **total** | the sum, which is what you actually feel | — |

The HUD colours the total: **green** under 25 ms (feels immediate), **amber** under 55 ms
(playable, slight lag on fast gestures), **red** above (not an instrument).

## Why these five

**Capture** is the one people forget. Even with instant inference, you're always waiting on
average half a frame for the camera to hand you the moment your hand actually moved. At
30 fps that's 16 ms of unavoidable floor. This is why dropping to 15 fps costs you 33 ms
before any processing happens.

**Audio output is the other one people forget**, and it's the biggest surprise in this
project. In testing it measured **26 ms** — more than a sixth of the total budget on its
own, and more than the inference cost on decent hardware. Software can't fix it; it's the
device buffer plus the DAC. Headphones with a low-latency path help.

This is also why the project uses `latencyHint: 'interactive'` on the AudioContext — it
asks the browser to prefer a small buffer over glitch resistance.

**Inference** is the only stage you can meaningfully optimise, and it's usually not the
bottleneck once a GPU delegate is active.

## Measured baseline

Measured in **headless Chrome with `--disable-gpu --enable-unsafe-swiftshader`** — i.e.
pure software rendering, which is a worst case, not a prediction:

```
inference      84.8 ms   ← software GL; this is the inflated one
capture        42.7 ms   ← consequence of 12 fps
audio buffer    5.8 ms
audio output   26.0 ms
─────────────────────────
total         159.3 ms   → "too slow to feel like an instrument"
```

The verdict line said exactly that, which is the instrumentation working correctly.

**Do not read these as real-world numbers.** With software rendering the tracker runs at
12 fps instead of ~30, which inflates both `inference` (86 ms vs ~10-24 ms with a GPU
delegate) and `capture` (43 ms vs ~16 ms). Projecting to hardware:

```
inference      ~10-24 ms
capture        ~16 ms      (30 fps)
audio buffer    ~5 ms
audio output   ~15-26 ms
─────────────────────────
total          ~46-71 ms   → "playable", likely better with a good audio path
```

Which is the honest expectation for Stage 1: **playable, with audible lag on fast
gestures.** The two structural limits — camera frame interval and audio output buffer —
put a hard floor around ~30 ms that no amount of code fixes.

## Reading your own numbers

Open the page, hold a hand up, and watch the panel for ~10 seconds. It averages over 45
frames. Worth checking:

1. **Is inference under 25 ms?** If not, you're on the CPU delegate — check the console for
   the GPU fallback warning.
2. **Is tracking fps near your camera's rate?** If inference is fine but fps is low, the
   bottleneck is elsewhere (canvas drawing, tab throttling, thermal).
3. **Is audio output unusually high?** Try different output devices. Bluetooth headphones
   are much worse than wired — that 26 ms can become 150 ms+.

## What would make it faster

| Change | Effect |
|---|---|
| GPU delegate (automatic) | inference 86 ms → ~10-24 ms |
| Lower camera resolution | faster inference, no effect on capture |
| Higher camera frame rate | capture 33 ms → 16 ms |
| Wired headphones | avoids Bluetooth's 100 ms+ audio path |
| Run the detector every N frames, track between | real win, not yet implemented |

That last one is the standard MediaPipe optimisation and the obvious next step: the palm
detector only needs to run when tracking is lost, not every frame. It's in the roadmap.
