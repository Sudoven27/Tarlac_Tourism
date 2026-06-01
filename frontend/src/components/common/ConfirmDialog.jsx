import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, loading }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content mx-4 max-w-sm">
        <div className="p-6 text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertTriangle className="text-red-500 text-2xl" />
          </div>
          <h3 className="font-display text-lg font-bold text-gray-800 mb-2">{title || 'Confirm Delete'}</h3>
          <p className="text-gray-500 text-sm mb-6">{message || 'This action cannot be undone.'}</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-outline flex-1 justify-center" disabled={loading}>
              Cancel
            </button>
            <button onClick={onConfirm} className="btn-danger flex-1 justify-center" disabled={loading}>
              {loading ? <><div className="spinner w-4 h-4" /> Deleting...</> : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
