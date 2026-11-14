export const MOON_MAP_ID = 'PIA16587'

export const LANDING_SITES = [
  {
    id: 'apollo-11',
    mission: 'Apollo 11',
    name: 'Sea of Tranquility',
    latitude: 0.67416,
    longitude: 23.47314,
    photoId: 'as11-40-5903',
    summary: 'The first crewed Moon landing. NASA astronaut Buzz Aldrin explored this plain with Neil Armstrong.',
  },
  {
    id: 'apollo-12',
    mission: 'Apollo 12',
    name: 'Ocean of Storms',
    latitude: -3.01239,
    longitude: -23.42157,
    photoId: 'PIA12922',
    summary: 'Apollo 12 landed near the Surveyor 3 robot spacecraft. NASA’s Lunar Reconnaissance Orbiter later photographed the site.',
  },
  {
    id: 'apollo-14',
    mission: 'Apollo 14',
    name: 'Fra Mauro',
    latitude: -3.64530,
    longitude: -17.47136,
    photoId: 'PIA12897',
    summary: 'A rugged highlands region. LRO images show the astronauts’ walking trail near Cone Crater.',
  },
  {
    id: 'apollo-15',
    mission: 'Apollo 15',
    name: 'Hadley–Apennine',
    latitude: 26.13222,
    longitude: 3.63386,
    photoId: 'as15-88-11866',
    summary: 'A mountain-and-rille landscape. Apollo 15 was the first mission to use a Moon rover.',
  },
  {
    id: 'apollo-16',
    mission: 'Apollo 16',
    name: 'Descartes Highlands',
    latitude: -8.97301,
    longitude: 15.50019,
    photoId: 'S71-44150',
    summary: 'A highland landing area selected to study the Moon’s ancient, rocky surface.',
  },
  {
    id: 'apollo-17',
    mission: 'Apollo 17',
    name: 'Taurus–Littrow',
    latitude: 20.19080,
    longitude: 30.77168,
    photoId: 'as17-137-20979',
    summary: 'The last Apollo crewed landing. The crew explored a valley between mountains using a rover.',
  },
]

export const NASA_MAP_PAGE = `https://images.nasa.gov/details/${MOON_MAP_ID}`

export function getMapPosition(site) {
  const longitude = ((site.longitude % 360) + 360) % 360
  const latitude = Math.max(-85, Math.min(85, site.latitude)) * Math.PI / 180
  const mercator = Math.log(Math.tan(Math.PI / 4 + latitude / 2))
  const mapLongitude = 11.5 + longitude / 360 * 82.5
  return {
    left: `${mapLongitude}%`,
    top: `${(1 - mercator / Math.PI) / 2 * 100}%`,
    translate: site.id === 'apollo-12' ? '-28px 0' : '0 0',
  }
}
