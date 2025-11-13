'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';

export interface InlineEditProps {
  value: string | string[];
  onSave: (value: string | string[]) => Promise<void>;
  type?: 'text' | 'textarea' | 'select' | 'datetime';
  options?: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  displayFormatter?: (value: string | string[]) => React.ReactNode;
  multiline?: boolean;
  rows?: number;
}

export function InlineEdit({
  value,
  onSave,
  type = 'text',
  options = [],
  placeholder = 'Click to edit',
  className = '',
  displayFormatter,
  multiline = false,
  rows = 3,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement || inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (isSaving) return;

    // Don't save if value hasn't changed
    const isArrayEqual = Array.isArray(value) && Array.isArray(editValue) &&
      value.length === editValue.length &&
      value.every((v, i) => v === editValue[i]);

    if (editValue === value || isArrayEqual) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
      // Revert to original value on error
      setEditValue(value);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Enter' && !multiline && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Enter' && e.metaKey && (multiline || type === 'textarea')) {
      // Cmd/Ctrl + Enter to save in textarea
      e.preventDefault();
      handleSave();
    }
  };

  const renderDisplay = () => {
    const displayValue = displayFormatter ? displayFormatter(value) : value;
    const isEmpty = !value || (Array.isArray(value) && value.length === 0) || value === '';

    return (
      <div
        onClick={() => setIsEditing(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          cursor-pointer rounded px-2 py-1 -mx-2 -my-1
          transition-all duration-150
          ${isHovered ? 'bg-blue-50 ring-1 ring-blue-200' : ''}
          ${isEmpty ? 'text-gray-400 italic' : ''}
          ${className}
        `}
        title="Click to edit"
      >
        {isEmpty ? placeholder : displayValue}
      </div>
    );
  };

  const renderInput = () => {
    if (type === 'select') {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={String(editValue)}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white disabled:opacity-50"
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'datetime') {
      const dateValue = value ? new Date(String(value)).toISOString().slice(0, 16) : '';
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="datetime-local"
          value={dateValue}
          onChange={(e) => setEditValue(new Date(e.target.value).toISOString())}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white disabled:opacity-50"
        />
      );
    }

    if (type === 'textarea' || multiline) {
      const textValue = Array.isArray(editValue) ? editValue.join('\n') : String(editValue);
      return (
        <div className="relative">
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={textValue}
            onChange={(e) => {
              const val = e.target.value;
              setEditValue(multiline && Array.isArray(value) ? val.split('\n') : val);
            }}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            rows={rows}
            className="w-full px-2 py-1 border border-blue-300 rounded text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white disabled:opacity-50"
          />
          <div className="text-xs text-gray-500 mt-1">
            Press Cmd+Enter to save, Esc to cancel
          </div>
        </div>
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={String(editValue)}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white disabled:opacity-50"
      />
    );
  };

  if (!isEditing) {
    return renderDisplay();
  }

  return (
    <div className="relative">
      {renderInput()}
      {isSaving && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
