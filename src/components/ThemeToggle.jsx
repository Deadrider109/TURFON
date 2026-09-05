import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("sportiva-theme") === "dark"
  })

  useEffect(() => {
    const root = document.documentElement

    if (dark) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }

    localStorage.setItem("sportiva-theme", dark ? "dark" : "light")
  }, [dark])

  return (
    <button
      type="button"
      onClick={() => setDark((current) => !current)}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark}
      className={`
        relative h-12 w-[92px] shrink-0 overflow-hidden rounded-full
        border p-1
        transition-all duration-500 ease-out
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-[#B7E600]/60
        ${
          dark
            ? "border-white/10 bg-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_8px_30px_rgba(0,0,0,0.25)]"
            : "border-black/[0.08] bg-black/[0.045] shadow-[inset_0_1px_2px_rgba(0,0,0,0.08),0_6px_20px_rgba(0,0,0,0.08)]"
        }
      `}
    >
      {/* Liquid glass highlight */}
      <span className="pointer-events-none absolute inset-x-2 top-1 h-3 rounded-full bg-white/30 blur-[5px] dark:bg-white/10" />

      {/* Track glow */}
      <span
        className={`
          pointer-events-none absolute inset-0 rounded-full
          transition-opacity duration-500
          ${
            dark
              ? "bg-[#B7E600]/10 opacity-100"
              : "bg-white opacity-0"
          }
        `}
      />

      {/* Sliding glass orb */}
      <span
        className={`
          absolute top-1 flex h-10 w-10 items-center justify-center
          rounded-full
          transition-all duration-500
          ease-[cubic-bezier(0.22,1,0.36,1)]
          ${
            dark
              ? "left-[47px] bg-[#123B27] shadow-[0_5px_20px_rgba(183,230,0,0.22),inset_0_1px_1px_rgba(255,255,255,0.2)]"
              : "left-1 bg-white shadow-[0_5px_18px_rgba(0,0,0,0.18),inset_0_1px_1px_rgba(255,255,255,0.9)]"
          }
        `}
      >
        <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent" />

        {dark ? (
          <Moon
            size={19}
            strokeWidth={2.2}
            className="relative z-10 text-[#B7E600]"
          />
        ) : (
          <Sun
            size={19}
            strokeWidth={2.2}
            className="relative z-10 text-[#123B27]"
          />
        )}
      </span>
    </button>
  )
}

export default ThemeToggle