import { useGame } from './game/store'
import Welcome from './screens/Welcome'
import LandingSites from './screens/LandingSites'
import Game from './screens/game'

const COPYRIGHT_YEAR = new Date().getFullYear()

export default function App() {
  const screen = useGame((s) => s.screen)
  const theme = useGame((s) => s.theme)
  const content = screen === 'welcome'
    ? <Welcome />
    : screen === 'landing'
      ? <LandingSites />
      : <Game />

  return (
    <div className="app-theme" data-theme={theme}>
      {content}
      <footer className="app-footer">
        <span>© {COPYRIGHT_YEAR} Lunar Outpost Academy · SSRO</span>
        <a href="mailto:samsonvarghese3062004@gmail.com">Contact</a>
        <nav aria-label="Social links">
          <a href="https://github.com/samsuuuuuu" target="_blank" rel="noreferrer">Developed by Samson Varghese</a>
          <a href="https://github.com/samsuuuuuu" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://www.linkedin.com/in/samson-varghese-samsuuu/" target="_blank" rel="noreferrer">LinkedIn</a>
        </nav>
      </footer>
    </div>
  )
}