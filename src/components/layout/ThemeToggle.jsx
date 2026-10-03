import useTheme from '../../hooks/useTheme'
import { toggleTheme } from '../../lib/theme'
import './ThemeToggle.css'

/**
 * Light and dark switch.
 *
 * The icon shows the theme the button will switch TO, which is the convention
 * people expect, so the label and the glyph always agree.
 */
export default function ThemeToggle({ className = '' }) {
  const theme = useTheme()
  const goingLight = theme === 'dark'
  const label = goingLight ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <span className="theme-toggle__icons" aria-hidden="true">
        <i className="bi bi-brightness-high-fill theme-toggle__sun" />
        <i className="bi bi-moon-stars-fill theme-toggle__moon" />
      </span>
    </button>
  )
}
