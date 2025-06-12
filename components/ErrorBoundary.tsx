"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-900 rounded-lg shadow-xl p-6 space-y-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
            </div>
            
            <p className="text-gray-400">
              The visualization encountered an unexpected error. This might be due to a temporary issue or incompatible browser settings.
            </p>

            {/* Error details for development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-400">
                  Error details
                </summary>
                <div className="mt-2 p-3 bg-gray-800 rounded text-xs text-gray-300 overflow-auto">
                  <p className="font-semibold">{this.state.error.toString()}</p>
                  {this.state.errorInfo && (
                    <pre className="mt-2 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="flex-1"
              >
                Reload Page
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex-1"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>

            <div className="text-sm text-gray-500">
              <p>Troubleshooting tips:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Try refreshing the page</li>
                <li>Clear your browser cache</li>
                <li>Ensure WebGL is enabled in your browser</li>
                <li>Try a different browser (Chrome, Firefox, Safari)</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for using error boundary in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  const resetError = () => setError(null)
  const captureError = (error: Error) => setError(error)

    return { resetError, captureError }
} 