import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
          <div className="card shadow border-0 p-4 text-center" style={{ maxWidth: "500px" }}>
            <div className="text-danger mb-3">
              <i className="bi bi-exclamation-triangle-fill fs-1"></i>
            </div>
            <h4 className="fw-bold mb-2">Something went wrong</h4>
            <p className="text-muted small mb-3">
              An unexpected error occurred while displaying this page.
            </p>
            <div className="d-flex justify-content-center gap-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => (window.location.href = "/dashboard")}
              >
                Go to Dashboard
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
