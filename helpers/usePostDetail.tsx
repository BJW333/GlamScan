import { useQuery } from "@tanstack/react-query";
import { postDetail, InputType } from "../endpoints/post/detail_POST.schema";

export const USE_POST_DETAIL_QUERY_KEY = "postDetail";

export const usePostDetail = (postId: number | undefined) => {
  return useQuery({
    queryKey: [USE_POST_DETAIL_QUERY_KEY, postId],
    queryFn: () => {
      if (!postId) throw new Error("Post ID is required");
      return postDetail({ postId });
    },
    enabled: !!postId,
    retry: (failureCount, error: any) => {
      // Don't retry on 404 errors
      if (error?.status === 404) return false;
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
  });
};