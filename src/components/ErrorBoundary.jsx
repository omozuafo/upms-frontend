import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
          <div className="card shadow-sm border-0 p-4 text-center" style={{ maxWidth: "550px", width: "100%" }}>
            <div className="text-warning mb-3">
              <i className="bi bi-exclamation-triangle-fill fs-1"></i>
            </div>
            <h4 className="fw-bold mb-2">Display Error Detected</h4>
            <p className="text-muted small mb-3">
              An issue occurred while loading this view. You can reload or return to the dashboard.
            </p>

            {this.state.error && (
              <div className="bg-light p-3 rounded text-start mb-3 border text-danger small font-monospace overflow-auto" style={{ maxHeight: "120px" }}>
                {this.state.error.toString()}
              </div>
            )}

            <div className="d-flex justify-content-center gap-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  this.handleReset();
                  window.location.href = "/dashboard";
                }}
              >
                <i className="bi bi-house me-1"></i> Dashboard
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  this.handleReset();
                  window.location.reload();
                }}
              >
                <i className="bi bi-arrow-clockwise me-1"></i> Try Again
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
