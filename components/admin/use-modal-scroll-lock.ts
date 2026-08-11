'use client'

import { useEffect } from 'react'

/** Keeps the page behind a mobile modal completely still and restores its position. */
export function useModalScrollLock() {
  useEffect(() => {
    const scrollY = window.scrollY
    const body = document.body
    const previous = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    }

    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'

    return () => {
      body.style.overflow = previous.overflow
      body.style.position = previous.position
      body.style.top = previous.top
      body.style.width = previous.width
      window.scrollTo(0, scrollY)
    }
  }, [])
}
