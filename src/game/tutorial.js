export const tutorialSteps = (name) => [
  { text: `Hi ${name}! I am Captain Luna. Welcome to your very own Moon base!`, focus: 'scene' },
  { text: 'Look at the Moon base. The crew lives inside the dome. Your job is to keep them safe for 10 days.', focus: 'scene' },
  { text: 'These are the 3 bars. Air is for breathing. Power runs everything. The shield keeps out space rays. Never let a bar reach zero!', focus: 'meters' },
  { text: 'These are your helper buttons. You can press 2 buttons each day. The air machine makes air. The batteries make power. The shield button makes the shield stronger.', focus: 'actions' },
  { text: 'Sometimes the Sun makes a space storm! NASA scientists watch the Sun. When a storm is coming, press the safe room button so the crew can hide.', focus: 'actions' },
  { text: 'When you finish your 2 buttons, press End the day. Night comes and the bars go down a little.', focus: 'endday' },
  { text: `That is it, ${name}! Keep your crew safe for 10 days. Good luck, Commander!`, focus: null },
]