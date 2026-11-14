import { lazy, Suspense } from 'react'
import { motion } from 'motion/react'
import { Wind, BatteryCharging, ShieldCheck, Moon, RotateCcw } from 'lucide-react'
import { useGame, MAX_DAYS } from './game/store'

const MoonBase = lazy(() => import('./scene/MoonBase'))

function Meter({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <div className="flex items-center justify-between text-base font-bold">
        <span className="flex items-center gap-2"><Icon size={20} /> {label}</span>
        <span className={value < 30 ? 'text-rose-300' : ''}>{value}%</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={`h-full rounded-full ${color}`}
          animate={{ width: value + '%' }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  )
}

function ActionButton({ icon: Icon, label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-base font-bold text-slate-900 transition active:scale-95 disabled:opacity-40"
    >
      <Icon size={20} /> {label}
    </button>
  )
}

export default function App() {
  const g = useGame()
  const playing = g.status === 'playing'

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="absolute inset-0">
        <Suspense fallback={<div className="grid h-full place-items-center">Loading the Moon base…</div>}>
          <MoonBase />
        </Suspense>
      </div>

      <aside className="absolute inset-x-0 bottom-0 max-h-[55vh] space-y-3 overflow-y-auto bg-slate-950/70 p-4 backdrop-blur md:inset-y-0 md:left-0 md:right-auto md:max-h-none md:w-96">
        <h1 className="text-2xl font-extrabold">🌙 Moon Base Commander</h1>
        <p className="text-lg">Day {g.day} of {MAX_DAYS} · Actions left: {g.actionsLeft}</p>

        <Meter icon={Wind} label="Oxygen" value={g.oxygen} color="bg-sky-400" />
        <Meter icon={BatteryCharging} label="Power" value={g.power} color="bg-amber-300" />
        <Meter icon={ShieldCheck} label="Shielding" value={g.shielding} color="bg-emerald-400" />

        <p className="rounded-xl bg-white/10 p-3 text-center">{g.message}</p>

        {playing ? (
          <div className="space-y-2">
            <ActionButton icon={Wind} label="Run air scrubbers" onClick={() => g.act('scrubbers')} disabled={g.actionsLeft === 0} />
            <ActionButton icon={BatteryCharging} label="Charge batteries" onClick={() => g.act('charge')} disabled={g.actionsLeft === 0} />
            <ActionButton icon={ShieldCheck} label="Reinforce shield" onClick={() => g.act('shield')} disabled={g.actionsLeft === 0} />
            <button onClick={g.endDay} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-base font-bold transition active:scale-95">
              <Moon size={20} /> End the day
            </button>
          </div>
        ) : (
          <button onClick={g.reset} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-base font-bold text-slate-900">
            <RotateCcw size={20} /> {g.status === 'won' ? 'Play again' : 'Try again'}
          </button>
        )}
      </aside>
    </div>
  )
}