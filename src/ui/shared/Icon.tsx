import { useState } from 'react'
import type { ArtRef } from './art'
import { ART_FALLBACK } from '../../content/artManifest'

interface Props {
  art: ArtRef
  size?: number
  alt?: string
  className?: string
  /** Fallback SVG if the image fails to load (404). Defaults to the unavailable icon. */
  fallbackSrc?: string
}

/**
 * Renders an SVG asset (<img>, lazy, fixed-size to avoid layout shift) or an
 * emoji glyph. Static art is HTTP-cached and never re-parsed per card.
 */
export function Icon({ art, size = 40, alt = '', className, fallbackSrc }: Props) {
  const [errored, setErrored] = useState(false)
  const dim = { width: size, height: size }

  if ('emoji' in art) {
    return (
      <span className={className} style={{ ...dim, fontSize: size * 0.7, lineHeight: `${size}px`, textAlign: 'center', display: 'inline-block' }} aria-hidden>
        {art.emoji}
      </span>
    )
  }

  return (
    <img
      src={errored ? (fallbackSrc ?? ART_FALLBACK.unavailable) : art.src}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      alt={alt}
      className={className}
      style={dim}
      onError={() => setErrored(true)}
    />
  )
}
