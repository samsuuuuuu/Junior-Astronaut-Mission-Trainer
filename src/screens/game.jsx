import { lazy, Suspense, useEffect } from 'react'
import { motion } from 'motion/react'
import { Wind, BatteryCharging, ShieldCheck, Moon, RotateCcw, Users, Volume2, VolumeX } from 'lucide-react'
import { useGame, MAX_DAYS, STORM_DAYS } from '../game/store'
import { speak, stopSpeaking } from '../game/speech'
import { tutorialSteps } from '../game/tutorial'

const MoonBase = lazy(() => import('../scene/MoonBase'))

function Meter({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <div className="flex items-center justify-between text-lg font-bold">
        <span className="flex items-center gap-2"><Icon size={22} /> {label}</span>
        <span className={value < 30 ? 'text-rose-300' : ''}>{value}%</span>
      </div>
      <div className="mt-2 h-4 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={`h-full rounded-full ${color}`}
          animate={{ width: value + '%' }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  )
}

function ActionButton({ icon: Icon, label, onClick, disabled, color = 'bg-amber-400 text-slate-900' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-lg font-bold transition active:scale-95 disabled:opacity-40 ${color}`}
    >
      <Icon size={22} /> {label}
    </button>
  )
}

function NasaCard({ g }) {
  if (g.status !== 'playing') return null
  const todayIdx = STORM_DAYS.indexOf(g.day)
  const tomorrowIdx = STORM_DAYS.indexOf(g.day + 1)
  const idx = todayIdx >= 0 ? todayIdx : tomorrowIdx
  if (idx < 0) return null
  const today = todayIdx >= 0
  const ev = g.nasa.events.length ? g.nasa.events[idx % g.nasa.events.length] : null
  const strength = ev?.cls?.[0] === 'X' ? 'super strong' : ev?.cls?.[0] === 'M' ? 'strong' : 'small'
  const source = g.nasa.source === 'live' ? 'Live NASA data' : g.nasa.source === 'saved' ? 'Saved NASA examples' : 'Loading NASA data...'

  return (
    <div className={`rounded-2xl p-3 ${today ? 'bg-rose-500/30' : 'bg-amber-400/20'}`}>
      <p className="text-lg font-bold">{today ? '⚠️ Space storm tonight!' : '🔭 Forecast: storm tomorrow'}</p>
      {ev && <p>NASA saw a {strength} solar flare ({ev.cls}) on {ev.date}.</p>}
      <p className="mt-1 text-xs opacity-80">🛰️ {source} · from NASA's DONKI space weather database</p>
    </div>
  )
}

export default function Game() {
  const g = useGame()
  const steps = tutorialSteps(g.name || 'Commander')
  const inTutorial = g.screen === 'tutorial'
  const step = steps[g.tutorialStep]
  const last = g.tutorialStep === steps.length - 1
  const focus = inTutorial ? step.focus : null
  const playing = g.status === 'playing'
  const ring = (k) => (focus === k ? 'ring-4 ring-amber-300 rounded-2xl' : '')

  useEffect(() => {
    if (inTutorial) speak(step.text, g.muted)
  }, [inTutorial, g.tutorialStep])

  useEffect(() => {
    if (g.screen === 'game' && g.message) speak(g.message, g.muted)
  }, [g.message, g.screen])

  useEffect(() => {
    if (g.muted) stopSpeaking()
  }, [g.muted])

  function next() {
    if (last) {
      useGame.setState({ screen: 'game', message: `Let's go, ${g.name}! Keep your crew safe.` })
    } else {
      useGame.setState({ tutorialStep: g.tutorialStep + 1 })
    }
  }

  function skip() {
    stopSpeaking()
    useGame.setState({ screen: 'game', message: `Let's go, ${g.name}! Keep your crew safe.` })
  }

  const locked = inTutorial

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className={`absolute inset-0 ${focus === 'scene' ? 'ring-8 ring-inset ring-amber-300' : ''}`}>
        <Suspense fallback={<div className="grid h-full place-items-center text-xl">Loading the Moon base...</div>}>
          <MoonBase />
        </Suspense>
      </div>

      <button
        onClick={g.toggleMute}
        aria-label={g.muted ? 'Turn sound on' : 'Turn sound off'}
        className="fixed right-3 top-3 z-50 rounded-full bg-slate-900/80 p-3"
      >
        {g.muted ? <VolumeX /> : <Volume2 />}
      </button>

      <aside className="absolute inset-x-0 bottom-0 max-h-[55vh] space-y-3 overflow-y-auto bg-slate-950/70 p-4 backdrop-blur md:inset-y-0 md:left-0 md:right-auto md:max-h-none md:w-96">
        <h1 className="text-2xl font-extrabold">🌙 Lunar Outpost Academy</h1>
        <p className="text-lg">
          Commander {g.name} · Day {g.day} of {MAX_DAYS} · Buttons left: {g.actionsLeft}
        </p>

        <div className={`space-y-3 p-1 ${ring('meters')}`}>
          <Meter icon={Wind} label="Air" value={g.oxygen} color="bg-sky-400" />
          <Meter icon={BatteryCharging} label="Power" value={g.power} color="bg-amber-300" />
          <Meter icon={ShieldCheck} label="Shield" value={g.shielding} color="bg-emerald-400" />
        </div>

        {!inTutorial && g.message && <p className="rounded-xl bg-white/10 p-3 text-center text-lg">{g.message}</p>}
        {!inTutorial && <NasaCard g={g} />}

        {playing ? (
          <div className="space-y-2">
            <div className={`space-y-2 p-1 ${ring('actions')}`}>
              <ActionButton icon={Wind} label="Make fresh air" onClick={() => g.act('scrubbers')} disabled={locked || g.actionsLeft === 0} />
              <ActionButton icon={BatteryCharging} label="Charge batteries" onClick={() => g.act('charge')} disabled={locked || g.actionsLeft === 0} />
              <ActionButton icon={ShieldCheck} label="Make shield stronger" onClick={() => g.act('shield')} disabled={locked || g.actionsLeft === 0} />
              <ActionButton
                icon={Users}
                label={g.sheltered ? 'Crew is in the safe room' : 'Send crew to safe room'}
                onClick={() => g.act('shelter')}
                disabled={locked || g.actionsLeft === 0 || g.sheltered}
                color="bg-rose-400 text-slate-900"
              />
            </div>
            <div className={`p-1 ${ring('endday')}`}>
              <ActionButton icon={Moon} label="End the day" onClick={g.endDay} disabled={locked} color="bg-indigo-500 text-white" />
            </div>
          </div>
        ) : (
          <>
            <p className="rounded-xl bg-white/10 p-3 text-center text-lg">{g.message}</p>
            <ActionButton icon={RotateCcw} label={g.status === 'won' ? 'Play again' : 'Try again'} onClick={g.reset} color="bg-emerald-400 text-slate-900" />
          </>
        )}
      </aside>

      {inTutorial && (
        <motion.div
          key={g.tutorialStep}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed inset-x-2 top-2 z-40 rounded-3xl bg-white p-4 text-slate-900 shadow-2xl md:inset-x-auto md:bottom-4 md:left-[26rem] md:right-4 md:top-auto"
        >
          <div className="flex items-start gap-3">
            <div className="text-5xl">🧑‍🚀</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-indigo-600">Captain Luna · step {g.tutorialStep + 1} of {steps.length}</p>
              <p className="text-xl font-semibold leading-snug">{step.text}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={() => speak(step.text, g.muted)} className="rounded-xl bg-slate-200 px-4 py-2 font-bold">🔊 Say it again</button>
            <button onClick={skip} className="rounded-xl px-3 py-2 text-slate-500">Skip</button>
            <button onClick={next} className="ml-auto rounded-xl bg-amber-400 px-5 py-3 text-lg font-extrabold">
              {last ? 'Start playing! 🚀' : 'Next ➡️'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}