import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="text-center max-w-md p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Algo salió mal
            </h1>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'Error desconocido'}
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
            >
              Volver al login
            </button>
            <div className="mt-8 text-left bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-64">
              <pre className="text-xs text-red-600">
                {this.state.error?.stack}
              </pre>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
