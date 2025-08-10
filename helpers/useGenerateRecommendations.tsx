import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import {
  postGenerate,
  InputType,
  OutputType,
} from "../endpoints/recommendations/generate_POST.schema";

type UseGenerateRecommendationsOptions = Omit<
  UseMutationOptions<OutputType, Error, InputType>,
  "mutationFn"
>;

export const useGenerateRecommendations = (
  options?: UseGenerateRecommendationsOptions
) => {
  return useMutation<OutputType, Error, InputType>({
    mutationFn: (variables) => postGenerate(variables),
    ...options,
  });
};