'use client';

import React from 'react';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  className?: string;
}

export function FloatingActionButton({
  onClick,
  icon,
  label = 'Nuovo',
  className = '',
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40
        w-14 h-14 sm:w-16 sm:h-16
        bg-primary text-white
        rounded-full shadow-lg
        flex items-center justify-center
        hover:bg-primary/90 hover:shadow-xl
        active:scale-95
        transition-all duration-200
        focus:outline-none focus:ring-4 focus:ring-primary/30
        ${className}
      `}
      aria-label={label}
    >
      {icon || (
        <svg
          className="w-7 h-7 sm:w-8 sm:h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 4v16m8-8H4"
          />
        </svg>
      )}
    </button>
  );
}
