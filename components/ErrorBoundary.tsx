"use client"

import React from "react"
import { RefreshCw } from "lucide-react"

interface Props {
  children: React.ReactNode
  /** Optional label for the reset button / heading */
  label?: string
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm font-semibold text-red-400">
            {this.props.label ?? "Component"} encountered an error
          </p>
          <p className="text-xs text-slate-500 font-mono max-w-xs break-all">
            {this.state.error.message}
          </p>
          <button
            onClick={this.reset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-slate-100 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
