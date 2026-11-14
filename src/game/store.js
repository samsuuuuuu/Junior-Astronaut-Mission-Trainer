import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

export const useGame = create(persist((set, get) => ({
  ...START,
  screen: 'welcome', // welcome | landing | tutorial | game
  name: '',
  selectedSite: 'apollo-11',
  landingImage: null,
  moonMapImage: null,
  muted: false,
  theme: 'dark',
  tutorialStep: 0,
  tutorialActionsDone: [],
  nasa: { source: 'loading', events: [] },
  score: 0,
  mazePosition: { x: 1, y: 1 },
  mazeCollected: [],
  mazeComplete: false,

  setName: (name) => set({ name }),
  startSiteSelection: () => set((s) => ({ screen: 'landing', selectedSite: s.selectedSite || 'apollo-11' })),
  selectLandingSite: (selectedSite) => set((s) => s.selectedSite === selectedSite ? {} : ({
    selectedSite,
    mazePosition: { x: 1, y: 1 },
    mazeCollected: [],
    mazeComplete: false,
  })),
  setMazeProgress: (mazePosition, mazeCollected) => set({ mazePosition, mazeCollected }),
  addScore: (points) => set((s) => ({ score: s.score + points })),
  completeMaze: () => set((s) => s.mazeComplete ? {} : ({ mazeComplete: true, score: s.score + 250 })),
  launchMission: (selectedSite, landingImage) => set({
    ...START,
    screen: 'tutorial',
    selectedSite,
    landingImage,
    tutorialStep: 0,
    tutorialActionsDone: [],
    mazeComplete: true,
  }),
  setMoonMapImage: (moonMapImage) => set({ moonMapImage }),
  setNasa: (nasa) => set({ nasa }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  startTutorial: () => set({ screen: 'tutorial', tutorialStep: 0, tutorialActionsDone: [] }),

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
      if (STORM_DAYS.includes(nd)) extra = ' Mission practice alert: a space-storm challenge is coming tomorrow. This is a game challenge, not a NASA forecast.'
      else if (STORM_DAYS.includes(nd + 1)) extra = ' A space-storm practice challenge may come tomorrow. Get the crew ready!'
      set({ oxygen, power, shielding, day: nd, actionsLeft: 2, sheltered: false, message: note + extra })
    }
  },

  reset: () => set({ ...START, screen: 'game', message: `Let's try again, ${get().name || 'Commander'}!` }),
}), {
  name: 'junior-astronaut-mission',
  partialize: (s) => ({
    ...START,
    screen: s.screen,
    name: s.name,
    selectedSite: s.selectedSite,
    landingImage: s.landingImage,
    moonMapImage: s.moonMapImage,
    muted: s.muted,
    theme: s.theme,
    tutorialStep: s.tutorialStep,
    tutorialActionsDone: s.tutorialActionsDone,
    nasa: s.nasa,
    score: s.score,
    mazePosition: s.mazePosition,
    mazeCollected: s.mazeCollected,
    mazeComplete: s.mazeComplete,
    day: s.day,
    oxygen: s.oxygen,
    power: s.power,
    shielding: s.shielding,
    actionsLeft: s.actionsLeft,
    sheltered: s.sheltered,
    status: s.status,
    message: s.message,
  }),
}))