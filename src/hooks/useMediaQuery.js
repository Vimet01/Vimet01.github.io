import { useSyncExternalStore } from 'react'

const cache = new Map()

function getEntry(query) {
  let entry = cache.get(query)
  if (!entry) {
    const mql = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query) : null
    entry = {
      subscribe(onChange) {
        if (!mql) return () => {}
        if (mql.addEventListener) {
          mql.addEventListener('change', onChange)
          return () => mql.removeEventListener('change', onChange)
        }
        mql.addListener(onChange)
        return () => mql.removeListener(onChange)
      },
      getSnapshot: () => (mql ? mql.matches : false),
    }
    cache.set(query, entry)
  }
  return entry
}

/**
 * Reads a media query and re-renders when it changes, so plugging in a mouse
 * or switching on Reduce Motion takes effect straight away.
 */
export default function useMediaQuery(query) {
  const entry = getEntry(query)
  return useSyncExternalStore(entry.subscribe, entry.getSnapshot, () => false)
}
