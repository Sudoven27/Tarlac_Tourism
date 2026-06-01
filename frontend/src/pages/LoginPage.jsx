import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { GiPalmTree } from 'react-icons/gi';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 emerald-gradient flex-col justify-between p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white" style={{ filter: 'blur(80px)' }} />
          <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-amber-300" style={{ filter: 'blur(60px)' }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-16">
            <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-xl">
              <GiPalmTree className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="font-display text-white text-xl font-bold">Tarlac Tourism</h1>
              <p className="text-emerald-300 text-sm">Province of Tarlac, Region III</p>
            </div>
          </div>

          <h2 className="font-display text-white text-4xl font-bold leading-tight mb-6">
            Inventory Supply<br />
            <span className="text-amber-300">Data Management</span><br />
            System
          </h2>
          <p className="text-emerald-200 text-base leading-relaxed max-w-sm">
            Centralized platform for tracking accommodation establishments, tourist attractions, and tourism enterprises across the Province of Tarlac.
          </p>
        </div>

        <div className="relative z-10">
          <div className="flex gap-6">
            {[
              { label: 'Municipalities', value: '17' },
              { label: 'Data Categories', value: '3' },
              { label: 'Year', value: '2026' }
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-amber-300 font-bold text-2xl font-display">{stat.value}</p>
                <p className="text-emerald-300 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
          <p className="text-emerald-400 text-xs mt-6">
            © 2026 Provincial Tourism Office – Province of Tarlac. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gradient-to-br from-emerald-50 to-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
              <GiPalmTree className="text-white text-lg" />
            </div>
            <div>
              <h1 className="font-display text-emerald-900 font-bold text-lg">Tarlac Tourism</h1>
              <p className="text-emerald-600 text-xs">Inventory Supply Data System</p>
            </div>
          </div>

          <div className="card p-8 shadow-xl border-emerald-100">
            <div className="mb-8">
              <h2 className="font-display text-2xl font-bold text-emerald-900">Sign In</h2>
              <p className="text-gray-500 text-sm mt-1">Enter your credentials to access the system</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="form-label">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="email"
                    className="form-input pl-10"
                    placeholder="yourname@tarlac.gov.ph"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-input pl-10 pr-10"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 text-base mt-2"
              >
                {loading ? (
                  <><div className="spinner w-4 h-4" /> Signing in...</>
                ) : 'Sign In to System'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-xs text-emerald-700 font-semibold mb-2">Default Admin Credentials:</p>
              <p className="text-xs text-emerald-600 font-mono">admin@tarlac.gov.ph</p>
              <p className="text-xs text-emerald-600 font-mono">Admin@2026</p>
              <p className="text-xs text-gray-400 mt-1">Run <code className="bg-white px-1 rounded">/api/auth/seed</code> once to create admin</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
