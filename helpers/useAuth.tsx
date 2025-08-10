import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSession } from "../endpoints/auth/session_GET.schema";
import { postLogout } from "../endpoints/auth/logout_POST.schema";
import { User } from "./User";

// React Query key for auth session. Make sure to optimistically update user infos using this.
export const AUTH_QUERY_KEY = ["auth", "session"] as const;

// Do not use this state in login/register UI because it's irrelevant. Only use it in UI that requires authentication.
// For pages that requires authentication only in parts of the UI (e.g. typical home page with a user avatar), the loading
// state should not apply to the full page, only to the parts that require authentication.
type AuthState =
  | {
      // Make sure to display a nice loading state UI when loading authentication state
      type: "loading";
    }
  | {
      type: "authenticated";
      user: User;
    }
  | {
      // Make sure to redirect to login or show auth error UI
      type: "unauthenticated";
      errorMessage?: string;
    };

type AuthContextType = {
  // Use this to display the correct UI based on auth state
  authState: AuthState;
  // Notify the auth provider that we have logged in
  onLogin: (user: User) => void;
  // Clear the auth state and perform the logout request
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Add this to components/_globalContextProviders but not any pageLayout files.
// Make sure it's within the QueryClientProvider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const silentRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data, error, status, fetchStatus, refetch } = useQuery<User>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      const result = await getSession();
      if ("error" in result) {
        throw new Error(result.error);
      }
      return result.user;
    },
    retry: false,
    enabled: true,
    staleTime: Infinity,
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    gcTime: Infinity,
  });

  // Silent session refresh to prevent expiry - consolidated interval management
  useEffect(() => {
    // Clear any existing interval first to prevent multiple intervals
    if (silentRefreshIntervalRef.current) {
      clearInterval(silentRefreshIntervalRef.current);
      silentRefreshIntervalRef.current = null;
    }

    // Only set up interval if user is authenticated
    if (data && status === "success") {
      // Set up silent refresh every 25 minutes (assuming 30min session expiry)
      silentRefreshIntervalRef.current = setInterval(() => {
        refetch().catch((error) => {
          console.warn("Silent session refresh failed:", error);
        });
      }, 25 * 60 * 1000); // 25 minutes
    }

    // Cleanup function - always clean up interval on dependency change or unmount
    return () => {
      if (silentRefreshIntervalRef.current) {
        clearInterval(silentRefreshIntervalRef.current);
        silentRefreshIntervalRef.current = null;
      }
    };
  }, [data, status]); 

  const authState: AuthState =
    fetchStatus === "fetching"
      ? { type: "loading" }
      : status === "error"
        ? {
            type: "unauthenticated",
            errorMessage:
              error instanceof Error ? error.message : "Session check failed",
          }
        : data
          ? { type: "authenticated", user: data }
          : { type: "unauthenticated" };

  const logout = useCallback(async () => {
    // Clear silent refresh interval on logout
    if (silentRefreshIntervalRef.current) {
      clearInterval(silentRefreshIntervalRef.current);
      silentRefreshIntervalRef.current = null;
    }
    
    // Optimistically update UI
    queryClient.setQueryData(AUTH_QUERY_KEY, null);
    // Make the actual API call
    await postLogout();
    // Invalidate the query to ensure proper state
    queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
  }, [queryClient]);

  // This should only be used for login. For user profile changes, create separate endpoints and react query hooks
  // and update the data linked to AUTH_QUERY_KEY.
  const onLogin = useCallback(
    (user: User) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, user);
    },
    [queryClient]
  );

  return (
    <AuthContext.Provider value={{ authState, logout, onLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

// Prefer using protectedRoutes instead of this hook unless the route doesn't need to be protected (e.g. login/register)
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a AuthProvider. Make sure the component is wrapped in AuthProvider or use AuthSuspense for auth-dependent content.");
  }
  return context;
};