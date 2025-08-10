import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { WandSparkles, ShoppingCart, ExternalLink } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './Dialog';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './Select';
import { Spinner } from './Spinner';
import { Skeleton } from './Skeleton';
import { useGenerateAiOutfit } from '../helpers/useGenerateAiOutfit';
import { schema as generateAiOutfitSchema, AiOutfitItemSchema } from '../endpoints/ai-outfit/generate_POST.schema';

import styles from './StyleComboGenerator.module.css';

const STYLES = ['Casual', 'Formal', 'Streetwear', 'Bohemian', 'Vintage', 'Sporty', 'Minimalist', 'Business', 'Evening', 'Smart Casual'];

type StyleComboGeneratorProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
};

type GeneratedAiOutfitItem = z.infer<typeof AiOutfitItemSchema>;

const GeneratedItemCard = ({ item }: { item: GeneratedAiOutfitItem }) => (
  <div className={styles.itemCard}>
    <img src={item.imageUrl} alt={item.name} className={styles.itemImage} />
    <div className={styles.itemDetails}>
      <p className={styles.itemCategory}>{item.category}</p>
      <h4 className={styles.itemName}>{item.name}</h4>
      <p className={styles.itemDescription}>{item.description}</p>
      <p className={styles.itemPrice}>${item.price.toFixed(2)}</p>
      <a
        href={item.affiliateUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.buyButtonLink}
      >
        <Button size="sm" variant="secondary" className={styles.buyButton}>
          <ShoppingCart size={14} />
          <span>Buy on Amazon</span>
          <ExternalLink size={14} />
        </Button>
      </a>
    </div>
  </div>
);

const GeneratedItemsSkeleton = () => (
  <div className={styles.resultsGrid}>
    {[...Array(4)].map((_, i) => (
      <div key={i} className={styles.itemCard}>
        <Skeleton className={styles.itemImageSkeleton} />
        <div className={styles.itemDetails}>
          <Skeleton style={{ height: '0.875rem', width: '60%', marginBottom: 'var(--spacing-1)' }} />
          <Skeleton style={{ height: '1.25rem', width: '90%', marginBottom: 'var(--spacing-2)' }} />
          <Skeleton style={{ height: '0.875rem', width: '100%', marginBottom: 'var(--spacing-2)' }} />
          <Skeleton style={{ height: '1rem', width: '40%', marginBottom: 'var(--spacing-4)' }} />
          <Skeleton style={{ height: '1.5rem', width: '100%' }} />
        </div>
      </div>
    ))}
  </div>
);

export const StyleComboGenerator = ({
  isOpen,
  onOpenChange,
  className,
}: StyleComboGeneratorProps) => {
  const {
    mutate: generateOutfit,
    data: generatedOutfit,
    isPending,
    isError,
    error,
  } = useGenerateAiOutfit();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<z.infer<typeof generateAiOutfitSchema>>({
    resolver: zodResolver(generateAiOutfitSchema),
  });

  const onSubmit = (formData: z.infer<typeof generateAiOutfitSchema>) => {
    console.log('Submitting AI outfit generation request:', formData);
    generateOutfit(formData);
  };

  const totalPrice = generatedOutfit?.outfit?.reduce((sum, item) => sum + item.price, 0) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={`${styles.dialogContent} ${className || ''}`}>
        <DialogHeader>
          <DialogTitle>AI Fashion Assistant</DialogTitle>
          <DialogDescription>
            Tell our AI about the occasion and your style preferences, and get a personalized outfit with real Amazon products you can buy instantly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label htmlFor="occasion" className={styles.label}>Occasion</label>
              <Input
                id="occasion"
                placeholder="e.g., 'date night', 'job interview', 'weekend brunch'"
                {...register('occasion')}
              />
              {errors.occasion && <p className={styles.errorText}>{errors.occasion.message}</p>}
            </div>
            
            <div className={styles.formField}>
              <label htmlFor="style" className={styles.label}>Style</label>
              <Controller
                name="style"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="style">
                      <SelectValue placeholder="Select your preferred style" />
                    </SelectTrigger>
                    <SelectContent>
                      {STYLES.map(style => (
                        <SelectItem key={style} value={style.toLowerCase()}>{style}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.style && <p className={styles.errorText}>{errors.style.message}</p>}
            </div>

            <div className={styles.formField}>
              <label htmlFor="budget" className={styles.label}>Budget (USD)</label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g., 150"
                {...register('budget', { valueAsNumber: true })}
              />
              {errors.budget && <p className={styles.errorText}>{errors.budget.message}</p>}
            </div>

            <div className={styles.formField}>
              <label htmlFor="otherPreferences" className={styles.label}>Other Preferences</label>
              <Textarea
                id="otherPreferences"
                placeholder="e.g., 'I love earthy tones and comfortable fabrics', 'no high heels', 'vintage accessories'"
                rows={3}
                {...register('otherPreferences')}
              />
              {errors.otherPreferences && <p className={styles.errorText}>{errors.otherPreferences.message}</p>}
            </div>
          </div>
          
          <Button type="submit" disabled={isPending} className={styles.generateButton}>
            {isPending ? (
              <>
                <Spinner size="sm" />
                Creating Your Outfit...
              </>
            ) : (
              <>
                <WandSparkles size={16} />
                Generate AI Outfit
              </>
            )}
          </Button>
        </form>

        <div className={styles.resultsContainer}>
          <div className={styles.resultsHeader}>
            <h3 className={styles.resultsTitle}>Your AI-Generated Outfit</h3>
            {generatedOutfit?.outfit && (
              <p className={styles.totalPrice}>Total: ${totalPrice.toFixed(2)}</p>
            )}
          </div>
          
          <div className={styles.resultsContent}>
            {isPending && <GeneratedItemsSkeleton />}
            {isError && (
              <div className={styles.errorState}>
                <p>Oops! Something went wrong.</p>
                <p className={styles.errorMessageDetail}>
                  {error instanceof Error ? error.message : 'An unknown error occurred while generating your outfit.'}
                </p>
              </div>
            )}
            {!isPending && !isError && generatedOutfit?.outfit && (
              <div className={styles.resultsGrid}>
                {generatedOutfit.outfit.map((item, index) => (
                  <GeneratedItemCard key={`${item.name}-${index}`} item={item} />
                ))}
              </div>
            )}
            {!isPending && !isError && !generatedOutfit?.outfit && (
              <div className={styles.placeholderState}>
                <WandSparkles size={32} style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-3)' }} />
                <p>Your personalized outfit with real Amazon products will appear here.</p>
                <p className={styles.placeholderSubtext}>Fill out the form above and click "Generate AI Outfit" to get started!</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};