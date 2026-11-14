import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import {
  ArrowRight,
  BatteryCharging,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Flag,
  MapPin,
  Rocket,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useGame } from '../game/store'
import { loadNasaImage } from '../game/nasa'
import { LANDING_SITES } from '../game/sites'
import { speak } from '../game/speech'
import ThemeToggle from '../game/ThemeToggle'

const MAZE_COLUMNS = 15
const MAZE_ROWS = 11
const AIR_CELLS = [
  { x: 5, y: 1 },
  { x: 11, y: 3 },
  { x: 5, y: 7 },
]
const LANDING_BEACON = { x: 13, y: 9 }
const PHOTO_REQUESTS = new Map()

function createMaze(seedText) {
  let seed = Array.from(seedText).reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7)
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  const width = (MAZE_COLUMNS - 1) / 2
  const height = (MAZE_ROWS - 1) / 2
  const grid = Array.from({ length: MAZE_ROWS }, () => Array(MAZE_COLUMNS).fill(1))
  const visited = new Set(['0,0'])
  const stack = [{ x: 0, y: 0 }]
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]]

  grid[1][1] = 0
  while (stack.length) {
    const current = stack[stack.length - 1]
    const choices = directions
      .map(([dx, dy]) => ({ x: current.x + dx, y: current.y + dy, dx, dy }))
      .filter(({ x, y }) => x >= 0 && x < width && y >= 0 && y < height && !visited.has(`${x},${y}`))

    if (!choices.length) {
      stack.pop()
      continue
    }

    const next = choices[Math.floor(random() * choices.length)]
    grid[current.y * 2 + 1 + next.dy][current.x * 2 + 1 + next.dx] = 0
    grid[next.y * 2 + 1][next.x * 2 + 1] = 0
    visited.add(`${next.x},${next.y}`)
    stack.push({ x: next.x, y: next.y })
  }

  return grid
}

function getPhoto(siteId) {
  if (!PHOTO_REQUESTS.has(siteId)) {
    const site = LANDING_SITES.find((entry) => entry.id === siteId)
    PHOTO_REQUESTS.set(
      siteId,
      loadNasaImage(site.photoId).then(
        (asset) => ({ status: 'loaded', asset }),
        (error) => ({ status: 'error', error: error.message })
      )
    )
  }
  return PHOTO_REQUESTS.get(siteId)
}

function formatCoordinates(site) {
  const latitude = `${Math.abs(site.latitude).toFixed(2)}°${site.latitude >= 0 ? 'N' : 'S'}`
  const longitude = `${Math.abs(site.longitude).toFixed(2)}°${site.longitude >= 0 ? 'E' : 'W'}`
  return `${latitude}, ${longitude}`
}

function DirectionButton({ label, onClick, children }) {
  return (
    <button className="maze-direction" aria-label={label} onClick={onClick}>
      {children}
    </button>
  )
}

