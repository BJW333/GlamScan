import React from 'react';
import { CreateStyleComboForm } from './CreateStyleComboForm';
import { EditStyleComboForm } from './EditStyleComboForm';
import styles from './StyleComboManager.module.css';

type StyleComboManagerProps = {
  comboId?: number;
  onSuccess: () => void;
  className?: string;
};

export const StyleComboManager = ({ comboId, onSuccess, className }: StyleComboManagerProps) => {
  const isEditMode = !!comboId;

  const handleCancel = () => {
    onSuccess(); // Use the same callback for cancel as success for simplicity
  };

  if (isEditMode) {
    return (
      <div className={`${styles.wrapper} ${className || ''}`}>
        <EditStyleComboForm 
          comboId={comboId}
          onSuccess={onSuccess}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className={`${styles.wrapper} ${className || ''}`}>
      <CreateStyleComboForm 
        onSuccess={onSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};