import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} flex flex-col`}
        style={{ maxHeight: 'calc(100vh - 48px)', animation: 'fadeIn 0.2s ease' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Fixed header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0 rounded-t-2xl bg-white">
          <h2 className="font-display text-lg font-bold text-emerald-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
