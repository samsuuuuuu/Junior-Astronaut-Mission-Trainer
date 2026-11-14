import { useGame } from './game/store'
import Welcome from './screens/Welcome'
import LandingSites from './screens/LandingSites'
import Game from './screens/game'

export default function App() {
  const screen = useGame((s) => s.screen)
  const theme = useGame((s) => s.theme)
  const content = screen === 'welcome'
    ? <Welcome />
    : screen === 'landing'
      ? <LandingSites />
      : <Game />

  return <div className="app-theme" data-theme={theme}>{content}</div>
}