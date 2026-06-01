import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiHome } from 'react-icons/fi';
import { GiPalmTree } from 'react-icons/gi';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-6 shadow-xl">
          <GiPalmTree className="text-white text-4xl" />
        </div>
        <h1 className="font-display text-7xl font-bold text-emerald-200 mb-2">404</h1>
        <h2 className="font-display text-2xl font-bold text-emerald-900 mb-3">Page Not Found</h2>
        <p className="text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="btn-outline"
          >
            <FiArrowLeft /> Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            <FiHome /> Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
