import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import {
  postProfile,
  InputType,
  OutputType,
} from "../endpoints/user/profile_POST.schema";
import { AUTH_QUERY_KEY } from "./useAuth";
import { USER_PROFILE_QUERY_KEY } from "./useUserProfile";
import { User } from "./User";

type UseUpdateUserProfileOptions = Omit<
  UseMutationOptions<OutputType, Error, InputType>,
  "mutationFn"
>;

export const useUpdateUserProfile = (
  options?: UseUpdateUserProfileOptions
) => {
  const queryClient = useQueryClient();

  return useMutation<OutputType, Error, InputType>({
    mutationFn: (variables) => postProfile(variables),
    onSuccess: (data, variables, context) => {
      // When the mutation is successful, update the user profile query data
      // and the main auth session data to keep the UI in sync.
      const updatedUser = data.user;

      // Optimistically update the profile query
      queryClient.setQueryData(USER_PROFILE_QUERY_KEY, (oldData: User | undefined) => 
        oldData ? { ...oldData, ...updatedUser } : updatedUser
      );

      // Optimistically update the auth session query
      queryClient.setQueryData(AUTH_QUERY_KEY, (oldData: User | undefined) =>
        oldData ? { ...oldData, ...updatedUser } : updatedUser
      );
      
      // Also call the original onSuccess if provided
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};