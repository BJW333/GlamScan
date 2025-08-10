import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postGenerateAiOutfit, InputType, OutputType } from "../endpoints/ai-outfit/generate_POST.schema";
import { toast } from "sonner";

export const useGenerateAiOutfit = () => {
  const queryClient = useQueryClient();

  return useMutation<OutputType, Error, InputType>({
    mutationFn: (preferences) => postGenerateAiOutfit(preferences),
    onSuccess: (data) => {
      toast.success("Your AI-generated outfit is ready!");
      // Optionally, invalidate queries that might display this data,
      // though in this case, it's a one-off generation.
      // For example, if there was a history of generated outfits:
      // queryClient.invalidateQueries({ queryKey: ['ai-outfits', 'history'] });
    },
    onError: (error) => {
      console.error("Failed to generate AI outfit:", error);
      toast.error(error.message || "An unexpected error occurred while generating your outfit.");
    },
  });
};