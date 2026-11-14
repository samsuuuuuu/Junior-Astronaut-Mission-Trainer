const KEY = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY'

// Saved real solar flares, used only if the live NASA call fails.
// VERIFY these dates and classes on NASA DONKI before you submit.
export const SAVED_EVENTS = [
  { date: '2024-10-03', cls: 'X9.0', type: 'Solar flare' },
  { date: '2024-05-14', cls: 'X8.7', type: 'Solar flare' },
  { date: '2024-05-11', cls: 'X5.8', type: 'Solar flare' },
  { date: '2017-09-06', cls: 'X9.3', type: 'Solar flare' },
  { date: '2003-10-28', cls: 'X17.2', type: 'Solar flare' },
]

const iso = (d) => d.toISOString().slice(0, 10)
const rank = (c) => ({ X: 3, M: 2, C: 1, B: 0 }[c?.[0]] ?? 0)

export async function loadSpaceWeather() {
  try {
    const end = new Date()
    const start = new Date(Date.now() - 60 * 24 * 3600 * 1000)
    const url = `https://api.nasa.gov/DONKI/FLR?startDate=${iso(start)}&endDate=${iso(end)}&api_key=${KEY}`
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 6000)
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) throw new Error('NASA API error')
    const data = await res.json()
    const events = data
      .filter((e) => e.classType)
      .map((e) => ({ date: (e.peakTime || e.beginTime).slice(0, 10), cls: e.classType, type: 'Solar flare' }))
      .sort((a, b) => rank(b.cls) - rank(a.cls) || parseFloat(b.cls.slice(1)) - parseFloat(a.cls.slice(1)))
      .slice(0, 3)
    if (events.length < 3) throw new Error('not enough events')
    return { source: 'live', events }
  } catch {
    return { source: 'saved', events: SAVED_EVENTS.slice(0, 3) }
  }
}