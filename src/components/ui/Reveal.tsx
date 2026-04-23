'use client'
import React, { useEffect, useRef, useState } from 'react'

type Props = {
  children: React.ReactNode
  delay?: number
  className?: string
  y?: number
  duration?: number
}

/**
 * Fade-in + translateY reveal on scroll, via IntersectionObserver.
 * Respects `prefers-reduced-motion`. Wraps children in a single <div>.
 */
export default function Reveal({
  children,
  delay = 0,
  className = '',
  y = 24,
  duration = 700,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (reduced) {
      setVisible(true)
      return
    }
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            io.unobserve(entry.target)
          }
        }
      },
      // threshold 0 + rootMargin -8% → fire as soon as any pixel crosses the
      // "92% from top" line. Works for both small cards AND long documents
      // (a threshold like 0.15 never triggers for tall elements since they'd
      // need ≥15% of their own huge height visible at once).
      { threshold: 0, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  const hidden = !visible && !reduced
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? `translate3d(0, ${y}px, 0)` : 'none',
        transition: reduced
          ? 'none'
          : `opacity ${duration}ms cubic-bezier(0.2, 0.7, 0.2, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.2, 0.7, 0.2, 1) ${delay}ms`,
        willChange: hidden ? 'opacity, transform' : 'auto',
      }}
    >
      {children}
    </div>
  )
}
