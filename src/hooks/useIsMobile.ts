import { useEffect, useState } from 'react'

export function useIsMobile(breakpoint = 768) {
  const getMatch = () =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false

  const [isMobile, setIsMobile] = useState(getMatch)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(getMatch())
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [breakpoint])

  return isMobile
}
