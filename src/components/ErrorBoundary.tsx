import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Optional: Send to error tracking service in production
    // if (import.meta.env.PROD) {
    //   sendErrorToService(error, errorInfo);
    // }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 echo-dots">
          <div className="max-w-md w-full space-y-6 text-center">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto" />
            <div className="space-y-2">
              <h1 className="text-3xl font-display font-bold">Something went wrong</h1>
              <p className="text-muted-foreground">
                We encountered an unexpected error. Don't worry, your progress is safe.
              </p>
              {this.state.error && (
                <details className="text-xs text-left bg-muted p-3 rounded mt-4">
                  <summary className="cursor-pointer font-mono">Error details</summary>
                  <pre className="mt-2 overflow-auto">{this.state.error.message}</pre>
                  {this.state.error.stack && (
                    <pre className="mt-2 overflow-auto text-[10px]">{this.state.error.stack}</pre>
                  )}
                </details>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleReset} size="lg">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                size="lg"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
