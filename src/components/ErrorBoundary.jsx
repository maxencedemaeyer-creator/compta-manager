import { Component } from 'react'

// Filet de sécurité global : si une erreur JS empêche l'affichage normal de
// l'app, on montre le message d'erreur exact au lieu d'une page blanche.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error("Erreur non gérée dans l'application :", error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-slate-50">
          <div className="max-w-md w-full text-center">
            <p className="text-lg font-semibold text-slate-900 mb-3">
              Une erreur a empêché l'affichage de la page
            </p>
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 whitespace-pre-wrap text-left">
              {this.state.error.message || String(this.state.error)}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-sm text-blue-600 underline"
            >
              Recharger la page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
