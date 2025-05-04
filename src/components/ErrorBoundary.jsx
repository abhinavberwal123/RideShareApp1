// src/components/ErrorBoundary.jsx
import React from 'react';
import PropTypes from 'prop-types';
import '../styles/ErrorBoundary.css';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null,
            errorInfo: null,
            showDetails: false
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console
        console.error("Component error:", error, errorInfo);

        // Update state with error details
        this.setState({ errorInfo });

        // Report error to Firebase Analytics or other service
        if (window.gtag) {
            window.gtag('event', 'exception', {
                'description': `${error.name}: ${error.message}`,
                'fatal': true
            });
        }

        // Call onError callback if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    // Toggle showing detailed error information
    toggleDetails = () => {
        this.setState(prevState => ({
            showDetails: !prevState.showDetails
        }));
    }

    // Try to recover from the error
    retry = () => {
        this.setState({ 
            hasError: false, 
            error: null,
            errorInfo: null,
            showDetails: false
        });

        // Call onRetry callback if provided
        if (this.props.onRetry) {
            this.props.onRetry();
        }
    }

    render() {
        if (this.state.hasError) {
            const { error, errorInfo, showDetails } = this.state;
            const { fallback, showReload = true } = this.props;

            // If a custom fallback is provided, use it
            if (fallback) {
                return fallback(error, this.retry);
            }

            // Default error UI
            return (
                <div className="error-boundary">
                    <div className="error-content">
                        <h2 className="error-title">Oops! Something went wrong</h2>
                        <p className="error-message">{error?.message || 'An unexpected error occurred'}</p>

                        <div className="error-actions">
                            <button className="retry-button" onClick={this.retry}>
                                Try Again
                            </button>

                            {showReload && (
                                <button className="reload-button" onClick={() => window.location.reload()}>
                                    Reload App
                                </button>
                            )}

                            <button className="details-button" onClick={this.toggleDetails}>
                                {showDetails ? 'Hide Details' : 'Show Details'}
                            </button>
                        </div>

                        {showDetails && errorInfo && (
                            <div className="error-details">
                                <h3>Error Details:</h3>
                                <p className="error-type">{error.name}: {error.message}</p>
                                <div className="error-stack">
                                    <pre>{error.stack}</pre>
                                </div>
                                <h3>Component Stack:</h3>
                                <div className="component-stack">
                                    <pre>{errorInfo.componentStack}</pre>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

ErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired,
    fallback: PropTypes.func,
    onError: PropTypes.func,
    onRetry: PropTypes.func,
    showReload: PropTypes.bool
};

export default ErrorBoundary;
