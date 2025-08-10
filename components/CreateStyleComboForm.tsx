import React from 'react';
import { useForm, Form, FormItem, FormLabel, FormControl, FormMessage } from './Form';
import { useCreateStyleCombo } from '../helpers/useStyleComboCrud';
import { useGenerateStyleComboLinks } from '../helpers/useGenerateStyleComboLinks';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './Select';
import { Checkbox } from './Checkbox';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { CreateStyleComboSchema, CreateStyleComboInput } from '../helpers/styleComboSchema';
import styles from './CreateStyleComboForm.module.css';

type CreateStyleComboFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
};

export const CreateStyleComboForm = ({ onSuccess, onCancel }: CreateStyleComboFormProps) => {
  const createMutation = useCreateStyleCombo();
  const generateLinksMutation = useGenerateStyleComboLinks();

  const form = useForm({
    schema: CreateStyleComboSchema,
    defaultValues: {
      title: '',
      description: null,
      season: null,
      occasion: null,
      style: null,
      coverImageUrl: '',
      shopUrl: '',
      isSponsored: false,
      totalPrice: 0,
      items: [],
    } satisfies CreateStyleComboInput,
  });

  const onSubmit = (data: CreateStyleComboInput) => {
    if (!form.validateForm()) {
      return;
    }
    
    createMutation.mutate(data, {
      onSuccess: () => {
        onSuccess();
      },
    });
  };

  const handleGenerateLinks = async () => {
    const { title, description, season, style } = form.values;
    if (!description) {
      form.setFieldError('description', 'A description is required to generate items with AI.');
      return;
    }
    
    generateLinksMutation.mutate(
      { 
        title, 
        description: description ?? undefined, 
        season: season ?? undefined, 
        style: style ?? undefined 
      },
      {
        onSuccess: (generatedItems) => {
          const mappedItems = generatedItems.map((item, index) => ({
            ...item,
            id: undefined,
            itemOrder: index + 1
          }));
          
          form.setValues((prev) => ({
            ...prev,
            items: mappedItems
          }));
        },
      }
    );
  };

  const addItem = () => {
    form.setValues((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: undefined,
          name: '',
          price: 0,
          imageUrl: '',
          affiliateUrl: '',
          itemOrder: prev.items.length + 1
        }
      ]
    }));
  };

  const removeItem = (index: number) => {
    form.setValues((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: keyof CreateStyleComboInput['items'][0], value: any) => {
    form.setValues((prev) => {
      const updatedItems = [...prev.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      return { ...prev, items: updatedItems };
    });
  };

  const isSubmitting = createMutation.isPending;
  const isGenerating = generateLinksMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={styles.container}>
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Create Style Combo</h2>
          
          <FormItem name="title">
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input
                value={form.values.title}
                onChange={(e) => form.setValues(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem name="description">
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                value={form.values.description || ''}
                onChange={(e) => form.setValues(prev => ({ ...prev, description: e.target.value || null }))}
                placeholder="Describe this style combo..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
            <FormItem name="season">
              <FormLabel>Season</FormLabel>
              <FormControl>
                <Select
                  value={form.values.season || '__empty'}
                  onValueChange={(value) => form.setValues(prev => ({ 
                    ...prev, 
                    season: value === '__empty' ? null : value as CreateStyleComboInput['season']
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select season..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty">Select season...</SelectItem>
                    <SelectItem value="spring">Spring</SelectItem>
                    <SelectItem value="summer">Summer</SelectItem>
                    <SelectItem value="fall">Fall</SelectItem>
                    <SelectItem value="winter">Winter</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="occasion">
              <FormLabel>Occasion</FormLabel>
              <FormControl>
                <Select
                  value={form.values.occasion || '__empty'}
                  onValueChange={(value) => form.setValues(prev => ({ 
                    ...prev, 
                    occasion: value === '__empty' ? null : value as CreateStyleComboInput['occasion']
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select occasion..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty">Select occasion...</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="party">Party</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="vacation">Vacation</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
            <FormItem name="style">
              <FormLabel>Style</FormLabel>
              <FormControl>
                <Select
                  value={form.values.style || '__empty'}
                  onValueChange={(value) => form.setValues(prev => ({ 
                    ...prev, 
                    style: value === '__empty' ? null : value as CreateStyleComboInput['style']
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select style..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty">Select style...</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                    <SelectItem value="bohemian">Bohemian</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="trendy">Trendy</SelectItem>
                    <SelectItem value="edgy">Edgy</SelectItem>
                    <SelectItem value="romantic">Romantic</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="totalPrice">
              <FormLabel>Total Price</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  value={form.values.totalPrice}
                  onChange={(e) => form.setValues(prev => ({ ...prev, totalPrice: Number(e.target.value) }))}
                  min={0}
                  step={0.01}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </div>

          <FormItem name="coverImageUrl">
            <FormLabel>Cover Image URL</FormLabel>
            <FormControl>
              <Input
                value={form.values.coverImageUrl}
                onChange={(e) => form.setValues(prev => ({ ...prev, coverImageUrl: e.target.value }))}
                required
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem name="shopUrl">
            <FormLabel>Shop URL</FormLabel>
            <FormControl>
              <Input
                value={form.values.shopUrl}
                onChange={(e) => form.setValues(prev => ({ ...prev, shopUrl: e.target.value }))}
                required
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem name="isSponsored">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <FormControl>
                <Checkbox
                  checked={form.values.isSponsored}
                  onChange={(e) => form.setValues(prev => ({ ...prev, isSponsored: e.target.checked }))}
                />
              </FormControl>
              <FormLabel>Sponsored Content</FormLabel>
            </div>
            <FormMessage />
          </FormItem>
        </div>

        <div className={styles.itemsSection}>
          <div className={styles.itemsHeader}>
            <h3 className={styles.sectionTitle}>Items</h3>
            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateLinks}
                disabled={isGenerating}
              >
                <Sparkles />
                {isGenerating ? 'Generating...' : 'Generate with AI'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
              >
                <Plus />
                Add Item
              </Button>
            </div>
          </div>

          <FormItem name="items">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              {form.values.items.map((item, index) => (
                <FormItem key={index} name={`items.${index}`}>
                  <div
                    style={{
                      padding: 'var(--spacing-4)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      backgroundColor: 'var(--surface)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>
                        Item {index + 1}
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 />
                      </Button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                      <FormItem name={`items.${index}.name`}>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            value={item.name}
                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>

                      <FormItem name={`items.${index}.price`}>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={item.price}
                            onChange={(e) => updateItem(index, 'price', Number(e.target.value))}
                            min={0}
                            step={0.01}
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>

                      <FormItem name={`items.${index}.imageUrl`}>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input
                            value={item.imageUrl}
                            onChange={(e) => updateItem(index, 'imageUrl', e.target.value)}
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>

                      <FormItem name={`items.${index}.affiliateUrl`}>
                        <FormLabel>Affiliate URL</FormLabel>
                        <FormControl>
                          <Input
                            value={item.affiliateUrl}
                            onChange={(e) => updateItem(index, 'affiliateUrl', e.target.value)}
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              ))}

              {form.values.items.length === 0 && (
                <div
                  style={{
                    padding: 'var(--spacing-8)',
                    textAlign: 'center',
                    color: 'var(--muted-foreground)',
                    border: '2px dashed var(--border)',
                    borderRadius: 'var(--radius)',
                  }}
                >
                  <p style={{ margin: 0 }}>
                    No items added yet. Use "Generate with AI" or "Add Item" to get started.
                  </p>
                </div>
              )}
            </div>
            <FormMessage />
          </FormItem>
        </div>

        <div className={styles.footer}>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Style Combo'}
          </Button>
        </div>
      </form>
    </Form>
  );
};