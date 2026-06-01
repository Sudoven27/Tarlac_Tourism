import React from 'react';
import { FiRefreshCw, FiHome } from 'react-icons/fi';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50 p-6">
        <div className="card max-w-md w-full text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="font-display text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-500 text-sm mb-2">An unexpected error occurred in this section.</p>
          {this.state.error && (
            <pre className="text-left bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-red-600 mb-6 overflow-x-auto whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="btn-outline"
            >
              <FiRefreshCw /> Try Again
            </button>
            <button
              onClick={() => { window.location.href = '/dashboard'; }}
              className="btn-primary"
            >
              <FiHome /> Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}
