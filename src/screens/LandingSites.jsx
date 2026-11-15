import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Flag,
  LogOut,
  MapPin,
  Rocket,
  ScanLine,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { useGame } from '../game/store'
import { loadNasaImage } from '../game/nasa'
import { getMapPosition, LANDING_SITES, NASA_MAP_PAGE } from '../game/sites'
import { speak } from '../game/speech'
import ThemeToggle from '../game/ThemeToggle'

const MAZE_COLUMNS = 15
const MAZE_ROWS = 11
const SURVEY_MARKERS = [
  { x: 5, y: 1, number: 1 },
  { x: 11, y: 3, number: 2 },
  { x: 5, y: 7, number: 3 },
]
const LANDING_BEACON = { x: 13, y: 9 }
const PHOTO_REQUESTS = new Map()

function createMissionRoute() {
  const grid = Array.from({ length: MAZE_ROWS }, () => Array(MAZE_COLUMNS).fill(1))

  const corridors = [
    [[1, 1], [13, 1]],
    [[13, 1], [13, 3]],
    [[9, 3], [13, 3]],
    [[9, 3], [9, 5]],
    [[3, 5], [9, 5]],
    [[3, 5], [3, 7]],
    [[3, 7], [11, 7]],
    [[11, 7], [11, 9]],
    [[5, 9], [13, 9]],
    [[2, 1], [2, 3]],
    [[2, 3], [9, 3]],
    [[7, 1], [7, 3]],
    [[11, 3], [11, 4]],
    [[5, 5], [5, 6]],
    [[7, 7], [7, 8]],
    [[9, 9], [9, 8]],
  ]

  for (const [[startX, startY], [endX, endY]] of corridors) {
    const dx = Math.sign(endX - startX)
    const dy = Math.sign(endY - startY)
    let x = startX
    let y = startY
    grid[y][x] = 0
    while (x !== endX || y !== endY) {
      if (x !== endX) x += dx
      else y += dy
      grid[y][x] = 0
    }
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

function MazeBoard({ maze, mazePosition, mazeCollected, mazeComplete, compact = false }) {
  return (
    <div
      className={`maze-board${compact ? ' survey-preview-board' : ''}`}
      role="grid"
      aria-label="Training map. Scan survey markers 1, 2, and 3 in order, then guide the rover to the landing beacon."
      style={{ gridTemplateColumns: `repeat(${MAZE_COLUMNS}, minmax(0, 1fr))` }}
    >
      {maze.flatMap((row, y) => row.map((wall, x) => {
        const isPlayer = mazePosition.x === x && mazePosition.y === y
        const isBeacon = LANDING_BEACON.x === x && LANDING_BEACON.y === y
        const cellKey = `${x},${y}`
        const marker = SURVEY_MARKERS.find((item) => item.x === x && item.y === y)
        const isSurveyMarker = marker && !mazeCollected.includes(cellKey)
        return (
          <div
            className={`maze-cell ${wall ? 'maze-wall' : 'maze-path'} ${isBeacon ? 'maze-beacon' : ''}`}
            key={cellKey}
            role="gridcell"
            aria-label={isPlayer ? 'Rover' : isBeacon ? 'Landing beacon' : isSurveyMarker ? `Survey marker ${marker.number}` : wall ? 'Crater wall' : 'Safe route'}
          >
            {isSurveyMarker && <motion.span
              className={`maze-survey-marker ${marker.number === mazeCollected.length + 1 ? 'is-next' : 'is-locked'}`}
              animate={marker.number === mazeCollected.length + 1 ? { scale: [0.9, 1.08, 0.9] } : { scale: 1 }}
              transition={{ duration: 1.6, repeat: Infinity }}
            >
              {marker.number}
            </motion.span>}
            {isBeacon && <Flag size={14} className={`beacon-flag ${mazeComplete ? 'beacon-ready' : ''}`} aria-hidden="true" />}
            {isPlayer && <motion.span className="maze-rover" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.7, repeat: Infinity }}><Rocket size={17} /></motion.span>}
          </div>
        )
      }))}
    </div>
  )
}

function MazeMovementControls({ hint, movePlayer, id = 'rover-controls', compact = false }) {
  return (
    <div className={`maze-controls${compact ? ' survey-preview-controls' : ''}`} id={id}>
      <div className="maze-instructions" role="status" aria-live="polite">
        <small className="maze-control-label">DRIVE THE ROVER</small>
        <span>{hint}</span>
        <small>Use the arrows or your keyboard to move.</small>
      </div>
      <div className="maze-direction-pad" aria-label="Rover movement controls">
        <DirectionButton label="Move up" onClick={() => movePlayer(0, -1)}><ChevronUp size={19} /></DirectionButton>
        <DirectionButton label="Move left" onClick={() => movePlayer(-1, 0)}><ChevronLeft size={19} /></DirectionButton>
        <DirectionButton label="Move down" onClick={() => movePlayer(0, 1)}><ChevronDown size={19} /></DirectionButton>
        <DirectionButton label="Move right" onClick={() => movePlayer(1, 0)}><ChevronRight size={19} /></DirectionButton>
      </div>
    </div>
  )
}

