'use client';

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  type = 'danger',
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-3xl">
            {type === 'danger' && '⚠️'}
            {type === 'warning' && '⚡'}
            {type === 'info' && 'ℹ️'}
          </div>
          <p className="text-gray-700 flex-1">{message}</p>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={type === 'danger' ? 'primary' : 'secondary'}
            onClick={onConfirm}
            disabled={loading}
            className={
              type === 'danger'
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : ''
            }
          >
            {loading ? '⏳ Attendi...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
