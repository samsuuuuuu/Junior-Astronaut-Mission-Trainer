# Lunar Outpost Academy

A narrated Moon-base mission game for young space explorers. Players navigate a replayable Moon-maze training simulation, collect air cells, earn points, and choose from six historic Apollo landing regions. Each destination includes its real coordinates, a short description, and an image from NASA's archive.

The game then guides players through a ten-day crew-survival mission, balancing air, power, and shielding. Progress, player name, selected site, score, tutorial position, and theme are saved in the browser's local storage; no account or server-side profile is used. A dark/light appearance toggle is available on each screen.

## Run locally

```sh
npm install
npm run dev
```

## NASA data and voice

Apollo landing-region coordinates and image IDs are listed in `src/game/sites.js`. Site photos and the GRAIL lunar gravity-field map load from NASA's Images API and link to their NASA archive records. The maze is a clearly labeled training simulation, not NASA terrain or landing-site imagery.

The mission also requests recent solar-flare observations from NASA's DONKI FLR API. Set `VITE_NASA_API_KEY` in a local `.env` file for regular use; NASA's shared `DEMO_KEY` is rate-limited and may return HTTP 429. If DONKI is unavailable, the game reports the issue instead of substituting sample observations.

The survival challenge is a simulation: game storm days are not NASA forecasts. Narration prefers an installed English female voice; available voices and sound quality depend on the browser and operating system.

## Checks

```sh
npm run lint
npm run build
```
