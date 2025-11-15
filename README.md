# echo)))location

An audio-first minimal browser game where you find hidden boxes using only sound.

## 🎮 Gameplay

- **Classic Mode**: Progress through levels with increasing difficulty
- **Custom Mode**: Configure your own challenge settings
- **Spatial Audio**: Uses Web Audio API for 3D sound positioning
- **Boon System**: Unlock and use power-ups to help your echolocation
- **Score & Rank**: Transparent scoring based on accuracy, speed, and efficiency

## 🎧 Best Experienced With Headphones

The game uses stereo panning and volume falloff to help you locate the hidden box. Headphones provide the best spatial audio experience.

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

## 🎵 Sound Themes

- Classic Sonar (sine wave)
- Arcade Beep (square wave)
- Sci-Fi Pulse (sawtooth wave)
- Natural Click (triangle wave)

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
