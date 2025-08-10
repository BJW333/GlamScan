import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../helpers/useAuth";
import { User } from "../helpers/User";
import { AuthErrorPage } from "./AuthErrorPage";
import { ShieldOff } from "lucide-react";
import { AuthLoadingState } from "./AuthLoadingState";
import styles from "./ProtectedRoute.module.css";

// Do not use this in pageLayout
const MakeProtectedRoute: (roles: User["role"][]) => React.FC<{
  children: React.ReactNode;
}> =
  (roles) =>
  ({ children }) => {
    const { authState } = useAuth();
    const location = useLocation();

    // Show loading state while checking authentication
    if (authState.type === "loading") {
      return <AuthLoadingState title="Authenticating" />;
    }

    // Redirect to login if not authenticated, storing the attempted path
    if (authState.type === "unauthenticated") {
      // Store the current path for redirect after login
      const redirectPath = location.pathname + location.search;
      return (
        <Navigate 
          to={`/login?redirect=${encodeURIComponent(redirectPath)}`} 
          replace 
          state={{ from: location }}
        />
      );
    }

    if (!roles.includes(authState.user.role)) {
      return (
        <AuthErrorPage
          title="Access Denied"
          message={`Access denied. Your role (${authState.user.role}) lacks required permissions.`}
          icon={<ShieldOff className={styles.accessDeniedIcon} size={64} />}
        />
      );
    }

    // Render children if authenticated
    return <>{children}</>;
  };

// Create protected routes here, then import them in pageLayout
export const AdminRoute = MakeProtectedRoute(["admin"]);
export const UserRoute = MakeProtectedRoute(["user", "admin"]);
