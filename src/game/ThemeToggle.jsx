import { Moon, Sun } from 'lucide-react'
import { useGame } from './store'

export default function ThemeToggle() {
  const theme = useGame((state) => state.theme)
  const toggleTheme = useGame((state) => state.toggleTheme)
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button className="theme-toggle" onClick={toggleTheme} aria-label={label} title={label}>
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
