import { useCallback, useState } from 'react'
import './SmartImage.css'

/**
 * Responsive image with WebP first, JPEG fallback, a blurred placeholder,
 * and a fade in once the real file has decoded.
 *
 * The fade is released on error as well as on load, so a file that fails to
 * arrive shows its alt text rather than staying invisible forever.
 */
export default function SmartImage({
  jpg,
  webp,
  webpWidth,
  small,
  smallWidth,
  lqip,
  alt,
  width,
  height,
  focal = '50% 50%',
  sizes = '100vw',
  priority = false,
  className = '',
}) {
  const [loaded, setLoaded] = useState(false)

  const reveal = useCallback(() => setLoaded(true), [])

  // An image restored from cache can already be complete before React attaches
  // the load handler, so check on mount too.
  const attach = useCallback(
    (node) => {
      if (node && node.complete) setLoaded(true)
    },
    [],
  )

  const srcSet = [
    small && smallWidth ? `${small} ${smallWidth}w` : null,
    webp && webpWidth ? `${webp} ${webpWidth}w` : null,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <span
      className={`smart-image ${loaded ? 'is-loaded' : ''} ${className}`}
      style={lqip ? { backgroundImage: `url("${lqip}")` } : undefined}
    >
      <picture>
        {srcSet ? <source type="image/webp" srcSet={srcSet} sizes={sizes} /> : null}
        <img
          ref={attach}
          src={jpg}
          alt={alt}
          width={width || undefined}
          height={height || undefined}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          style={{ objectPosition: focal }}
          onLoad={reveal}
          onError={reveal}
          draggable="false"
        />
      </picture>
    </span>
  )
}
