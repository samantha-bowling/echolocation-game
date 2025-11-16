# echo)))location

An audio-first minimal browser game where you find hidden boxes using only sound.

## 🎮 Gameplay

- **Classic Mode**: Progress through levels with increasing difficulty
- **Custom Mode**: Configure your own challenge settings
- **Binaural 3D Audio**: Uses Web Audio API with HRTF for true spatial positioning
- **Boon System**: Unlock and use power-ups to help your echolocation
- **Score & Rank**: Transparent scoring based on accuracy, speed, and efficiency

## 🎧 Required: Headphones

The game uses **binaural 3D audio with Head-Related Transfer Function (HRTF)** to create realistic spatial positioning. You'll hear sounds coming from all around you - left, right, above, below, near, and far. Headphones are required for the 3D audio effect.

**Important:** Disable system spatial audio features (Windows Sonic, Dolby Atmos, Apple Spatial Audio) as they interfere with the game's precise audio cues.

## 🎨 Design System

Built on the **ECHOLOCATION** design system featuring:
- Minimal geometric aesthetic
- Echo-inspired microinteractions (90ms/150ms/220ms timings)
- Space Grotesk (display) + IBM Plex Mono (body)
- Ghost buttons, capsule inputs, flat cards, frosted modals
- Full light/dark theme support

## 🛠️ Tech Stack

- React 18 + TypeScript
- Vite
- TailwindCSS + shadcn/ui
- Web Audio API
- Framer Motion
- React Router

## 🎵 Binaural Sound Themes

All themes use true 3D spatial positioning:
- Classic Sonar (sine wave with underwater sweep)
- Submarine Sonar (deep ocean pulse)
- Sci-Fi Pulse (detuned shimmer)
- Dolphin Chirp (smooth frequency sweep)

## 🚀 Development

```bash
npm install
npm run dev
```

## 📝 Future Features

- Supabase integration for save persistence
- Endless mode
- More boons and chapters
- Multiplayer races
- Leaderboards

Built with [Lovable](https://lovable.dev)
