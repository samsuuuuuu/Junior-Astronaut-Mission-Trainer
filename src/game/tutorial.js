export const tutorialSteps = (name, site) => [
  {
    title: `Welcome, ${name}!`,
    text: `This is mission control for ${site?.name || 'the Moon'}. We’ll explore your NASA landing spot and learn how to care for the crew. Tap Mission.`,
    target: 'mission',
    tab: 'mission',
  },
  {
    title: 'Make fresh air',
    text: 'Air keeps the crew breathing. Tap Make fresh air to fill the air tanks. It uses a little power.',
    target: 'scrubbers',
    action: 'scrubbers',
  },
  {
    title: 'Charge the batteries',
    text: 'The base needs power. Tap Charge batteries to save energy for your crew.',
    target: 'charge',
    action: 'charge',
  },
  {
    title: 'Explore the landing map',
    text: 'Tap Landing map to see NASA’s Moon gravity map and the historic Apollo landing markers.',
    target: 'map',
    tab: 'map',
  },
  {
    title: 'See NASA’s space weather',
    text: 'Tap NASA data to see real solar observations when the live NASA feed is available.',
    target: 'nasa',
    tab: 'nasa',
  },
  {
    title: 'Start your Moon-base mission',
    text: 'You made fresh air and charged the batteries. Tap End the day to begin your ten-day crew mission.',
    target: 'endday',
    action: 'endday',
  },
]
