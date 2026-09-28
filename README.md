# AI Motion Graphics Stress Test

An experiment to explore how far an AI coding agent can push **Canvas 2D** to create procedural motion graphics, with the final output rendered into video using **FFmpeg**.

The goal is not to build a conventional web animation. The goal is to test whether an AI coding agent can translate a creative motion-design brief into a complex, polished, deterministic animation entirely through code.

## The Experiment

The core workflow is:

```text
Creative Brief
      ↓
Antigravity + Gemini
      ↓
Generated JavaScript
      ↓
Canvas 2D
      ↓
Rendered Image Sequence
      ↓
FFmpeg
      ↓
MP4 Video
```

The first phase intentionally uses **Canvas 2D** rather than Three.js or WebGL.

If Canvas 2D reaches its practical limits, a second experiment will recreate a similar stress test using **Three.js** to compare the two approaches.

## What We're Testing

The experiment focuses on how well an AI coding agent can handle:

* Complex visual composition
* Procedural graphics
* Typography
* Particles
* Shapes and geometry
* Easing and interpolation
* Multiple simultaneous animations
* Camera-like movement
* Trails and motion blur effects
* Noise and texture
* Layering and blending
* Transitions
* Deterministic randomness
* Timing and synchronization
* Performance
* Overall visual coherence

The intention is to push beyond simple examples such as a bouncing ball, rotating shapes, or basic particle effects.

The generated animation should feel like an actual motion-graphics piece.

## Why Canvas 2D?

Canvas 2D provides a relatively simple environment for the experiment.

It gives the AI direct control over:

* Pixels
* Paths
* Shapes
* Text
* Images
* Transformations
* Compositing
* Gradients
* Animation state

It also avoids introducing a large rendering framework during the first experiment.

This makes it easier to determine how much of the complexity comes from the **AI-generated creative code itself** rather than from a sophisticated graphics engine.

## Deterministic Rendering

The animation should not rely on real-time playback for the final output.

Instead, every frame is rendered from a known frame number:

```js
const time = frame / FPS;
renderFrame(frame, time);
```

For example, at 30 FPS:

```text
Frame 0   → 0.000s
Frame 1   → 0.033s
Frame 2   → 0.067s
...
Frame 449 → 14.967s
```

This allows the animation to be rendered frame-by-frame as individual images.

Seeded randomness should also be used where procedural randomness is required so that repeated renders produce the same result.

## Rendering Pipeline

The project uses a browser to render the Canvas scene and FFmpeg to convert the resulting image sequence into a video.

```text
Canvas
  │
  ├── Frame 0000 → PNG
  ├── Frame 0001 → PNG
  ├── Frame 0002 → PNG
  ├── ...
  └── Frame 0449 → PNG
                │
                ↓
              FFmpeg
                │
                ↓
             output.mp4
```

For example:

```bash
ffmpeg \
  -framerate 30 \
  -i frames/frame_%04d.png \
  -c:v libx264 \
  -pix_fmt yuv420p \
  output.mp4
```

## AI Agent

The experiment uses **Google Antigravity** as the coding environment, with Gemini models responsible for generating and modifying the animation code.

The agent is given the creative and technical requirements and is allowed to implement the animation rather than manually writing the graphics code.

The experiment therefore tests both:

1. **The visual capabilities of Canvas 2D**
2. **The ability of an AI coding agent to construct sophisticated motion graphics systems**

## Project Structure

The intended architecture is roughly:

```text
canvas-motion-stress/
│
├── index.html
├── package.json
│
├── src/
│   ├── main.js
│   ├── scene.js
│   ├── animation.js
│   └── utils.js
│
├── render/
│   └── render.js
│
├── frames/
│
└── output/
```

The animation implementation and rendering pipeline should remain separate.

This allows the visual system to be changed without rewriting the video renderer.

## Stress Test Criteria

The result will be evaluated based on several factors.

### Visual Complexity

How much visual complexity can the AI create while keeping the animation coherent?

### Motion Quality

Does the animation use convincing:

* Easing
* Timing
* Acceleration
* Deceleration
* Secondary motion
* Transitions

rather than simply moving objects linearly?

### Composition

Does the AI understand:

* Visual hierarchy
* Spacing
* Scale
* Contrast
* Focal points
* Layering

?

### Procedural Generation

Can the AI create interesting visual systems instead of manually placing every element?

### Consistency

Does the visual language remain coherent throughout the animation?

### Technical Performance

How many objects, particles, effects, and calculations can Canvas 2D handle before rendering becomes impractical?

### Reproducibility

Does the same source code produce the same animation when rendered again?

## The Challenge

The ultimate challenge is intentionally open-ended:

> **Give an AI coding agent a demanding motion-design brief and see how far it can push Canvas 2D without using a dedicated 3D engine or traditional motion-design software.**

The agent is expected to handle the implementation, while the experiment evaluates the resulting system and output.

## Phase 1 — Canvas 2D

The first experiment uses:

* HTML
* JavaScript
* Canvas 2D
* Node.js
* Playwright/Chromium
* FFmpeg

The goal is to establish the limits of a purely 2D browser-based rendering pipeline.

## Phase 2 — Three.js

If the Canvas experiment reaches limitations that are primarily related to:

* 3D geometry
* Perspective
* Lighting
* Depth
* Camera movement
* Shader effects
* Large numbers of objects

the experiment will be repeated using **Three.js**.

The two implementations can then be compared based on visual complexity, implementation complexity, rendering performance, and the kinds of effects the AI is able to produce.

## Why This Experiment?

AI coding agents are increasingly capable of generating complete software systems from natural-language descriptions.

Motion graphics provide an interesting test because they require more than functional correctness.

The generated code has to produce something that is:

* Visually coherent
* Well timed
* Dynamic
* Composed intentionally
* Technically renderable
* Interesting to watch

This project explores what happens when an AI coding agent is treated not just as a programming assistant, but as the **implementation layer for a procedural motion-design system**.

## Status

🚧 **Experimental**

Phase 1: Canvas 2D stress test

Phase 2: Three.js comparison — planned

---

### Tools

* [Google Antigravity](https://antigravity.google/)
* Gemini
* Canvas 2D
* JavaScript
* Playwright
* Chromium
* FFmpeg
* Node.js
