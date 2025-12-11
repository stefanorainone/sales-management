import { useState } from 'react';
import { type Relationship } from '@/lib/hooks/useRelationships';

export function useRelationshipForm(initialData?: Partial<Relationship>) {
  const [formData, setFormData] = useState<Partial<Relationship>>(
    initialData || {
      strength: 'developing',
      importance: 'medium',
      category: 'decision_maker',
      valueBalance: 'balanced',
      cities: [''],
      whatICanGive: [''],
      whatICanReceive: [''],
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof Relationship, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateGive = (index: number, value: string) => {
    const newItems = [...(formData.whatICanGive || [''])];
    newItems[index] = value;
    setFormData((prev) => ({ ...prev, whatICanGive: newItems }));
  };

  const addGive = () => {
    setFormData((prev) => ({
      ...prev,
      whatICanGive: [...(prev.whatICanGive || ['']), ''],
    }));
  };

  const removeGive = (index: number) => {
    const newItems = (formData.whatICanGive || ['']).filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      whatICanGive: newItems.length > 0 ? newItems : [''],
    }));
  };

  const updateReceive = (index: number, value: string) => {
    const newItems = [...(formData.whatICanReceive || [''])];
    newItems[index] = value;
    setFormData((prev) => ({ ...prev, whatICanReceive: newItems }));
  };

  const addReceive = () => {
    setFormData((prev) => ({
      ...prev,
      whatICanReceive: [...(prev.whatICanReceive || ['']), ''],
    }));
  };

  const removeReceive = (index: number) => {
    const newItems = (formData.whatICanReceive || ['']).filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      whatICanReceive: newItems.length > 0 ? newItems : [''],
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Il nome è obbligatorio';
    }
    if (!formData.company?.trim()) {
      newErrors.company = "L'azienda è obbligatoria";
    }
    if (!formData.role?.trim()) {
      newErrors.role = 'Il ruolo è obbligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const reset = () => {
    setFormData(
      initialData || {
        strength: 'developing',
        importance: 'medium',
        category: 'decision_maker',
        valueBalance: 'balanced',
        cities: [''],
        whatICanGive: [''],
        whatICanReceive: [''],
      }
    );
    setErrors({});
  };

  return {
    formData,
    errors,
    updateField,
    updateGive,
    addGive,
    removeGive,
    updateReceive,
    addReceive,
    removeReceive,
    validate,
    reset,
    setFormData,
  };
}
