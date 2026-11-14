import { useGame } from './game/store'
import Welcome from './screens/Welcome'
import Game from './screens/Game'

export default function App() {
  const screen = useGame((s) => s.screen)
  return screen === 'welcome' ? <Welcome /> : <Game />
}