import { useState, useEffect } from "react"

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
}

export function useBreakpoint() {
  const [windowWidth, setWindowWidth] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerWidth : 0
  )

  const isSm = windowWidth >= breakpoints.sm
  const isMd = windowWidth >= breakpoints.md
  const isLg = windowWidth >= breakpoints.lg
  const isXl = windowWidth >= breakpoints.xl
  const is2Xl = windowWidth >= breakpoints["2xl"]

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return {
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    windowWidth,
  }
}
