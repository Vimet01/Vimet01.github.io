import { createContext, useCallback, useContext, useEffect, useMemo, useState, lazy, Suspense } from 'react'
import { lockBody, unlockBody } from '../lib/bodyLock'

const VideoModal = lazy(() => import('../components/video/VideoModal'))

/**
 * Actions and state live in separate contexts. Components that only need to
 * open or close a video (the header shell, every work card) subscribe to the
 * actions, which never change identity, so opening a video does not re-render
 * the whole application.
 */
const ActionsContext = createContext({ open: () => {}, close: () => {} })
const StateContext = createContext(null)

export function VideoModalProvider({ children }) {
  const [project, setProject] = useState(null)

  const open = useCallback((p) => setProject(p), [])
  const close = useCallback(() => setProject(null), [])

  const actions = useMemo(() => ({ open, close }), [open, close])

  const isOpen = Boolean(project)

  // The scroll lock lives here rather than inside VideoModal, because the
  // player arrives in a lazily loaded chunk. If the modal owned the lock, the
  // page would still scroll, still be tab reachable and still paint the custom
  // cursor behind the loading overlay for as long as that download took.
  useEffect(() => {
    if (!isOpen) return undefined
    const html = document.documentElement
    const root = document.getElementById('root')
    const opener = document.activeElement

    lockBody()
    html.classList.add('modal-open')
    if (root) root.inert = true

    return () => {
      if (root) root.inert = false
      html.classList.remove('modal-open')
      unlockBody()
      if (opener && typeof opener.focus === 'function') opener.focus({ preventScroll: true })
    }
  }, [isOpen])

  return (
    <ActionsContext.Provider value={actions}>
      <StateContext.Provider value={project}>
        {children}
        {project ? (
          <Suspense fallback={<div className="vm-loading" aria-label="Loading video" role="status" />}>
            <VideoModal key={project.id} project={project} onClose={close} />
          </Suspense>
        ) : null}
      </StateContext.Provider>
    </ActionsContext.Provider>
  )
}

export function useVideoModalActions() {
  return useContext(ActionsContext)
}

export function useVideoModalProject() {
  return useContext(StateContext)
}
