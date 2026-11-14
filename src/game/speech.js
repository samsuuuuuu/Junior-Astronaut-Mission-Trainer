const ENGLISH_FEMALE = /\b(zira|aria|jenny|jane|samantha|sara|ava|emma|allison|karen|moira|tessa|serena|hazel|female)\b/i
const ENGLISH_MALE = /\b(david|mark|guy|male)\b/i

function narratorVoice(voices) {
  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith('en'))
  return english.find((voice) => ENGLISH_FEMALE.test(voice.name))
    || voices.find((voice) => ENGLISH_FEMALE.test(voice.name))
    || english.find((voice) => !ENGLISH_MALE.test(voice.name))
    || english[0]
    || voices[0]
}

export function speak(text, muted) {
  if (muted || typeof window === 'undefined' || !('speechSynthesis' in window)) return
  const synthesis = window.speechSynthesis
  synthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.88
  utterance.pitch = 1.04
  utterance.volume = 1
  const voice = narratorVoice(synthesis.getVoices())
  if (voice) {
    utterance.voice = voice
    utterance.lang = voice.lang
  }
  synthesis.speak(utterance)
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
}