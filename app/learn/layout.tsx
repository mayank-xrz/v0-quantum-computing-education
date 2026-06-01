import Link from "next/link"
import { Atom } from "lucide-react"

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Atom className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">QuantumLearn</span>
          </Link>
          <span className="text-border">·</span>
          <Link href="/learn" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Learn
          </Link>
          <div className="flex-1" />
          <Link
            href="/playground"
            className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
          >
            Open Playground
          </Link>
        </div>
      </nav>
      <main className="pt-14">{children}</main>
    </div>
  )
}
