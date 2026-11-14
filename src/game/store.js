import { create } from 'zustand'

export const MAX_DAYS = 10
export const STORM_DAYS = [3, 6, 8]
const clamp = (n) => Math.max(0, Math.min(100, n))

const ACTIONS = {
  scrubbers: { oxygen: +20, power: -8, text: 'Great! The air machine made fresh air. Air goes up and power goes down a little.' },
  charge: { power: +25, text: 'Yay! The solar panels filled the batteries with power.' },
  shield: { shielding: +20, power: -8, text: 'Nice! The shield is stronger now. The crew is safer.' },
  shelter: { text: 'The crew is hiding in the safe room. Smart move!' },
}

const START = {
  day: 1,
  oxygen: 80,
  power: 80,
  shielding: 80,
  actionsLeft: 2,
  sheltered: false,
  status: 'playing',
  message: '',
}

export const useGame = create((set, get) => ({
  ...START,
  screen: 'welcome', // welcome | tutorial | game
  name: '',
  muted: false,
  tutorialStep: 0,
  nasa: { source: 'loading', events: [] },

  setName: (name) => set({ name }),
  setNasa: (nasa) => set({ nasa }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  startTutorial: () => set({ screen: 'tutorial', tutorialStep: 0 }),

  act: (type) => {
    const s = get()
    if (s.status !== 'playing' || s.actionsLeft === 0) return
    if (type === 'shelter' && s.sheltered) return
    const a = ACTIONS[type]
    set({
      oxygen: clamp(s.oxygen + (a.oxygen ?? 0)),
      power: clamp(s.power + (a.power ?? 0)),
      shielding: clamp(s.shielding + (a.shielding ?? 0)),
      sheltered: type === 'shelter' ? true : s.sheltered,
      actionsLeft: s.actionsLeft - 1,
      message: a.text,
    })
  },

  endDay: () => {
    const s = get()
    if (s.status !== 'playing') return
    const n = s.name || 'Commander'
    let oxygen = clamp(s.oxygen - 8)
    let power = clamp(s.power - 10)
    let shielding = clamp(s.shielding - 4)
    let note = 'A new day begins on the Moon.'

    if (STORM_DAYS.includes(s.day)) {
      if (s.sheltered) {
        shielding = clamp(shielding - 3)
        note = 'The space storm passed and everyone was safe in the safe room!'
      } else {
        shielding = clamp(shielding - 35)
        note = 'Oh no! The space storm hit the base. Next time, send the crew to the safe room.'
      }
    }

    let lostBecause = null
    if (oxygen === 0) lostBecause = 'The air ran out.'
    else if (power === 0) lostBecause = 'The base ran out of power.'
    else if (shielding === 0) lostBecause = 'The shield got too weak.'

    if (lostBecause) {
      set({ oxygen, power, shielding, status: 'lost', message: `Don't worry, ${n}! ${lostBecause} Let's try again and watch the bars.` })
    } else if (s.day >= MAX_DAYS) {
      set({ oxygen, power, shielding, status: 'won', message: `Hooray, ${n}! You kept everyone safe for 10 days. You are a super Moon Commander!` })
    } else {
      const nd = s.day + 1
      let extra = ''
      if (STORM_DAYS.includes(nd)) extra = ' Warning! NASA saw a solar flare on the Sun. A space storm hits tonight! Press the safe room button.'
      else if (STORM_DAYS.includes(nd + 1)) extra = ' NASA says a space storm may come tomorrow. Get ready!'
      set({ oxygen, power, shielding, day: nd, actionsLeft: 2, sheltered: false, message: note + extra })
    }
  },

  reset: () => set({ ...START, message: `Let's try again, ${get().name || 'Commander'}!` }),
}))