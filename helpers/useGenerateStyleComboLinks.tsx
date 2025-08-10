import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

// Mock generated item type matching the expected form item structure
export type GeneratedItem = {
  name: string;
  price: number;
  imageUrl: string;
  affiliateUrl: string;
};

type GenerateLinksInput = {
  title: string;
  description?: string;
  season?: string;
  style?: string;
};

// Mock implementation - replace with actual API call when available
const mockGenerateLinks = async (input: GenerateLinksInput): Promise<GeneratedItem[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock generated items based on input
  const mockItems: GeneratedItem[] = [
    {
      name: `${input.style || 'Stylish'} Top for ${input.title}`,
      price: Math.floor(Math.random() * 100) + 20,
      imageUrl: 'https://via.placeholder.com/300x300?text=Top',
      affiliateUrl: 'https://example.com/top-affiliate-link'
    },
    {
      name: `${input.season || 'Seasonal'} Bottom for ${input.title}`,
      price: Math.floor(Math.random() * 150) + 30,
      imageUrl: 'https://via.placeholder.com/300x300?text=Bottom',
      affiliateUrl: 'https://example.com/bottom-affiliate-link'
    },
    {
      name: `Accessory for ${input.title}`,
      price: Math.floor(Math.random() * 50) + 10,
      imageUrl: 'https://via.placeholder.com/300x300?text=Accessory',
      affiliateUrl: 'https://example.com/accessory-affiliate-link'
    }
  ];

  return mockItems;
};

export const useGenerateStyleComboLinks = () => {
  return useMutation<GeneratedItem[], Error, GenerateLinksInput>({
    mutationFn: mockGenerateLinks,
    onSuccess: () => {
      toast.success("AI-generated items added successfully!");
    },
    onError: (error) => {
      console.error("Failed to generate style combo links:", error);
      toast.error(error.message || "Failed to generate items with AI.");
    },
  });
};