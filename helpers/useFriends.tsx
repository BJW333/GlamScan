import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFriendsList,
  FriendListFilter,
} from "../endpoints/friends/list_GET.schema";
import {
  postSendRequest,
  InputType as SendRequestInput,
} from "../endpoints/friends/send-request_POST.schema";
import {
  postRespondRequest,
  InputType as RespondRequestInput,
} from "../endpoints/friends/respond-request_POST.schema";
import {
  getSearch,
  InputType as SearchInput,
} from "../endpoints/friends/search_GET.schema";
import { toast } from "sonner";

export const friendsQueryKeys = {
  all: ["friends"] as const,
  lists: () => [...friendsQueryKeys.all, "list"] as const,
  list: (filter: FriendListFilter) =>
    [...friendsQueryKeys.lists(), { filter }] as const,
  searches: () => [...friendsQueryKeys.all, "search"] as const,
  search: (query: string) =>
    [...friendsQueryKeys.searches(), { query }] as const,
};

export const useFriendsList = (filter: FriendListFilter) => {
  return useQuery({
    queryKey: friendsQueryKeys.list(filter),
    queryFn: () => getFriendsList({ filter }),
  });
};

export type { FriendListFilter };

export const useUserSearch = (query: string) => {
  return useQuery({
    queryKey: friendsQueryKeys.search(query),
    queryFn: () => getSearch({ query }),
    enabled: query.length >= 2,
    placeholderData: (prev) => prev,
  });
};

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SendRequestInput) => postSendRequest(data),
    onSuccess: () => {
      toast.success("Friend request sent!");
      // Invalidate lists and searches to reflect the new pending status
      queryClient.invalidateQueries({ queryKey: friendsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: friendsQueryKeys.searches() });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useRespondToFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RespondRequestInput) => postRespondRequest(data),
    onSuccess: (data) => {
      const message =
        data.action === "accept"
          ? "Friend request accepted!"
          : data.action === "decline"
            ? "Friend request declined."
            : "User blocked.";
      toast.success(message);
      // Invalidate all friend-related data as relationships have changed
      queryClient.invalidateQueries({ queryKey: friendsQueryKeys.all });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};