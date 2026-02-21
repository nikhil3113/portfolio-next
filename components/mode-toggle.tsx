"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "motion/react"

import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const x = e.clientX
    const y = e.clientY
    const newTheme = resolvedTheme === "dark" ? "light" : "dark"

    // Check if the browser supports View Transitions API
    if (!(document as any).startViewTransition) {
      setTheme(newTheme)
      return
    }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    // Trigger the View Transition spread effect
    const transition = (document as any).startViewTransition(() => {
      setTheme(newTheme)
    })

    // Once the screenshot is taken and ready to animate, animate the new frame
    transition.ready.then(() => {
      document.documentElement.animate(
        [
          { clipPath: `circle(0px at ${x}px ${y}px)` },
          { clipPath: `circle(${endRadius}px at ${x}px ${y}px)` },
        ],
        {
          duration: 500,
          easing: "ease-out",
          pseudoElement: "::view-transition-new(root)",
        }
      )
    })
  }

  // To avoid hydration mismatch, render a placeholder with the exact same SSR behavior
  if (!mounted) {
    return (
      <Button variant="outline" size="icon" aria-label="Toggle theme">
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      asChild
      className="relative overflow-hidden"
    >
      <motion.button whileTap={{ scale: 0.85 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={resolvedTheme === "dark" ? "dark" : "light"}
            initial={{ y: -20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            {resolvedTheme === "dark" ? (
              <Moon className="h-[1.2rem] w-[1.2rem]" />
            ) : (
              <Sun className="h-[1.2rem] w-[1.2rem]" />
            )}
          </motion.div>
        </AnimatePresence>
        <span className="sr-only">Toggle theme</span>
      </motion.button>
    </Button>
  )
}