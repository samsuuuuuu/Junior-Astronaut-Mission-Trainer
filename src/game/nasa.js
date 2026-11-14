const KEY = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY'

const iso = (date) => date.toISOString().slice(0, 10)
const rank = (classType) => ({ X: 3, M: 2, C: 1, B: 0 }[classType?.[0]] ?? 0)

export async function loadNasaImage(nasaId, preferOriginal = false) {
  const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(nasaId)}&media_type=image&page_size=5`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`NASA Images returned status ${response.status}.`)
    const result = await response.json()
    const item = result.collection?.items?.find((candidate) =>
      candidate.data?.some((entry) => entry.nasa_id?.toLowerCase() === nasaId.toLowerCase())
    )
    const metadata = item?.data?.[0]
    if (!item || !metadata) throw new Error(`NASA image ${nasaId} was not found.`)

    const imageLinks = (item.links || []).filter((link) => link.render === 'image' && link.href)
    const sizedImages = imageLinks.filter((link) => link.width && link.width <= 1920)
    const original = imageLinks.find((link) => link.rel === 'canonical')
    const image = (preferOriginal && original)
      || sizedImages.sort((a, b) => a.width - b.width).at(-1)
      || original
      || imageLinks[0]
    if (!image) throw new Error(`NASA image ${nasaId} has no displayable image.`)

    return {
      nasaId,
      title: metadata.title || nasaId,
      description: metadata.description_508 || metadata.description || '',
      credit: metadata.secondary_creator || metadata.photographer || metadata.center || 'NASA',
      imageUrl: image.href,
      sourceUrl: `https://images.nasa.gov/details/${nasaId}`,
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`NASA Images request for ${nasaId} timed out.`)
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

export async function loadSpaceWeather() {
  const end = new Date()
  const start = new Date(Date.now() - 60 * 24 * 3600 * 1000)
  const url = `https://api.nasa.gov/DONKI/FLR?startDate=${iso(start)}&endDate=${iso(end)}&api_key=${KEY}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`NASA DONKI returned status ${response.status}.`)
    const data = await response.json()
    if (!Array.isArray(data)) throw new Error('NASA DONKI returned an unexpected response.')

    const events = data
      .filter((event) => event.classType && (event.peakTime || event.beginTime))
      .map((event) => ({
        date: (event.peakTime || event.beginTime).slice(0, 10),
        cls: event.classType,
        type: 'Solar flare',
      }))
      .sort((a, b) => rank(b.cls) - rank(a.cls) || parseFloat(b.cls.slice(1)) - parseFloat(a.cls.slice(1)))
      .slice(0, 3)

    return { source: 'live', events }
  } catch (error) {
    const message = error.name === 'AbortError'
      ? 'The NASA DONKI request timed out.'
      : error instanceof Error
        ? error.message
        : 'The NASA DONKI request failed.'
    return { source: 'error', events: [], error: message }
  } finally {
    clearTimeout(timer)
  }
}
