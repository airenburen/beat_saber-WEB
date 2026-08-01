**[中文](README.md) | English**

# Beat Saber WebXR

A web-based Beat Saber. Three ways to play — desktop mouse, webcam hand tracking, and WebXR VR — with deep compatibility for 200k+ BeatSaver community maps (Chroma / Noodle Extensions / wall-art / modcharts), and stage & block visuals faithful to the official game.

**Play online: https://beatsaber.xixiu.top** (VR requires HTTPS — already set up)

## Screenshots

| Home (official stage backdrop + neon sign) | Official stage · lighting events |
|---|---|
| ![menu](docs/screenshots/menu.png) | ![stage](docs/screenshots/stage.png) |

| Wall-art map Bad Apple (124k walls, full render) | Modchart camera flythrough (Nothing Else) |
|---|---|
| ![badapple](docs/screenshots/badapple.png) | ![modchart](docs/screenshots/modchart.png) |

| Shrine theme (Reply · torii / lantern sea / lantern blocks) |
|---|
| ![shrine](docs/screenshots/shrine.png) |

> VR in-headset screenshots coming soon.

## Positioning

Mature playable web implementations already exist — most notably [Moon Rider](https://moonrider.xyz/) (by Supermedium; its Classic mode is saber-slicing gameplay against the BeatSaver library). This project is not the first playable web implementation; it differs in:

- **Official-fidelity reproduction as the goal**: official stage models & shaders, official block model / arrows / material recipe, whole-block direction rotation, full lighting-event channel mapping — rather than a stylized redesign
- **The advanced community-map ecosystem**: to the best of our search, this is the only known web implementation that simultaneously supports **Chroma** (per-object/per-event colors, official colorSchemes), **Noodle Extensions** (keyframe animation, dissolve, ghost notes, rotated walls), **modcharts** (AssignPlayerToTrack camera flythrough, track parenting), and **full wall-art rendering**; previously this mod ecosystem only existed in native PC/Quest mods
- Plus webcam hand-tracking play, a BeatLeader leaderboard source, and a bilingual UI

> The "only" claims above are based on public searches as of 2026-07 — corrections welcome.

## Features

### Three ways to play
- **Desktop**: mouse-driven dual sabers (right hand tracks, left mirrors), A/D dodges walls, ESC pauses
- **Webcam hand tracking**: MediaPipe hand tracking — each index finger drives a saber (model/wasm self-hosted + object-storage CDN, on-device inference, falls back to mouse after 600ms without hands)
- **WebXR VR**: 6DoF dual-controller sabers, officially-graded haptics (good cut / bad cut / bomb), a desktop-style two-panel song select (thumbstick scrolling + pixel-accurate laser picking), in-VR search/download/QWERTY keyboard, and in-place quality / FPS / full-wall settings

### Map compatibility
- **Formats**: v2 / v3 / **v4** (the 1.34+ official-editor format: indexed charts, separate lightshow file, AudioData), multi-difficulty parsing & switching, arcs, chains, bombs, walls; **BPM changes** (v4 AudioData sample-accurate regions / v3 bpmEvents)
- **Chroma**: per-event/per-object custom colors, SongCore customColors, official Info.dat v2.1 colorSchemes (blocks and lights colored separately)
- **Noodle Extensions** (deep subset): pointDefinitions, AnimateTrack, AssignPathAnimation, per-object `_animation`, 18 easings, `_dissolve`, `_interactable` ghost notes, `_definitePosition`, precise coordinates, static wall `_rotation`/`_localRotation`, **AssignTrackParent chains**, **AssignPlayerToTrack camera flythrough** (desktop; sabers ride the camera)
- **Wall-art maps**: full wall rendering budgeted by quality tier (desktop High = uncapped; VR 2k/6k/20k + a "full walls" override), shared-geometry optimization for high-rate wall spawning

> The full per-field format matrix lives in **[docs/format-support.md](docs/format-support.md)**.

### Official-fidelity visuals (ported from [beatsaver-viewer](https://github.com/supermedium/beatsaver-viewer), MIT)
- **Stage, 1:1**: official runway models + atlas mask shaders (UV-region tinting / fake radial fog), 3+3 rotating side lasers, smoke ring, normal-mapped reflective floor; lighting events map to every channel (backglow / tunnel neon / left-right lasers / floor / laser speed) with on/flash/fade envelopes, plus a beat-driven fallback show for maps without lighting data
- **Blocks**: official beveled beat.obj + atlas arrow/dot sprites + studio envmap reflections, official material recipe; **cut direction rotates the whole block** (diagonals read as tilted cubes); official two-half slicing with hot cut faces
- **Sound**: game-extracted hit-sound set (randomized variants) + UI hover/click sounds + synthesized results jingles
- **Environments**: 11 `_environmentName` stage variants; a shrine-themed environment for Reply (torii, sea lanterns, lantern-skinned blocks)

### Content
- **BeatSaver**: keyword search (relevance-ranked), direct 4-6 digit map-ID download, 11 genre tags × Top/Latest browsing, one-click TOP10 batch downloads
- **BeatLeader**: trending (by real play count) and ranked (by stars) via a same-origin proxy
- **Local import**: drop an audio file to auto-generate a chart
- Maps persist in browser IndexedDB (covers + all difficulties); a shared download queue (desktop + VR) shows 「Downloading <song> (n/total)」 with a live percent bar

### Performance
- Three quality tiers: High (full-res bloom) / Medium (half-res bloom) / Low (no post-processing)
- **Adaptive pixel budget**: total render pixels clamped by window area × dpr (big Retina windows drop pixelRatio automatically; small windows stay sharp at 2×)
- VR: framebuffer scale by tier + max foveation + frame-rate tiers resolved against the device's native `supportedFrameRates`
- DEMO autoplay with human-like swing choreography (wind-up → strike → follow-through), guaranteed full clears; NO FAIL mode

## Controls

### Desktop
| Action | Input |
|--------|-------|
| Swing sabers | Mouse (right hand tracks, left mirrors) |
| Dodge walls | A / D |
| Pause | ESC |
| Hand tracking | Toggle in menu, raise both index fingers |

### VR
| Action | Input |
|--------|-------|
| Song select / panels | Laser + trigger; thumbstick scrolls |
| Pause | Left menu button |
| Pause: resume / restart | Left / right trigger |
| Results: retry / menu | Left / right trigger |

## Built-in songs

| Song | BPM | Style |
|------|-----|-------|
| NEON PULSE | 128 | EDM |
| INK SHADOWS | 84 | Guzheng |
| STARBOUND | 110 | Synthwave |
| Reply (bundled community map) | 170 | Shrine theme · Expert+ |

## Development

```bash
npm install
npm run dev      # dev server (HTTPS)
npm run build    # output in dist/
```

Stack: Vue 3 + TypeScript + Three.js (WebXR) + Web Audio + IndexedDB + MediaPipe Tasks Vision.

## Credits & disclaimer

- Stage models/shaders, block model and arrow sprites ported from [supermedium/beatsaver-viewer](https://github.com/supermedium/beatsaver-viewer) (MIT)
- Hand tracking: [MediaPipe](https://github.com/google-ai-edge/mediapipe) HandLandmarker
- Map data: the public [BeatSaver](https://beatsaver.com) / [BeatLeader](https://beatleader.xyz) APIs
- A non-commercial fan project, unaffiliated with Beat Games / Meta; the "Beat Saber" trademark belongs to its owners
