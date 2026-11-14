import { create } from 'zustand'

export const MAX_DAYS = 10
const clamp = (n) => Math.max(0, Math.min(100, n))

const ACTIONS = {
  scrubbers: { oxygen: +20, power: -8, text: 'Scrubbers cleaned the air. Oxygen up, power down.' },
  charge: { power: +25, text: 'Batteries charged from the solar panels.' },
  shield: { shielding: +20, power: -8, text: 'Shield reinforced. The crew is safer.' },
}

const START = {
  day: 1,
  oxygen: 80,
  power: 80,
  shielding: 80,
  actionsLeft: 2,
  status: 'playing',
  message: 'Welcome, Commander! Keep your crew alive for 10 days.',
}

export const useGame = create((set, get) => ({
  ...START,

  act: (type) => {
    const s = get()
    if (s.status !== 'playing' || s.actionsLeft === 0) return
    const a = ACTIONS[type]
    set({
      oxygen: clamp(s.oxygen + (a.oxygen ?? 0)),
      power: clamp(s.power + (a.power ?? 0)),
      shielding: clamp(s.shielding + (a.shielding ?? 0)),
      actionsLeft: s.actionsLeft - 1,
      message: a.text,
    })
  },

  endDay: () => {
    const s = get()
    if (s.status !== 'playing') return
    const oxygen = clamp(s.oxygen - 8)
    const power = clamp(s.power - 10)
    const shielding = clamp(s.shielding - 4)

    let lostBecause = null
    if (oxygen === 0) lostBecause = 'The air ran out.'
    else if (power === 0) lostBecause = 'The base lost all its power.'
    else if (shielding === 0) lostBecause = 'The crew was hit by too much radiation.'

    if (lostBecause) {
      set({ oxygen, power, shielding, status: 'lost', message: lostBecause })
    } else if (s.day >= MAX_DAYS) {
      set({ oxygen, power, shielding, status: 'won', message: 'You kept everyone safe. Great job, Commander!' })
    } else {
      set({ oxygen, power, shielding, day: s.day + 1, actionsLeft: 2, message: 'A new day begins on the Moon.' })
    }
  },

  reset: () => set({ ...START }),
}))