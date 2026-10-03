import Reveal from '../ui/Reveal'
import WorkCard from './WorkCard'

export default function WorkGrid({ projects, columns = 3, priorityCount = 0 }) {
  if (!projects.length) {
    return (
      <div className="work-grid">
        <div className="work-grid__empty">Nothing in this category yet. Check back soon.</div>
      </div>
    )
  }

  return (
    <div className="work-grid">
      {projects.map((project, i) => (
        <Reveal key={project.id} delay={(i % columns) * 0.09}>
          <WorkCard project={project} priority={i < priorityCount} />
        </Reveal>
      ))}
    </div>
  )
}
