import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, X } from 'lucide-react';

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
import { useCreateStyleCombo } from '../helpers/useStyleComboCrud';
import { GeneratedItem } from '../helpers/useGenerateStyleComboLinks';

import styles from './SaveStyleComboForm.module.css';

const SEASONS = ['spring', 'summer', 'fall', 'winter'] as const;
const OCCASIONS = ['casual', 'formal', 'business', 'party', 'date', 'vacation'] as const;
const STYLES = ['minimalist', 'bohemian', 'classic', 'trendy', 'edgy', 'romantic'] as const;

const saveFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  season: z.union([z.enum(SEASONS), z.literal('_empty'), z.literal('')]).optional(),
  occasion: z.union([z.enum(OCCASIONS), z.literal('_empty'), z.literal('')]).optional(),
  style: z.union([z.enum(STYLES), z.literal('_empty'), z.literal('')]).optional(),
});

type SaveStyleComboFormProps = {
  generatedItems: GeneratedItem[];
  originalDescription: string;
  onClose: () => void;
  onSuccess: () => void;
};

function convertToEnumOrNull<T extends string>(
  value: string | undefined, 
  enumValues: readonly T[]
): T | null {
  if (value === '_empty' || value === '' || value == null) return null;
  if (enumValues.includes(value as T)) return value as T;
  return null; // Invalid values should return null instead of throwing
}

export const SaveStyleComboForm = ({
  generatedItems,
  originalDescription,
  onClose,
  onSuccess,
}: SaveStyleComboFormProps) => {
  const createStyleCombo = useCreateStyleCombo();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<z.infer<typeof saveFormSchema>>({
    resolver: zodResolver(saveFormSchema),
    defaultValues: {
      description: originalDescription,
    },
  });

  const onSubmit = (formData: z.infer<typeof saveFormSchema>) => {
    // Calculate total price
    const totalPrice = generatedItems.reduce((sum, item) => sum + item.price, 0);
    
    // Use first item's image as cover image
    const coverImageUrl = generatedItems[0]?.imageUrl;
    
    if (!coverImageUrl) {
      console.error('No items available for cover image');
      return;
    }

    // Map generated items to style combo items
    const items = generatedItems.map((item, index) => ({
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      affiliateUrl: item.affiliateUrl,
      itemOrder: index + 1,
    }));

    // Create the shop URL (using first item's affiliate URL as fallback)
    const shopUrl = generatedItems[0]?.affiliateUrl;

    const season = convertToEnumOrNull(formData.season, SEASONS);
    const occasion = convertToEnumOrNull(formData.occasion, OCCASIONS);
    const style = convertToEnumOrNull(formData.style, STYLES);

    createStyleCombo.mutate({
      title: formData.title,
      description: formData.description,
      coverImageUrl,
      shopUrl,
      totalPrice,
      season,
      occasion,
      style,
      isSponsored: false,
      items,
    }, {
      onSuccess: () => {
        onSuccess();
      },
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.formContainer}>
        <div className={styles.header}>
          <h3 className={styles.title}>Save as Style Combo</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={styles.closeButton}
          >
            <X size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.formField}>
            <label htmlFor="save-title" className={styles.label}>Title *</label>
            <Input
              id="save-title"
              placeholder="e.g., 'Summer Brunch Outfit'"
              {...register('title')}
            />
            {errors.title && <p className={styles.errorText}>{errors.title.message}</p>}
          </div>

          <div className={styles.formField}>
            <label htmlFor="save-description" className={styles.label}>Description *</label>
            <Textarea
              id="save-description"
              rows={3}
              {...register('description')}
            />
            {errors.description && <p className={styles.errorText}>{errors.description.message}</p>}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label htmlFor="save-season" className={styles.label}>Season</label>
              <Controller
                name="season"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="save-season">
                      <SelectValue placeholder="Select season" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_empty">No season</SelectItem>
                      {SEASONS.map(season => (
                        <SelectItem key={season} value={season}>
                          {season.charAt(0).toUpperCase() + season.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="save-occasion" className={styles.label}>Occasion</label>
              <Controller
                name="occasion"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="save-occasion">
                      <SelectValue placeholder="Select occasion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_empty">No occasion</SelectItem>
                      {OCCASIONS.map(occasion => (
                        <SelectItem key={occasion} value={occasion}>
                          {occasion.charAt(0).toUpperCase() + occasion.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="save-style" className={styles.label}>Style</label>
              <Controller
                name="style"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="save-style">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_empty">No style</SelectItem>
                      {STYLES.map(style => (
                        <SelectItem key={style} value={style}>
                          {style.charAt(0).toUpperCase() + style.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className={styles.summary}>
            <p className={styles.summaryText}>
              This will save {generatedItems.length} items with a total value of ${generatedItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
            </p>
          </div>

          <div className={styles.actions}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createStyleCombo.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createStyleCombo.isPending}
            >
              {createStyleCombo.isPending ? (
                <>
                  <Spinner size="sm" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Style Combo
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};