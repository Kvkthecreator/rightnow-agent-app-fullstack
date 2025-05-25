import React, { Component, ErrorInfo, ReactNode } from 'react';
import Fallback from './renderers/Fallback'; // Adjust path as needed

interface Props {
  children: ReactNode;
  data: any; // Data to pass to Fallback in case of error
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error in component:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      // Pass the original data and the caught error to Fallback
      return <Fallback data={this.props.data} error={this.state.error} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
