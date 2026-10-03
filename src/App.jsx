import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { VideoModalProvider, useVideoModalActions } from './context/VideoModalContext'
import Cursor from './components/layout/Cursor'
import Footer from './components/layout/Footer'
import Header from './components/layout/Header'
import Preloader from './components/layout/Preloader'
import ScrollProgress from './components/layout/ScrollProgress'
import ScrollToTop from './components/layout/ScrollToTop'
import PageFallback from './components/ui/PageFallback'
import Home from './pages/Home'

const loadWork = () => import('./pages/Work')
const loadAbout = () => import('./pages/About')
const loadContact = () => import('./pages/Contact')

const Work = lazy(loadWork)
const About = lazy(loadAbout)
const Contact = lazy(loadContact)
const NotFound = lazy(() => import('./pages/NotFound'))

// Warm the route chunks once the first paint is done, so navigation feels instant.
if (typeof window !== 'undefined') {
  const warm = () => {
    loadWork()
    loadAbout()
    loadContact()
  }
  if ('requestIdleCallback' in window) window.requestIdleCallback(warm, { timeout: 3000 })
  else window.setTimeout(warm, 2500)
}

function Shell() {
  const location = useLocation()
  const { close } = useVideoModalActions()

  // Any open video closes when the route changes
  useEffect(() => {
    close()
  }, [location.pathname, close])

  return (
    <>
      <Preloader />
      <ScrollProgress />
      <Cursor />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        <div className="page" key={location.pathname}>
          <Suspense fallback={<PageFallback />}>
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/work" element={<Work />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
      <div className="grain" aria-hidden="true" />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <VideoModalProvider>
        <Shell />
      </VideoModalProvider>
    </BrowserRouter>
  )
}
