import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[oklch(0.13_0.01_265)] flex flex-col items-center justify-center gap-6 text-center px-4">
      <p className="text-6xl font-bold text-slate-700">404</p>
      <h1 className="text-xl font-semibold text-slate-300">Page not found</h1>
      <p className="text-sm text-slate-500 max-w-xs">
        This state vector has collapsed. The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-300 hover:text-slate-100 transition-colors"
        >
          Go home
        </Link>
        <Link
          href="/playground"
          className="px-4 py-2 rounded-lg bg-cyan-900/40 border border-cyan-700/50 text-sm text-cyan-300 hover:text-cyan-100 transition-colors"
        >
          Open Playground
        </Link>
      </div>
    </div>
  )
}
