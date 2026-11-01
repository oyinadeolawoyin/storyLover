import { useEffect, useRef, useState } from 'react'

// Fades and slides an element in the first time it scrolls into view.
// People whose device is set to "reduce motion" just see it, with no movement.
export default function Reveal({ children, className = '', style, delay = 0 }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let timer
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => setShown(true), delay)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [delay])

  return (
    <div
      ref={ref}
      style={style}
      className={`transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  )
}