export default function LandingSites() {
  const name = useGame((state) => state.name)
  const muted = useGame((state) => state.muted)
  const toggleMute = useGame((state) => state.toggleMute)
  const selectedSiteId = useGame((state) => state.selectedSite)
  const selectedSite = LANDING_SITES.find((site) => site.id === selectedSiteId) || LANDING_SITES[0]
  const selectLandingSite = useGame((state) => state.selectLandingSite)
  const launchMission = useGame((state) => state.launchMission)
  const mazePosition = useGame((state) => state.mazePosition)
  const mazeCollected = useGame((state) => state.mazeCollected)
  const mazeComplete = useGame((state) => state.mazeComplete)
  const setMazeProgress = useGame((state) => state.setMazeProgress)
  const completeMaze = useGame((state) => state.completeMaze)
  const addScore = useGame((state) => state.addScore)
  const score = useGame((state) => state.score)
  const maze = useMemo(() => createMaze(selectedSite.id), [selectedSite.id])
  const [photos, setPhotos] = useState({})
  const [hint, setHint] = useState('Collect 3 air cells, then find the landing beacon.')
  const moveRef = useRef(() => {})
  const photo = photos[selectedSite.id] || { status: 'loading' }

  useEffect(() => {
    let active = true
    getPhoto(selectedSite.id).then((result) => {
      if (active) setPhotos((current) => ({ ...current, [selectedSite.id]: result }))
    })
    return () => { active = false }
  }, [selectedSite.id])

  const movePlayer = useCallback((dx, dy) => {
    if (mazeComplete) return
    const next = { x: mazePosition.x + dx, y: mazePosition.y + dy }
    if (next.x < 0 || next.x >= MAZE_COLUMNS || next.y < 0 || next.y >= MAZE_ROWS || maze[next.y][next.x]) {
      setHint('Rock wall! Try a different path.')
      return
    }

    const cellKey = `${next.x},${next.y}`
    const hasAirCell = AIR_CELLS.some((cell) => cell.x === next.x && cell.y === next.y)
    const alreadyCollected = mazeCollected.includes(cellKey)
    const nextCollected = hasAirCell && !alreadyCollected ? [...mazeCollected, cellKey] : mazeCollected

    if (hasAirCell && !alreadyCollected) {
      addScore(100)
      setHint(`Air cell collected! +100 points. ${AIR_CELLS.length - nextCollected.length} left.`)
      speak(`Air cell collected! One hundred points. ${AIR_CELLS.length - nextCollected.length} left.`, muted)
    }

    if (next.x === LANDING_BEACON.x && next.y === LANDING_BEACON.y) {
      if (nextCollected.length === AIR_CELLS.length) {
        completeMaze()
        setHint('Beacon reached! Landing practice complete. +250 points!')
        speak(`Beacon reached, ${name}! You earned 250 points.`, muted)
      } else {
        setHint(`Find all ${AIR_CELLS.length} air cells before landing. ${AIR_CELLS.length - nextCollected.length} left.`)
      }
    }

    setMazeProgress(next, nextCollected)
  }, [addScore, completeMaze, maze, mazeCollected, mazeComplete, mazePosition, muted, name, setMazeProgress])

  useEffect(() => {
    moveRef.current = movePlayer
  }, [movePlayer])

  useEffect(() => {
    function onKeyDown(event) {
      const direction = {
        ArrowUp: [0, -1],
        w: [0, -1],
        W: [0, -1],
        ArrowDown: [0, 1],
        s: [0, 1],
        S: [0, 1],
        ArrowLeft: [-1, 0],
        a: [-1, 0],
        A: [-1, 0],
        ArrowRight: [1, 0],
        d: [1, 0],
        D: [1, 0],
      }[event.key]
      if (!direction) return
      event.preventDefault()
      moveRef.current(...direction)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function launch() {
    if (!mazeComplete || photo.status === 'loading') return
    launchMission(selectedSite.id, photo.status === 'loaded' ? photo.asset : null)
  }

  return (
    <main className="landing-screen landing-game-screen">
      <header className="mission-topbar landing-game-topbar">
        <div className="mission-brand"><span className="brand-orbit">◉</span><span>LUNAR OUTPOST <b>ACADEMY</b></span></div>
        <div className="landing-commander"><span>MISSION TRAINING</span><b>{name || 'Astronaut'}</b></div>
        <div className="topbar-right">
          <span className="landing-score"><Sparkles size={14} /> {score} POINTS</span>
          <button className="sound-toggle" onClick={toggleMute} aria-label={muted ? 'Turn narration on' : 'Turn narration off'}>
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <ThemeToggle />
        </div>
      </header>

      <section className="landing-game-layout">
        <div className="landing-maze-panel">
          <div className="maze-heading">
            <div>
              <span className="section-kicker">MOON MAZE · TRAINING SIMULATION</span>
              <h1>Guide your rover to the landing beacon</h1>
            </div>
            <div className="maze-objective">
              <span><BatteryCharging size={15} /> AIR CELLS</span>
              <b>{mazeCollected.length} / {AIR_CELLS.length}</b>
            </div>
          </div>

          <div className="maze-board-wrap">
            <div
              className="maze-board"
              role="grid"
              aria-label="Moon maze. Collect three air cells and guide the rover to the landing beacon."
              style={{ gridTemplateColumns: `repeat(${MAZE_COLUMNS}, minmax(0, 1fr))` }}
            >
              {maze.flatMap((row, y) => row.map((wall, x) => {
                const isPlayer = mazePosition.x === x && mazePosition.y === y
                const isBeacon = LANDING_BEACON.x === x && LANDING_BEACON.y === y
                const cellKey = `${x},${y}`
                const isAirCell = AIR_CELLS.some((cell) => cell.x === x && cell.y === y) && !mazeCollected.includes(cellKey)
                return (
                  <div
                    className={`maze-cell ${wall ? 'maze-wall' : 'maze-path'} ${isBeacon ? 'maze-beacon' : ''}`}
                    key={cellKey}
                    role="gridcell"
                    aria-label={isPlayer ? 'Rover' : isBeacon ? 'Landing beacon' : isAirCell ? 'Air cell' : wall ? 'Rock wall' : 'Path'}
                  >
                    {isAirCell && <motion.span className="maze-air-cell" animate={{ scale: [0.85, 1.12, 0.85] }} transition={{ duration: 1.6, repeat: Infinity }}><Sparkles size={13} /></motion.span>}
                    {isBeacon && <Flag size={14} className={`beacon-flag ${mazeComplete ? 'beacon-ready' : ''}`} aria-hidden="true" />}
                    {isPlayer && <motion.span className="maze-rover" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.7, repeat: Infinity }}><Rocket size={17} /></motion.span>}
                  </div>
                )
              }))}
            </div>
          </div>

          <div className="maze-controls">
            <div className="maze-instructions" role="status" aria-live="polite">
              <span>{hint}</span>
              <small>Use arrow keys, WASD, or tap the arrows.</small>
            </div>
            <div className="maze-direction-pad" aria-label="Rover movement controls">
              <DirectionButton label="Move up" onClick={() => movePlayer(0, -1)}><ChevronUp size={19} /></DirectionButton>
              <DirectionButton label="Move left" onClick={() => movePlayer(-1, 0)}><ChevronLeft size={19} /></DirectionButton>
              <DirectionButton label="Move down" onClick={() => movePlayer(0, 1)}><ChevronDown size={19} /></DirectionButton>
              <DirectionButton label="Move right" onClick={() => movePlayer(1, 0)}><ChevronRight size={19} /></DirectionButton>
            </div>
          </div>
        </div>

        <aside className="landing-site-panel">
          <div className="site-panel-heading">
            <div><span className="section-kicker">REAL APOLLO LANDING SPOT</span><h2>Choose your destination</h2></div>
            <MapPin size={18} aria-hidden="true" />
          </div>
          <div className="landing-site-choices" aria-label="Choose an Apollo landing site">
            {LANDING_SITES.map((site, index) => (
              <button
                key={site.id}
                className={site.id === selectedSite.id ? 'is-selected' : ''}
                onClick={() => {
                  selectLandingSite(site.id)
                  setHint('Collect 3 air cells, then find the landing beacon.')
                }}
                aria-pressed={site.id === selectedSite.id}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <b>{site.mission}</b>
              </button>
            ))}
          </div>

          <div className="landing-site-photo">
            {photo.status === 'loaded' ? (
              <>
                <img src={photo.asset.imageUrl} alt={`${photo.asset.title}, NASA archive image for ${selectedSite.name}`} />
                <a href={photo.asset.sourceUrl} target="_blank" rel="noreferrer">NASA ARCHIVE PHOTO <ArrowRight size={12} /></a>
              </>
            ) : (
              <div className="landing-photo-status">
                {photo.status === 'error' ? 'NASA photo unavailable. Try again later.' : 'Loading real NASA archive photo…'}
              </div>
            )}
          </div>

          <div className="landing-site-details" aria-live="polite">
            <h3>{selectedSite.name}</h3>
            <span>{formatCoordinates(selectedSite)}</span>
            <p>{selectedSite.summary}</p>
          </div>

          {mazeComplete ? (
            <div className="landing-complete">
              <span><Sparkles size={15} /> PRACTICE COMPLETE</span>
              <button className="launch-button" onClick={launch} disabled={photo.status === 'loading'}>
                {photo.status === 'loading' ? 'Loading NASA photo…' : photo.status === 'error' ? 'Continue without photo' : 'Continue to Moon base'} <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="landing-lock-note"><Flag size={15} /> Collect all 3 air cells to unlock the mission.</div>
          )}
        </aside>
      </section>
    </main>
  )
}
