import React, { useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";
import { WandSparkles, X } from "lucide-react";
import { useGenerateAiOutfit } from "../helpers/useGenerateAiOutfit";
import { InputType } from "../endpoints/ai-outfit/generate_POST.schema";
import styles from "./AiOutfitForm.module.css";

interface AiOutfitFormProps {
  onClose: () => void;
  onGenerated: (outfit: any) => void;
}

export const AiOutfitForm = React.memo(({ onClose, onGenerated }: AiOutfitFormProps) => {
  const [formData, setFormData] = useState<InputType>({
    occasion: "",
    style: "",
    budget: undefined,
    otherPreferences: "",
  });

  const generateMutation = useGenerateAiOutfit();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanedData: InputType = {
      ...(formData.occasion && { occasion: formData.occasion }),
      ...(formData.style && { style: formData.style }),
      ...(formData.budget && { budget: formData.budget }),
      ...(formData.otherPreferences && { otherPreferences: formData.otherPreferences }),
    };

    generateMutation.mutate(cleanedData, {
      onSuccess: (data) => {
        onGenerated(data.outfit);
        onClose();
      },
    });
  };

  const handleInputChange = (field: keyof InputType, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === "" ? undefined : value,
    }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <WandSparkles className={styles.icon} />
          <h2 className={styles.title}>Generate AI Outfit</h2>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon-sm"
          className={styles.closeButton}
        >
          <X size={16} />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Occasion</label>
            <Select
              value={formData.occasion || "__empty"}
              onValueChange={(value) => handleInputChange("occasion", value === "__empty" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an occasion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__empty">Any occasion</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="work">Work/Professional</SelectItem>
                <SelectItem value="date">Date Night</SelectItem>
                <SelectItem value="party">Party/Event</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="workout">Workout/Active</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Style</label>
            <Select
              value={formData.style || "__empty"}
              onValueChange={(value) => handleInputChange("style", value === "__empty" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__empty">Any style</SelectItem>
                <SelectItem value="minimalist">Minimalist</SelectItem>
                <SelectItem value="bohemian">Bohemian</SelectItem>
                <SelectItem value="classic">Classic</SelectItem>
                <SelectItem value="trendy">Trendy</SelectItem>
                <SelectItem value="edgy">Edgy</SelectItem>
                <SelectItem value="romantic">Romantic</SelectItem>
                <SelectItem value="sporty">Sporty</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Budget (USD)</label>
          <Input
            type="number"
            placeholder="e.g. 200"
            value={formData.budget || ""}
            onChange={(e) => handleInputChange("budget", e.target.value ? Number(e.target.value) : "")}
            min="1"
            step="1"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Additional Preferences</label>
          <Input
            placeholder="e.g. prefer earth tones, no dresses, comfortable shoes..."
            value={formData.otherPreferences || ""}
            onChange={(e) => handleInputChange("otherPreferences", e.target.value)}
            maxLength={500}
          />
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={generateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={generateMutation.isPending}
            className={styles.generateButton}
          >
            {generateMutation.isPending ? (
              <>Generating...</>
            ) : (
              <>
                <WandSparkles size={16} />
                Generate Outfit
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
});

AiOutfitForm.displayName = 'AiOutfitForm';