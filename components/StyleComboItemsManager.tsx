import React from 'react';
import { z } from 'zod';
import { Form, FormItem, FormLabel, FormControl, FormMessage, useForm } from './Form';
import { Input } from './Input';
import { Button } from './Button';
import { Skeleton } from './Skeleton';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import styles from './StyleComboItemsManager.module.css';

type StyleComboItemsManagerProps = {
  form: any; // Generic form type
  isGenerating: boolean;
  className?: string;
};

const ItemsSkeleton = () => (
  <div className={styles.skeletonContainer}>
    {[...Array(3)].map((_, i) => (
      <div key={i} className={styles.itemCard}>
        <Skeleton style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)' }} />
        <div className={styles.itemDetails}>
          <Skeleton style={{ height: '1.25rem', width: '80%' }} />
          <Skeleton style={{ height: '1rem', width: '40%' }} />
        </div>
      </div>
    ))}
  </div>
);

export const StyleComboItemsManager = ({ form, isGenerating, className }: StyleComboItemsManagerProps) => {
  const { values, setValues, validateField } = form;

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...values.items];
    const newPrice = field === 'price' ? Number(value) : newItems[index][field];
    newItems[index] = { ...newItems[index], [field]: field === 'price' ? newPrice : value };
    setValues((prev: any) => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    const newItems = [...values.items, { name: '', price: 0, imageUrl: '', affiliateUrl: '' }];
    setValues((prev: any) => ({ ...prev, items: newItems }));
  };

  const removeItem = (index: number) => {
    const newItems = values.items.filter((_: any, i: number) => i !== index);
    setValues((prev: any) => ({ ...prev, items: newItems }));
    validateField('items', { shallow: true });
  };

  if (isGenerating) {
    return <ItemsSkeleton />;
  }

  return (
    <Form {...form}>
      <div className={`${styles.container} ${className || ''}`}>
        <FormItem name="items">
          {values.items.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No items yet. Add one manually or use the AI generator.</p>
            </div>
          ) : (
            <div className={styles.itemsList}>
              {values.items.map((item: any, index: number) => (
                <FormItem key={index} name={`items.${index}`} className={styles.itemCard}>
                  <GripVertical className={styles.dragHandle} size={20} />
                  <img src={item.imageUrl || 'https://via.placeholder.com/80'} alt={item.name} className={styles.itemImage} />
                  <div className={styles.itemInputs}>
                    <FormItem name={`items.${index}.name`}>
                      <FormControl>
                        <Input placeholder="Item Name" value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    <div className={styles.grid}>
                      <FormItem name={`items.${index}.price`}>
                        <FormControl>
                          <Input type="number" placeholder="Price" value={item.price} onChange={e => handleItemChange(index, 'price', e.target.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                      <FormItem name={`items.${index}.imageUrl`}>
                        <FormControl>
                          <Input placeholder="Image URL" value={item.imageUrl} onChange={e => handleItemChange(index, 'imageUrl', e.target.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </div>
                    <FormItem name={`items.${index}.affiliateUrl`}>
                      <FormControl>
                        <Input placeholder="Affiliate URL" value={item.affiliateUrl} onChange={e => handleItemChange(index, 'affiliateUrl', e.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} className={styles.deleteButton}>
                    <Trash2 size={16} />
                  </Button>
                </FormItem>
              ))}
            </div>
          )}
          <FormMessage />
        </FormItem>
        <Button type="button" variant="outline" onClick={addItem} className={styles.addButton}>
          <Plus size={16} /> Add Item Manually
        </Button>
      </div>
    </Form>
  );
};