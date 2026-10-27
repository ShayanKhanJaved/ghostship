# Ghostship

> **Municipal Hydrotherapy District · est. 2003**  
> *A retro 3D browser-based hydro-horror FPS built with p5.js.*

---

## 🌊 Overview

**Ghostship** (also known as *ORHANGE*) is a stylized, retro 3D FPS built using [p5.js](https://p5js.org/). Explore pool halls beneath the facility, the glass sky, the empty city, and the Funhouse. Recover Lumen Cores, battle surreal aquatic horrors, upgrade your hydro-arsenal, and uncover the eerie memories buried deep within the complex.

## 🎮 Game Modes

- **Story · Sectors**: Descend through ten distinct sectors. Collect Lumen Cores, defeat sector bosses, and unlock memories of the park's origins.
- **Death Pool**: An endless survival mode. Earn tokens, unlock glass doors to new wings, and see how long you can survive against escalating waves.
- **Death Funhouse**: A carnival-themed twist on the survival mode with tighter corridors and bizarre encounters.

## 🕹️ Controls

| Action | Key / Input |
|---|---|
| **Move** | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> |
| **Sprint** | <kbd>Shift</kbd> |
| **Jump** | <kbd>Space</kbd> |
| **Fire** | <kbd>Left Click</kbd> |
| **Laser Pulse** | <kbd>Right Click</kbd> |
| **Reload** | <kbd>R</kbd> |
| **Switch Weapon** | <kbd>1</kbd>–<kbd>4</kbd> or <kbd>Mouse Wheel</kbd> |
| **Interact / Buy** | <kbd>E</kbd> |
| **Pause / Menu** | <kbd>Esc</kbd> |

## 🚀 How to Run Locally

You can run this project locally with any static web server:

### Option 1: Python
```bash
# Python 3
python3 -m http.server 8000
```
Then navigate to `http://localhost:8000` in your browser.

### Option 2: Node.js (npx serve or live-server)
```bash
npx serve .
```

### Option 3: VS Code / IDE Live Server
Right-click `index.html` and choose **"Open with Live Server"**.

## 🛠️ Built With

- [p5.js](https://p5js.org/) (v1.9.4) - 3D WebGL rendering & game loop
- Custom WebGL Shaders (Vertex wobble & retro CRT/scanline effects)
- Web Audio API - Dynamic sound effects & procedural audio
- Vanilla JavaScript, CSS Glassmorphism HUD

## 👤 Credits

Created by **Cameosky**
