import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../styles/LoadingIndicator.css';

const LoadingIndicator = ({ 
  isLoading, 
  text = 'Loading...', 
  size = 'medium', 
  overlay = false,
  delay = 300, // Delay before showing the loader (ms)
  timeout = 0, // Timeout for showing error (0 = no timeout)
  onTimeout = null
}) => {
  const [showLoader, setShowLoader] = useState(false);
  const [showError, setShowError] = useState(false);
  
  // Delay showing the loader to prevent flashing for quick operations
  useEffect(() => {
    let delayTimer;
    let timeoutTimer;
    
    if (isLoading) {
      delayTimer = setTimeout(() => {
        setShowLoader(true);
        setShowError(false);
        
        // Set timeout for showing error if provided
        if (timeout > 0) {
          timeoutTimer = setTimeout(() => {
            setShowError(true);
            if (onTimeout) onTimeout();
          }, timeout);
        }
      }, delay);
    } else {
      setShowLoader(false);
      setShowError(false);
    }
    
    return () => {
      clearTimeout(delayTimer);
      clearTimeout(timeoutTimer);
    };
  }, [isLoading, delay, timeout, onTimeout]);
  
  if (!isLoading && !showLoader) return null;
  
  const loaderContent = (
    <div className={`loading-indicator ${size}`}>
      <div className="spinner"></div>
      {text && <div className="loading-text">{text}</div>}
      
      {showError && (
        <div className="loading-error">
          <p>This is taking longer than expected.</p>
          <button className="retry-button" onClick={() => {
            setShowError(false);
            if (onTimeout) onTimeout(true); // Pass true to indicate retry
          }}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
  
  if (overlay) {
    return (
      <div className="loading-overlay">
        {loaderContent}
      </div>
    );
  }
  
  return loaderContent;
};

LoadingIndicator.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  text: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  overlay: PropTypes.bool,
  delay: PropTypes.number,
  timeout: PropTypes.number,
  onTimeout: PropTypes.func
};

export default LoadingIndicator;