import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../hooks/useAuth';

/**
 * A component that protects routes based on user authentication and role
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if access is granted
 * @param {string[]} props.allowedRoles - Array of roles allowed to access this route
 * @returns {React.ReactNode} - The protected component or a redirect
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, userRole, loading } = useAuth();

  // Show loading state while authentication state is being determined
  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // If user doesn't have the required role, redirect to their appropriate dashboard
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Determine where to redirect based on user role
    switch (userRole) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'driver':
        return <Navigate to="/driver-dashboard" replace />;
      case 'consumer':
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  // If all checks pass, render the protected content
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string)
};

ProtectedRoute.defaultProps = {
  allowedRoles: null // If null, only authentication is checked
};

export default ProtectedRoute;