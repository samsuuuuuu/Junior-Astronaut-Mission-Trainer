import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import {
  ArrowUpRight,
  BatteryCharging,
  Compass,
  LogOut,
  Map,
  MousePointer2,
  Moon,
  Radio,
  RotateCcw,
  ShieldCheck,
  Satellite,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  Wind,
} from 'lucide-react'
import { useGame, MAX_DAYS, STORM_DAYS } from '../game/store'
import { loadNasaImage, loadSpaceWeather } from '../game/nasa'
import { speak, stopSpeaking } from '../game/speech'
import { tutorialSteps } from '../game/tutorial'
import { getMapPosition, LANDING_SITES, MOON_MAP_ID, NASA_MAP_PAGE } from '../game/sites'
import ThemeToggle from '../game/ThemeToggle'

function Meter({ icon: Icon, label, value, color }) {
  return (
    <div className="game-meter">
      <div className="meter-label"><span><Icon size={16} /> {label}</span><b>{value}%</b></div>
      <div className="meter-track">
        <motion.div
          className={`meter-fill ${color}`}
          animate={{ width: `${value}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
        />
      </div>
    </div>
  )
}

function ActionButton({ icon: Icon, label, detail, onClick, disabled, tone = 'gold', guideTarget }) {
  return (
    <button className={`job-button ${tone}`} onClick={onClick} disabled={disabled} data-guide-target={guideTarget}>
      <span className="job-icon"><Icon size={19} /></span>
      <span className="job-copy"><b>{label}</b><small>{detail}</small></span>
      <ArrowUpRight size={16} className="job-arrow" />
    </button>
  )
}

function TutorialSpotlight({ target }) {
  const [focus, setFocus] = useState(null)

  useEffect(() => {
    function measure() {
      const element = document.querySelector(`[data-guide-target="${target}"]`)
      if (!element) {
        setFocus(null)
        return
      }

      const rect = element.getBoundingClientRect()
      const padding = 8
      const left = Math.max(4, rect.left - padding)
      const top = Math.max(4, rect.top - padding)
      const right = Math.min(window.innerWidth - 4, rect.right + padding)
      const bottom = Math.min(window.innerHeight - 4, rect.bottom + padding)
      setFocus({
        width: window.innerWidth,
        height: window.innerHeight,
        left,
        top,
        widthFocus: Math.max(0, right - left),
        heightFocus: Math.max(0, bottom - top),
        pointerX: Math.min(window.innerWidth - 30, rect.right - 2),
        pointerY: Math.max(8, rect.top - 24),
      })
    }

    const element = document.querySelector(`[data-guide-target="${target}"]`)
    element?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    const frame = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [target])

  if (!focus) return null

  const { width, height, left, top, widthFocus, heightFocus, pointerX, pointerY } = focus
  const focusRight = left + widthFocus
  const focusBottom = top + heightFocus
  const shades = [
    { left: 0, top: 0, width, height: top },
    { left: 0, top, width: left, height: heightFocus },
    { left: focusRight, top, width: Math.max(0, width - focusRight), height: heightFocus },
    { left: 0, top: focusBottom, width, height: Math.max(0, height - focusBottom) },
  ]

  return (
    <div className="guide-backdrop" aria-hidden="true">
      {shades.map((style, index) => <div className="guide-shade" key={index} style={style} />)}
      <div className="guide-focus-frame" style={{ left, top, width: widthFocus, height: heightFocus }} />
      <motion.div
        className="guide-pointer"
        initial={{ x: pointerX + 30, y: pointerY - 12, opacity: 0 }}
        animate={{ x: [pointerX + 30, pointerX, pointerX], y: [pointerY - 12, pointerY, pointerY], opacity: [0, 1, 1], scale: [1, 1.08, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.35 }}
      >
        <MousePointer2 size={26} />
        <span>Tap here</span>
      </motion.div>
    </div>
  )
}

function NasaCard({ nasa }) {
  const event = nasa.events[0]
  return (
    <section className="science-card">
      <div className="science-card-heading"><span className="science-icon"><Radio size={19} /></span><div><span className="section-kicker">NASA SPACE WEATHER</span><h2>Sun activity watch</h2></div></div>
      {nasa.source === 'loading' && <p className="science-copy">Connecting to NASA DONKI…</p>}
      {nasa.source === 'live' && event && (
        <div className="flare-reading">
          <strong>{event.cls}</strong><span>Solar flare<br /><b>Recorded {event.date}</b></span>
        </div>
      )}
      {nasa.source === 'live' && !event && <p className="science-copy">No solar flares were reported in this 60-day search window.</p>}
      {nasa.source === 'error' && (
        <div className="science-fallback">
          <b>NASA live feed unavailable</b>
          <span>No sample observations are substituted. Try again later or configure a NASA API key.</span>
          {nasa.error && <small>{nasa.error}</small>}
        </div>
      )}
      <p className="science-footnote">NASA flare records appear only when the live feed loads. Mission storm days are practice challenges, not forecasts.</p>
      <a className="source-link" href="https://kauai.ccmc.gsfc.nasa.gov/DONKI/" target="_blank" rel="noreferrer">Open NASA DONKI <ArrowUpRight size={14} /></a>
    </section>
  )
}

function LandingMap({ image, error, focusedSiteId, setFocusedSiteId }) {
  const focusedSite = LANDING_SITES.find((site) => site.id === focusedSiteId) || LANDING_SITES[0]
  return (
    <section className="content-card atlas-view">
      <div className="content-heading">
        <div><span className="section-kicker">NASA LUNAR ATLAS</span><h2>Six real Apollo landing regions</h2></div>
        <span className="map-coordinate-readout">{focusedSite.name}</span>
      </div>
      <div className="game-moon-map">
        {image ? (
          <img src={image.imageUrl} alt="NASA GRAIL gravity field map of the Moon" />
        ) : (
          <div className="game-map-status">{error || 'Loading NASA’s GRAIL Moon map…'}</div>
        )}
        {LANDING_SITES.map((site, index) => (
          <button
            key={site.id}
            style={getMapPosition(site)}
            className={`map-pin ${site.id === focusedSite.id ? 'is-selected' : ''} ${site.id === 'apollo-12' ? 'is-offset' : ''}`}
            onClick={() => setFocusedSiteId(site.id)}
            title={`${site.mission} · ${site.name}`}
            aria-label={`View ${site.mission}, ${site.name}`}
            aria-pressed={site.id === focusedSite.id}
          >
            {index + 1}
          </button>
        ))}
      </div>
      <div className="atlas-facts">
        <div><span>SELECTED REGION</span><b>{focusedSite.mission} · {focusedSite.name}</b></div>
        <div><span>NASA MAP</span><b>GRAIL gravity field</b></div>
        <a href={NASA_MAP_PAGE} target="_blank" rel="noreferrer">View map source <ArrowUpRight size={14} /></a>
      </div>
      <p className="game-map-note">Apollo 12 is nudged for clarity; its line points to the exact location.</p>
      <div className="atlas-site-list">
        {LANDING_SITES.map((site, index) => (
          <button key={site.id} className={site.id === focusedSite.id ? 'is-selected' : ''} onClick={() => setFocusedSiteId(site.id)}>
            <i>{index + 1}</i><span><b>{site.mission}</b><small>{site.name}</small></span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default function Game() {
  const g = useGame()
  const [activeTab, setActiveTab] = useState('mission')
  const [focusedSiteId, setFocusedSiteId] = useState(g.selectedSite)
  const [mapAsset, setMapAsset] = useState(g.moonMapImage)
  const [mapError, setMapError] = useState('')
  const selectedSite = LANDING_SITES.find((site) => site.id === g.selectedSite) || LANDING_SITES[0]
  const steps = useMemo(() => tutorialSteps(g.name || 'Commander', selectedSite), [g.name, selectedSite])
  const inTutorial = g.screen === 'tutorial'
  const step = steps[g.tutorialStep]
  const playing = g.status === 'playing'
  const stormSoon = STORM_DAYS.includes(g.day) || STORM_DAYS.includes(g.day + 1)

  useEffect(() => {
    if (mapAsset) {
      useGame.getState().setMoonMapImage(mapAsset)
      return
    }

    let active = true
    loadNasaImage(MOON_MAP_ID, true).then(
      (asset) => active && setMapAsset(asset),
      (error) => active && setMapError(error.message)
    )
    return () => { active = false }
  }, [mapAsset])

  useEffect(() => {
    if (g.nasa.source !== 'loading') return
    let active = true
    loadSpaceWeather().then((result) => {
      if (active) useGame.getState().setNasa(result)
    })
    return () => { active = false }
  }, [g.nasa.source])

  useEffect(() => {
    if (inTutorial && step) speak(step.text, g.muted)
  }, [inTutorial, g.tutorialStep, g.muted, step])

  useEffect(() => {
    if (g.screen === 'game' && g.message) speak(g.message, g.muted)
  }, [g.message, g.muted, g.screen])

  useEffect(() => {
    if (g.muted) stopSpeaking()
  }, [g.muted])

  function advanceTutorial() {
    if (g.tutorialStep < steps.length - 1) useGame.setState({ tutorialStep: g.tutorialStep + 1 })
  }

  function previousTutorialStep() {
    if (g.tutorialStep > 0) useGame.setState({ tutorialStep: g.tutorialStep - 1 })
  }

  function chooseTab(tab) {
    if (inTutorial && step?.tab !== tab) return
    setActiveTab(tab)
    if (inTutorial) advanceTutorial()
  }

  function runAction(action) {
    if (inTutorial && step?.action !== action) return
    if (inTutorial && g.tutorialActionsDone.includes(action)) {
      advanceTutorial()
      return
    }
    const actionsLeft = g.actionsLeft
    g.act(action)
    if (inTutorial) {
      if (useGame.getState().actionsLeft === actionsLeft) return
      useGame.setState((state) => ({ tutorialActionsDone: [...state.tutorialActionsDone, action] }))
      advanceTutorial()
    }
  }

  function finishDay() {
    if (inTutorial && step?.action !== 'endday') return
    g.endDay()
    if (inTutorial) useGame.setState({ screen: 'game' })
  }

  function skip() {
    stopSpeaking()
    useGame.setState({ screen: 'game', message: `Let’s go, ${g.name}! Keep your crew safe.` })
  }

  return (
    <main className="game-app">
      <header className="game-topbar">
        <div className="mission-brand">
          <span className="brand-orbit">◉</span>
          <span className="brand-lockup"><strong>LUNAR OUTPOST ACADEMY</strong><small>SSRO</small></span>
        </div>
        <div className="current-site"><MapPinLabel /> <span>{selectedSite.mission}<b>{selectedSite.name}</b></span></div>
        <nav className="game-nav" aria-label="Mission navigation">
          <button data-guide-target="mission" className={activeTab === 'mission' ? 'active' : ''} onClick={() => chooseTab('mission')}><Compass size={17} /> Mission</button>
          <button data-guide-target="map" className={activeTab === 'map' ? 'active' : ''} onClick={() => chooseTab('map')}><Map size={17} /> Landing map</button>
          <button data-guide-target="nasa" className={activeTab === 'nasa' ? 'active' : ''} onClick={() => chooseTab('nasa')}><Satellite size={17} /> NASA data</button>
        </nav>
        <button className="sound-toggle" onClick={g.toggleMute} aria-label={g.muted ? 'Turn sound on' : 'Turn sound off'}>
          {g.muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
        </button>
        <button className="logout-button" onClick={g.logout} aria-label="Log out" title="Log out">
          <LogOut size={15} /><span>Log out</span>
        </button>
        <ThemeToggle />
      </header>

      <div className="game-body">
        <aside className="mission-sidebar">
          <div className="commander-heading">
            <div className="commander-avatar">✦</div>
            <div><span className="section-kicker">MISSION CONTROL</span><h1>{g.name || 'Commander'}</h1></div>
          </div>
          <div className="commander-score"><Trophy size={15} /><span><small>MISSION POINTS</small><b>{g.score}</b></span></div>
          <div className="day-progress"><div><span>MISSION DAY</span><b>{String(g.day).padStart(2, '0')} <small>/ {MAX_DAYS}</small></b></div><div className="day-track"><i style={{ width: `${g.day / MAX_DAYS * 100}%` }} /></div></div>

          <div className="resource-section">
            <div className="sidebar-section-heading"><span>BASE SYSTEMS</span><small>Keep them above zero</small></div>
            <Meter icon={Wind} label="Air" value={g.oxygen} color="air-fill" />
            <Meter icon={BatteryCharging} label="Power" value={g.power} color="power-fill" />
            <Meter icon={ShieldCheck} label="Shield" value={g.shielding} color="shield-fill" />
          </div>

          {playing ? (
            <div className="jobs-section">
              <div className="sidebar-section-heading"><span>TODAY’S JOBS</span><small>{g.actionsLeft} left</small></div>
              <div className="job-list">
                <ActionButton guideTarget="scrubbers" icon={Wind} label="Make fresh air" detail="+20 air · uses 8 power" onClick={() => runAction('scrubbers')} disabled={inTutorial ? step?.action !== 'scrubbers' : g.actionsLeft === 0} tone="blue" />
                <ActionButton guideTarget="charge" icon={BatteryCharging} label="Charge batteries" detail="+25 power" onClick={() => runAction('charge')} disabled={inTutorial ? step?.action !== 'charge' : g.actionsLeft === 0} tone="gold" />
                <ActionButton icon={ShieldCheck} label="Strengthen shield" detail="+20 shield · uses 8 power" onClick={() => runAction('shield')} disabled={inTutorial || g.actionsLeft === 0} tone="green" />
                <ActionButton icon={Users} label={g.sheltered ? 'Crew in safe room' : 'Send crew to safety'} detail={stormSoon ? 'Storm practice: shelter now' : 'Protect them on storm days'} onClick={() => runAction('shelter')} disabled={inTutorial || g.actionsLeft === 0 || g.sheltered} tone="rose" />
              </div>
              <div>
                <ActionButton guideTarget="endday" icon={Moon} label="End the day" detail="Rest and begin tomorrow" onClick={finishDay} disabled={inTutorial && step?.action !== 'endday'} tone="violet" />
              </div>
            </div>
          ) : (
            <div className="mission-result">
              <span>{g.status === 'won' ? 'MISSION COMPLETE' : 'MISSION PAUSED'}</span>
              <p>{g.message}</p>
              <button onClick={g.reset}><RotateCcw size={16} /> Play again</button>
            </div>
          )}

          <div className="sidebar-tip"><span>✦</span><p><b>Luna’s tip</b><br />{g.message || 'Choose two jobs to help your crew today.'}</p></div>
        </aside>

        <section className="mission-content">
          {!inTutorial && g.message && <div className="game-message" role="status">{g.message}</div>}
          {activeTab === 'mission' && (
            <>
              <div className="mission-scene">
                {g.landingImage ? (
                  <img className="mission-photo" src={g.landingImage.imageUrl} alt={`${g.landingImage.title}, a NASA archive image from the ${selectedSite.name} landing region`} />
                ) : (
                  <div className="mission-photo-placeholder">
                    <Satellite size={36} />
                    <b>NASA image unavailable</b>
                    <span>The mission can continue; try again when the NASA image archive is online.</span>
                  </div>
                )}
                <div className="scene-vignette" />
                <div className="scene-topline"><span><i /> ARCHIVE IMAGE · {selectedSite.mission.toUpperCase()}</span><span>NASA / APOLLO PROGRAM</span></div>
                <div className="scene-caption">
                  <span className="section-kicker">YOUR EXPLORATION SITE</span>
                  <h2>{selectedSite.name}</h2>
                  <p>{selectedSite.summary}</p>
                </div>
                {g.landingImage && (
                  <a className="photo-credit" href={g.landingImage.sourceUrl} target="_blank" rel="noreferrer">
                    {g.landingImage.title} · {g.landingImage.credit} <ArrowUpRight size={13} />
                  </a>
                )}
              </div>
              <div className="mission-brief">
                <div><span className="section-kicker">TODAY’S PLAN</span><h2>{stormSoon ? 'Prepare the crew for a storm drill.' : 'Keep the base ready for tomorrow.'}</h2></div>
                <p>Choose two jobs from Mission Control. The photo above is a real NASA archive image; the Moon-base survival challenge is a learning simulation.</p>
              </div>
              <div className="mission-footnote"><span><MapPinLabel /> {selectedSite.mission} · {selectedSite.name}</span><span>Coordinates {Math.abs(selectedSite.latitude).toFixed(2)}°{selectedSite.latitude >= 0 ? 'N' : 'S'}, {Math.abs(selectedSite.longitude).toFixed(2)}°{selectedSite.longitude >= 0 ? 'E' : 'W'}</span></div>
            </>
          )}
          {activeTab === 'map' && <LandingMap image={mapAsset} error={mapError} focusedSiteId={focusedSiteId} setFocusedSiteId={setFocusedSiteId} />}
          {activeTab === 'nasa' && (
            <div className="science-view">
              <div className="content-heading"><div><span className="section-kicker">REAL DATA · REAL MISSIONS</span><h2>What NASA is observing</h2></div><span className="data-source-pill"><i /> DONKI / NASA IMAGES</span></div>
              <NasaCard nasa={g.nasa} />
              <div className="science-explainer"><div className="science-icon"><Satellite size={20} /></div><div><b>How to read this</b><p>NASA’s DONKI database records solar events scientists have observed. A solar flare is a burst of energy from the Sun. This game’s storm drills are fictional practice events and are not predictions.</p></div></div>
              {g.landingImage && <div className="selected-archive"><img src={g.landingImage.imageUrl} alt={g.landingImage.title} /><div><span className="section-kicker">YOUR NASA IMAGE</span><b>{g.landingImage.title}</b><a href={g.landingImage.sourceUrl} target="_blank" rel="noreferrer">Open NASA archive <ArrowUpRight size={14} /></a></div></div>}
            </div>
          )}
        </section>
      </div>

      {inTutorial && step && (
        <TutorialSpotlight target={step.target} />
      )}

      {inTutorial && step && (
        <motion.section
          key={g.tutorialStep}
          className="captain-guide"
          initial={{ y: 22, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          role="dialog"
          aria-labelledby="guide-title"
        >
          <div className="guide-mascot" aria-hidden="true">✦</div>
          <div className="guide-copy">
            <div className="guide-meta">CAPTAIN LUNA <span>·</span> {String(g.tutorialStep + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</div>
            <h2 id="guide-title">{step.title}</h2>
            <p>{step.text}</p>
            <div className="guide-progress"><i style={{ width: `${(g.tutorialStep + 1) / steps.length * 100}%` }} /></div>
          </div>
          <div className="guide-actions">
            <button onClick={() => speak(step.text, g.muted)} aria-label="Hear Captain Luna again"><Volume2 size={17} /></button>
            <button onClick={previousTutorialStep} disabled={g.tutorialStep === 0}>Previous</button>
            <button onClick={skip}>Skip</button>
            <button onClick={g.logout}>Log out</button>
          </div>
        </motion.section>
      )}
    </main>
  )
}

function MapPinLabel() {
  return <Map size={15} aria-hidden="true" />
}
