import { useState, useCallback } from 'react';

interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

interface ProcessImageResult {
  base64: string;
  originalSize: number;
  processedSize: number;
  width: number;
  height: number;
}

const DEFAULT_OPTIONS: Required<ImageProcessingOptions> = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.8,
  format: 'jpeg',
};

export const useImageProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processImage = useCallback(
    (file: File, options: ImageProcessingOptions = {}): Promise<ProcessImageResult> => {
      return new Promise((resolve, reject) => {
        setIsProcessing(true);

        const opts = { ...DEFAULT_OPTIONS, ...options };
        const reader = new FileReader();

        reader.onload = (e) => {
          const img = new Image();
          
          img.onload = () => {
            try {
              // Calculate new dimensions while maintaining aspect ratio
              let { width, height } = img;
              const aspectRatio = width / height;

              if (width > opts.maxWidth) {
                width = opts.maxWidth;
                height = width / aspectRatio;
              }

              if (height > opts.maxHeight) {
                height = opts.maxHeight;
                width = height * aspectRatio;
              }

              // Create canvas for resizing
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              if (!ctx) {
                throw new Error('Could not get canvas context');
              }

              canvas.width = width;
              canvas.height = height;

              // Use better image smoothing
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';

              // Draw and resize image
              ctx.drawImage(img, 0, 0, width, height);

              // Convert to base64
              const mimeType = `image/${opts.format}`;
              const dataUrl = canvas.toDataURL(mimeType, opts.quality);
              const base64 = dataUrl.split(',')[1];

              // Calculate sizes for comparison
              const originalSize = file.size;
              const processedSize = Math.round((base64.length * 3) / 4); // Approximate base64 to bytes

              setIsProcessing(false);
              resolve({
                base64,
                originalSize,
                processedSize,
                width: Math.round(width),
                height: Math.round(height),
              });
            } catch (error) {
              setIsProcessing(false);
              reject(error);
            }
          };

          img.onerror = () => {
            setIsProcessing(false);
            reject(new Error('Failed to load image'));
          };

          img.src = e.target?.result as string;
        };

        reader.onerror = () => {
          setIsProcessing(false);
          reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
      });
    },
    []
  );

  return {
    processImage,
    isProcessing,
  };
};