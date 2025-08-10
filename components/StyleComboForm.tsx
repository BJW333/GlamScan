import React from 'react';
import { z } from 'zod';
import { Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, useForm } from './Form';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Switch } from './Switch';
import styles from './StyleComboForm.module.css';

type StyleComboFormProps = {
  form: any; // Generic form type
  className?: string;
};

export const StyleComboForm = ({ form, className }: StyleComboFormProps) => {
  const { values, setValues } = form;

  return (
    <Form {...form}>
      <div className={`${styles.formContainer} ${className || ''}`}>
        <FormItem name="title">
          <FormLabel>Title</FormLabel>
          <FormControl>
            <Input
              placeholder="e.g., Summer Beach Vibes"
              value={values.title}
              onChange={(e) => setValues((prev: any) => ({ ...prev, title: e.target.value }))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem name="description">
          <FormLabel>Description</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Describe the style combo. This will be used by the AI to generate items."
              value={values.description}
              onChange={(e) => setValues((prev: any) => ({ ...prev, description: e.target.value }))}
              rows={4}
            />
          </FormControl>
          <FormDescription>A good description helps the AI find better items.</FormDescription>
          <FormMessage />
        </FormItem>

        <div className={styles.grid}>
          <FormItem name="season">
            <FormLabel>Season</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., Summer"
                value={values.season}
                onChange={(e) => setValues((prev: any) => ({ ...prev, season: e.target.value }))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem name="occasion">
            <FormLabel>Occasion</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., Beach Party"
                value={values.occasion}
                onChange={(e) => setValues((prev: any) => ({ ...prev, occasion: e.target.value }))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </div>

        <FormItem name="style">
          <FormLabel>Style</FormLabel>
          <FormControl>
            <Input
              placeholder="e.g., Casual, Boho"
              value={values.style}
              onChange={(e) => setValues((prev: any) => ({ ...prev, style: e.target.value }))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem name="isSponsored">
          <div className={styles.switchContainer}>
            <FormLabel>Sponsored</FormLabel>
            <FormControl>
              <Switch
                checked={values.isSponsored}
                onCheckedChange={(checked) => setValues((prev: any) => ({ ...prev, isSponsored: checked }))}
              />
            </FormControl>
          </div>
          <FormDescription>Mark this combo as a sponsored placement.</FormDescription>
          <FormMessage />
        </FormItem>
      </div>
    </Form>
  );
};