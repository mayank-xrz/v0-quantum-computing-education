"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const TABS = [
  { label: "Builder",    href: "/playground" },
  { label: "Tutor",      href: "/playground/tutor" },
  { label: "Algorithms", href: "/playground/algorithms" },
  { label: "Puzzle",     href: "/playground/puzzle" },
]

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[oklch(0.13_0.01_265)] text-foreground flex flex-col">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          QuantumLearn
        </Link>
        <span className="text-slate-700">|</span>
        <h1 className="text-sm font-semibold text-slate-200">Playground</h1>

        {/* Tab nav */}
        <nav className="flex items-center gap-1 ml-4">
          {TABS.map((tab) => {
            const active =
              tab.href === "/playground"
                ? pathname === "/playground"
                : pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                  active
                    ? "bg-slate-700 text-slate-100"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800",
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </header>

      {/* Page content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
