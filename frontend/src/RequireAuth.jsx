import { useLocation, Navigate, Outlet } from "react-router-dom";

const RequireAuth = ({ allowedRoles }) => {
  const location = useLocation();

  // Get role and token from localStorage
  const userRole = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if the user's role is included in the allowedRoles array
  // Convert both to lowercase for case-insensitive comparison
  const isAuthorized = allowedRoles?.some(allowedRole => 
    allowedRole.toLowerCase() === userRole?.toLowerCase()
  );

  if (isAuthorized) {
    return <Outlet />;
  } else {
    // If logged in but with the wrong role, send to Unauthorized page
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }
};

export default RequireAuth;