# Why a camera, not radar

The short version: **the sensor that sounds like a magic idea is 5–10× too slow to play.**

## The bar

Conversation has a well-known rhythm — the median gap between speakers across languages
is **~200 ms** (Stivers et al., PNAS 2009). Musical instruments are far stricter. You want
**under ~20 ms**; above ~50 ms it feels laggy, above ~100 ms it feels broken. Musicians
already grumble about Bluetooth MIDI at 10–20 ms.

Everything below is judged against that ~20 ms target.

## Option 1 — mmWave radar ❌

The obvious candidate, and the one this project originally set out to use: contactless,
works in the dark, sees through clothing, no privacy problem.

| Module | Refresh | Resolution | Cost |
|---|---|---|---|
| HLK-LD2450 | **10 Hz (100 ms)** | ~75 mm | ~$12 |
| HLK-LD6004 | same class | X/Y/Z output | ~$9 |

**100 ms per position update.** That is five to ten times outside the budget, and it is not
a tunable — it's the module's configured data refresh rate.

### The tell

There is a genuinely interesting IEEE paper on exactly this: an
[FCNN-based super-resolution mmWave framework for a contactless musical instrument interface](https://arxiv.org/abs/2305.01995).
Read it carefully and it says the opposite of what you'd hope:

> *"little work has been done towards gestural musical interfaces on mmWave radar sensors
> using hand-tracking techniques... Google ATAP's Project Soli is the only effort using
> mmWave radar as a musical interface."*

One precedent. And the paper's core contribution is **super-resolution** — bolting a neural
network on to recover hand position the raw sensor can't resolve well enough on its own.

That's not a novel technique waiting to be applied. That's the sensor being insufficient,
and ML being used to paper over it. If the raw signal were good enough, you wouldn't need
a super-resolution network to play a note.

## Option 2 — multizone time-of-flight ⚠️

ST's multizone ToF sensors give you a small depth grid instead of a single distance.

| Sensor | Modes |
|---|---|
| VL53L5CX | **8×8 at 15 Hz** (67 ms) *or* **4×4 at 60 Hz** (17 ms) |
| VL53L8CX | slower still in 8×8; power figures quoted at 5 Hz |

You get **fine or fast, never both.** 4×4 at 60 Hz is inside the budget but gives you 16
coarse zones; 8×8 gives you detail at 67 ms, which is a visible lag on a fast gesture.

Cheap (~$4–20) and camera-free, so it remains the best option if "no camera" is a hard
requirement — it just costs you either resolution or latency.

## Option 3 — camera + MediaPipe Hands ✅

| Setup | End-to-end | Rate | Source |
|---|---|---|---|
| Workstation | **18 ms** | 30 FPS | hand-tracking visualisation study |
| Laptop | **32 ms** | 28 FPS | same |
| Raspberry Pi 5 | <100 ms | 15–20 FPS | ROS 2 gesture project; Pi 5 smart-home study |

And it returns far more than a position:

- **21 landmarks per hand**, in 2.5D
- **~6.1 mm mean per-joint error** (MediaPipe Hands paper, arXiv 2006.10214)
- Two-stage pipeline: a fast palm detector proposes a bounding box, a landmark model
  refines 21 joints inside it — which is why it runs in real time on CPU
- CPU-only; no GPU required, though a GPU delegate is faster

The landmark count is what makes it a *better instrument*, not just a faster sensor. Radar
gives you a point in space. MediaPipe gives you hand **pose** — so finger spread can drive
timbre, and per-finger articulation becomes possible. A theremin has one expressive
dimension; this has five or more.

**The trade:** needs light, needs line of sight, and raises a privacy question that radar
doesn't. For a personal instrument on your own desk, that's a fair exchange.

## Prior art worth reading

| Project | What it does |
|---|---|
| [AirMIDI](https://hackster.io/news/rishabh-jain-s-airmidi-is-a-simple-four-component-midi-theremin-style-contactless-instrument-4503eb17c2b3) | ESP32 + 3× VL53L0X ToF zones → BLE MIDI. Built from junk-drawer parts |
| [ESP32 Theremin](https://github.com/FrancescoQ/ESP32_Theremin) | Laser sensors, 3 oscillators + effects, I2S DAC, ~1,200 lines, **15% CPU** |
| Project Soli (Google ATAP) | The one prior mmWave musical interface |
| [MediaPipe Hands](https://arxiv.org/abs/2006.10214) | The landmark model this project uses |

AirMIDI is the closest analogue and it's a good illustration of the difference: three ToF
zones give you three notes. Zones are discrete. A theremin is continuous. **Continuity is
the instrument** — which is exactly what the camera buys you and radar can't deliver fast
enough.

## Summary

| Approach | Latency | Signal richness | Verdict |
|---|---|---|---|
| mmWave radar | 100 ms | position | too slow |
| Multizone ToF | 17–67 ms | coarse grid | fine or fast, not both |
| **Camera + MediaPipe** | **18–32 ms** | **21 landmarks** | **build it** |
