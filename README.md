# Lunar Outpost Academy

A narrated Moon-base mission game for young space explorers. Players choose one of six historic Apollo landing regions, then guide a rover along a fixed training route: scan three numbered waypoints in order and reach the beacon to clear a safe landing corridor for the habitat. The destination panel uses an animated illustrated lunar atlas with real Apollo coordinates; selecting a numbered marker updates the destination and narrated guidance. The rover-survey stage also opens as a compact playable map that shares progress with the main route.

The interface uses Lunar Outpost Academy / SSRO branding, a violet space palette, and a shared footer with creator contact and profile links.

The game then guides players through a ten-day crew-survival mission, balancing air, power, and shielding. Progress, player name, selected site, score, tutorial position, and theme are saved in the browser's local storage; no account or server-side profile is used. Log out to clear the astronaut's saved run and return to name entry. A dark/light appearance toggle is available on each screen.

## Run locally

```sh
npm install
npm run dev
```

## NASA data and voice

Apollo landing-region coordinates and image IDs are listed in `src/game/sites.js`. The destination atlas is an illustration, not NASA terrain; its pins use the real Apollo coordinates. NASA archive photos appear in the habitat mission, and the GRAIL lunar gravity-field map is available in the atlas screen. Both link to their NASA records. The rover route is a clearly labeled training simulation, not NASA terrain or landing-site imagery.

The mission also requests recent solar-flare observations from NASA's DONKI FLR API. Set `VITE_NASA_API_KEY` in a local `.env` file for regular use; NASA's shared `DEMO_KEY` is rate-limited and may return HTTP 429. If DONKI is unavailable, the game reports the issue instead of substituting sample observations.

The survival challenge is a simulation: game storm days are not NASA forecasts. Narration prefers an installed English female voice; available voices and sound quality depend on the browser and operating system.

## Technologies and data credits

- NASA [DONKI](https://kauai.ccmc.gsfc.nasa.gov/DONKI/) solar-flare data
- [React](https://react.dev), [Vite](https://vite.dev), and [Tailwind CSS](https://tailwindcss.com)
- [Three.js](https://threejs.org), [React Three Fiber](https://r3f.docs.pmnd.rs/), and [Drei](https://drei.docs.pmnd.rs/)
- [Zustand](https://zustand.docs.pmnd.rs/), [Motion](https://motion.dev/), and [Lucide React](https://lucide.dev/guide/packages/lucide-react)

## Checks

```sh
npm run lint
npm run build
```
