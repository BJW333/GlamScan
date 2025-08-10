import { useQuery, UseQueryOptions, useQueryClient } from "@tanstack/react-query";
import { getProfile, OutputType } from "../endpoints/user/profile_GET.schema";
import { AUTH_QUERY_KEY } from "./useAuth";

// It's good practice to use a more specific query key for profile data
// that can be invalidated separately from the main auth session if needed.
export const USER_PROFILE_QUERY_KEY = ["user", "profile"] as const;

type UseUserProfileOptions = Omit<
  UseQueryOptions<OutputType, Error, OutputType>,
  "queryKey" | "queryFn"
>;

export const useUserProfile = (options?: UseUserProfileOptions) => {
  const queryClient = useQueryClient();
  
  return useQuery<OutputType, Error, OutputType>({
    queryKey: USER_PROFILE_QUERY_KEY,
    queryFn: () => getProfile(),
    // Set an initial value from the main auth query if available,
    // to avoid a loading flash for data we might already have.
    initialData: () => {
      const authData = queryClient.getQueryData(AUTH_QUERY_KEY) as OutputType | undefined;
      if (authData) {
        return {
          id: authData.id,
          email: authData.email,
          displayName: authData.displayName,
          avatarUrl: authData.avatarUrl,
        };
      }
      return undefined;
    },
    ...options,
  });
};