function AnimatedLandingMap({ selectedSite, onSelectSite }) {
  const { left, top } = getMapPosition(selectedSite)

  return (
    <div
      className="landing-map-art"
      role="group"
      aria-label="Illustrated lunar atlas with six Apollo landing regions placed using their NASA coordinates. Select a numbered marker or destination."
    >
      <div className="landing-map-stars" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
      <div className="landing-map-contours" aria-hidden="true">
        <span className="map-crater crater-a" />
        <span className="map-crater crater-b" />
        <span className="map-crater crater-c" />
        <span className="map-crater crater-d" />
        <span className="map-crater crater-e" />
      </div>
      <svg className="landing-map-route" viewBox="0 0 900 440" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 290C130 235 185 355 320 285S520 165 660 260s155 70 240 8" />
        <path d="M35 104C160 160 204 76 330 130s205 38 290-8 168 5 238 72" />
        <g className="landing-map-connectors">
          {LANDING_SITES.map((site, index) => {
            const position = getMapPosition(site)
            const x = Number.parseFloat(position.left) * 9
            const y = Number.parseFloat(position.top) * 4.4
            const markerX = ((index + 1) / (LANDING_SITES.length + 1)) * 900
            return (
              <g key={site.id} className={site.id === selectedSite.id ? 'is-selected' : ''}>
                <line x1={x} y1={y} x2={markerX} y2="316" />
                <circle cx={x} cy={y} r={site.id === selectedSite.id ? 6 : 3.5} />
              </g>
            )
          })}
        </g>
      </svg>
      <span className="landing-map-label">ILLUSTRATED ATLAS</span>
      {LANDING_SITES.map((site, index) => {
        const selected = site.id === selectedSite.id
        return (
          <motion.button
            key={site.id}
            type="button"
            className={`lunar-site-pin${selected ? ' is-selected' : ''}`}
            style={{ left: `${((index + 1) / (LANDING_SITES.length + 1)) * 100}%`, top: '72%' }}
            onClick={() => onSelectSite(site.id)}
            whileHover={{ scale: 1.18 }}
            whileTap={{ scale: 0.9 }}
            aria-label={`Choose ${site.mission}, ${site.name}`}
            aria-pressed={selected}
            title={`${site.mission} · ${site.name}`}
          >
            {index + 1}
          </motion.button>
        )
      })}
      <motion.div
        key={selectedSite.id}
        className="landing-map-scan"
        style={{ left, top }}
        initial={{ opacity: 0, scale: 0.45 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        aria-hidden="true"
      />
      <motion.div
        key={`rover-${selectedSite.id}`}
        className="landing-map-rover"
        style={{ left, top }}
        initial={{ opacity: 0, x: -18, y: 12 }}
        animate={{ opacity: 1, x: 14, y: 10 }}
        transition={{ duration: 0.55, type: 'spring', stiffness: 120 }}
        aria-hidden="true"
      >
        <Rocket size={15} />
      </motion.div>
      <motion.div
        key={`label-${selectedSite.id}`}
        className="landing-map-selection"
        initial={{ opacity: 0, y: 7 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        aria-live="polite"
      >
        <small>{selectedSite.mission.toUpperCase()} · SELECTED REGION</small>
        <b>{selectedSite.name}</b>
        <span>{formatCoordinates(selectedSite)}</span>
      </motion.div>
      <div className="landing-map-source">
        <span>Animated illustration · pins use real NASA coordinates</span>
        <a href={NASA_MAP_PAGE} target="_blank" rel="noreferrer">NASA map reference <ArrowRight size={12} /></a>
      </div>
    </div>
  )
}

export default function LandingSites() {
  const name = useGame((state) => state.name)
  const muted = useGame((state) => state.muted)
  const toggleMute = useGame((state) => state.toggleMute)
  const logout = useGame((state) => state.logout)
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
  const maze = useMemo(() => createMissionRoute(), [])
  const [photos, setPhotos] = useState({})
  const [hint, setHint] = useState('Scan route markers 1, 2, and 3 in order, then reach the landing beacon.')
  const [surveyModalOpen, setSurveyModalOpen] = useState(false)
  const moveRef = useRef(() => {})
  const modalCloseRef = useRef(null)
  const surveyTriggerRef = useRef(null)
  const modalWasOpen = useRef(false)
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
    const markerIndex = SURVEY_MARKERS.findIndex((marker) => marker.x === next.x && marker.y === next.y)
    const alreadyCollected = mazeCollected.includes(cellKey)
    let nextCollected = mazeCollected

    if (markerIndex >= 0 && !alreadyCollected && markerIndex === mazeCollected.length) {
      nextCollected = [...mazeCollected, cellKey]
      addScore(100)
      const remaining = SURVEY_MARKERS.length - nextCollected.length
      setHint(remaining
        ? `Survey marker ${markerIndex + 1} recorded! +100 points. Find marker ${markerIndex + 2} next.`
        : 'All three survey markers are mapped. Now guide the rover to the landing beacon.')
      speak(remaining
        ? `Survey marker ${markerIndex + 1} recorded. One hundred points. Find marker ${markerIndex + 2} next.`
        : `All three survey markers are mapped, ${name}. Now find the landing beacon.`, muted)
    } else if (markerIndex > mazeCollected.length) {
      setHint(`This scan point is not ready yet. Find survey marker ${mazeCollected.length + 1} first.`)
    }

    if (next.x === LANDING_BEACON.x && next.y === LANDING_BEACON.y) {
      if (nextCollected.length === SURVEY_MARKERS.length) {
        completeMaze()
        setHint('Safe route mapped! The habitat is cleared to land. +250 points!')
        speak(`Safe route mapped, ${name}! The habitat is cleared to land. You earned 250 points.`, muted)
      } else {
        setHint(`The beacon is locked. Map survey marker ${nextCollected.length + 1} first.`)
      }
    }

    setMazeProgress(next, nextCollected)
  }, [addScore, completeMaze, maze, mazeCollected, mazeComplete, mazePosition, muted, name, setMazeProgress])

  useEffect(() => {
    moveRef.current = movePlayer
  }, [movePlayer])

  useEffect(() => {
    if (!surveyModalOpen) {
      if (modalWasOpen.current) surveyTriggerRef.current?.focus()
      modalWasOpen.current = false
      return
    }
    modalWasOpen.current = true
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    modalCloseRef.current?.focus()
    return () => { document.body.style.overflow = previousOverflow }
  }, [surveyModalOpen])

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape' && surveyModalOpen) {
        setSurveyModalOpen(false)
        return
      }
      if (event.key === 'Tab' && surveyModalOpen) {
        const buttons = document.querySelectorAll('.survey-modal button:not([disabled])')
        const first = buttons[0]
        const last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
          return
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
          return
        }
      }
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
  }, [surveyModalOpen])

  function launch() {
    if (!mazeComplete) return
    if (photo.status === 'loading') {
      setHint('Your NASA archive image is still loading. Try again in a moment.')
      return
    }
    launchMission(selectedSite.id, photo.status === 'loaded' ? photo.asset : null)
  }

  function chooseSite(siteId) {
    const site = LANDING_SITES.find((entry) => entry.id === siteId)
    if (!site) return
    selectLandingSite(site.id)
    setHint(`${site.mission} selected. Next, drive to survey markers 1, 2, and 3.`)
    speak(`${site.mission} selected, ${name}. Your destination is ${site.name}. Next, drive the rover to survey markers one, two, and three.`, muted)
  }

  function activateStage(stage) {
    if (stage === 1) {
      document.querySelector('.landing-site-choices')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHint('Step 1: choose one of the six Apollo landing sites.')
      speak(`Step one, ${name}: choose an Apollo landing site.`, muted)
      return
    }
    if (stage === 2) {
      setSurveyModalOpen(true)
      speak(`Step two, ${name}: survey the landing route. Collect markers one, two, and three in order, then reach the beacon.`, muted)
      return
    }
    if (!mazeComplete) {
      setHint(`Habitat landing is locked. Scan route marker ${mazeCollected.length + 1} first.`)
      speak(`The habitat landing is locked, ${name}. First, scan route marker ${mazeCollected.length + 1}.`, muted)
      return
    }
    launch()
  }

  return (
    <main className="landing-screen landing-game-screen">
      <header className="mission-topbar landing-game-topbar">
        <div className="mission-brand">
          <span className="brand-orbit">◉</span>
          <span className="brand-lockup"><strong>LUNAR OUTPOST ACADEMY</strong><small>SSRO</small></span>
        </div>
        <div className="landing-commander"><span>MISSION TRAINING</span><b>{name || 'Astronaut'}</b></div>
        <div className="topbar-right">
          <span className="landing-score"><Sparkles size={14} /> {score} POINTS</span>
          <button className="logout-button" onClick={logout} aria-label="Log out" title="Log out">
            <LogOut size={15} /><span>Log out</span>
          </button>
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
              <span className="section-kicker">STEP 2 OF 3 · ROVER SURVEY</span>
              <h1>Chart a safe landing route</h1>
              <p className="maze-mission-brief">Scan points 1 → 2 → 3, then reach the beacon to clear a habitat landing route. Training map—not NASA terrain.</p>
            </div>
            <div className="maze-objective">
              <span><ScanLine size={15} /> ROUTE SCANS</span>
              <b>{mazeCollected.length} / {SURVEY_MARKERS.length}</b>
            </div>
          </div>

          <div className="maze-board-wrap">
            <MazeBoard maze={maze} mazePosition={mazePosition} mazeCollected={mazeCollected} mazeComplete={mazeComplete} />
          </div>

          <MazeMovementControls hint={hint} movePlayer={movePlayer} />
        </div>

        <aside className="landing-site-panel">
          <div className="site-panel-heading">
            <div><span className="section-kicker">STEP 1 OF 3 · REAL NASA DATA</span><h2>Choose your destination</h2></div>
            <MapPin size={18} aria-hidden="true" />
          </div>
          <div className="landing-site-choices" aria-label="Choose an Apollo landing site">
            {LANDING_SITES.map((site, index) => (
              <button
                key={site.id}
                className={site.id === selectedSite.id ? 'is-selected' : ''}
                onClick={() => chooseSite(site.id)}
                aria-pressed={site.id === selectedSite.id}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <b>{site.mission}</b>
              </button>
            ))}
          </div>

          <AnimatedLandingMap selectedSite={selectedSite} onSelectSite={chooseSite} />

          <motion.div
            key={selectedSite.id}
            className="landing-site-details"
            aria-live="polite"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <h3>{selectedSite.name}</h3>
            <span>{formatCoordinates(selectedSite)}</span>
            <p>{selectedSite.summary}</p>
          </motion.div>

          <ol className="landing-flow" aria-label="Mission stages">
            <li className="is-done">
              <button type="button" className="landing-flow-button" onClick={() => activateStage(1)} aria-label="Step 1: choose an Apollo destination">
                <i>1</i><span><b>DESTINATION</b><small>Choose a site</small></span>
              </button>
            </li>
            <li className={mazeComplete ? 'is-done' : 'is-current'}>
              <button ref={surveyTriggerRef} type="button" className="landing-flow-button" onClick={() => activateStage(2)} aria-current={mazeComplete ? undefined : 'step'} aria-label="Step 2: open the rover survey">
                <i>2</i><span><b>ROVER SURVEY</b><small>Scan 3 points</small></span>
              </button>
            </li>
            <li className={mazeComplete ? 'is-current' : ''}>
              <button type="button" className="landing-flow-button" onClick={() => activateStage(3)} aria-current={mazeComplete ? 'step' : undefined} aria-label="Step 3: habitat landing">
                <i>3</i><span><b>HABITAT</b><small>Land the base</small></span>
              </button>
            </li>
          </ol>

          {mazeComplete ? (
            <div className="landing-complete">
              <span><Sparkles size={15} /> STEP 3 OF 3 · SAFE TO LAND</span>
              <button className="launch-button" onClick={launch} disabled={photo.status === 'loading'}>
                {photo.status === 'loading' ? 'Loading NASA photo…' : photo.status === 'error' ? 'Begin without photo' : 'Begin habitat mission'} <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="landing-lock-note">
              <Flag size={17} />
              <span><b>YOUR MISSION</b><small>Scan all 3 route points to unlock the habitat landing.</small></span>
              <a className="rover-scroll-link" href="#rover-controls"><ChevronDown size={16} /> Drive rover</a>
            </div>
          )}
        </aside>
      </section>

      {surveyModalOpen && (
        <motion.div
          className="survey-modal-backdrop"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={(event) => {
            if (event.target === event.currentTarget) setSurveyModalOpen(false)
          }}
        >
          <motion.section
            className="survey-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="survey-modal-title"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <header className="survey-modal-heading">
              <div>
                <span className="section-kicker">STEP 2 · ROVER SURVEY</span>
                <h2 id="survey-modal-title">Map the safe landing route</h2>
              </div>
              <button ref={modalCloseRef} type="button" className="survey-modal-close" onClick={() => setSurveyModalOpen(false)} aria-label="Close rover survey">
                <X size={20} />
              </button>
            </header>
            <p className="survey-modal-copy">Drive to markers 1, 2, and 3 in order, then reach the beacon. This small map shares progress with the main survey.</p>
            <div className="survey-modal-map">
              <MazeBoard maze={maze} mazePosition={mazePosition} mazeCollected={mazeCollected} mazeComplete={mazeComplete} compact />
            </div>
            <MazeMovementControls hint={hint} movePlayer={movePlayer} id="rover-controls-preview" compact />
            <div className="survey-modal-footer">
              <span><ScanLine size={15} /> ROUTE SCANS <b>{mazeCollected.length} / {SURVEY_MARKERS.length}</b></span>
              <button type="button" onClick={() => setSurveyModalOpen(false)}>Back to mission</button>
            </div>
          </motion.section>
        </motion.div>
      )}
    </main>
  )
}
