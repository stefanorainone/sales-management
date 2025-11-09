import { useState } from 'react';
import { Relationship } from '@/lib/types';

export function useRelationshipForm(initialData?: Partial<Relationship>) {
  const [formData, setFormData] = useState<Partial<Relationship>>(
    initialData || {
      strength: 'developing',
      importance: 'medium',
      category: 'decision_maker',
      valueBalance: 'balanced',
      mutualBenefits: [''],
      notes: [],
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

  const updateBenefit = (index: number, value: string) => {
    const newBenefits = [...(formData.mutualBenefits || [''])];
    newBenefits[index] = value;
    setFormData((prev) => ({ ...prev, mutualBenefits: newBenefits }));
  };

  const addBenefit = () => {
    setFormData((prev) => ({
      ...prev,
      mutualBenefits: [...(prev.mutualBenefits || ['']), ''],
    }));
  };

  const removeBenefit = (index: number) => {
    const newBenefits = (formData.mutualBenefits || ['']).filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      mutualBenefits: newBenefits.length > 0 ? newBenefits : [''],
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
        mutualBenefits: [''],
        notes: [],
      }
    );
    setErrors({});
  };

  return {
    formData,
    errors,
    updateField,
    updateBenefit,
    addBenefit,
    removeBenefit,
    validate,
    reset,
    setFormData,
  };
}
