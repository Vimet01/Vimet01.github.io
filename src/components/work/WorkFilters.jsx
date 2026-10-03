import { categories } from '../../data/projects'
import './WorkFilters.css'

export default function WorkFilters({ active, onChange, counts }) {
  return (
    <div className="work-filters" role="group" aria-label="Filter work by category">
      {categories.map((c) => {
        const isActive = active === c.id
        const count = counts ? counts[c.id] : null
        return (
          <button
            key={c.id}
            type="button"
            className={`chip ${isActive ? 'is-active' : ''}`}
            aria-pressed={isActive}
            onClick={() => onChange(c.id)}
          >
            {c.label}
            {typeof count === 'number' ? <span className="work-filters__count">{count}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
