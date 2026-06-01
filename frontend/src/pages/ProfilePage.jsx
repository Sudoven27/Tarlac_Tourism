import React, { useState } from 'react';
import { FiUser, FiMail, FiMapPin, FiLock, FiSave, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MUNICIPALITIES, formatDate } from '../utils/constants';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', municipality: user?.municipality || '' });
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put(`/users/${user._id}`, { name: form.name, municipality: form.municipality, role: user.role, isActive: true });
      setUser(data.data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSavingProfile(false); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passForm.newPass !== passForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (passForm.newPass.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSavingPass(true);
    try {
      await api.put(`/users/${user._id}/password`, { password: passForm.newPass });
      toast.success('Password changed!');
      setPassForm({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSavingPass(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your account information</p>
      </div>

      {/* Profile card */}
      <div className="card">
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-2xl emerald-gradient flex items-center justify-center text-white text-2xl font-bold font-display shadow-lg">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-gray-800">{user?.name}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`badge ${user?.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'badge-green'}`}>
                {user?.role === 'admin' ? <FiShield className="text-xs" /> : <FiUser className="text-xs" />}
                {user?.role}
              </span>
              {user?.municipality && (
                <span className="badge badge-blue">
                  <FiMapPin className="text-xs" /> {user.municipality}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: 'Member Since', value: formatDate(user?.createdAt) },
            { label: 'Last Login', value: user?.lastLogin ? formatDate(user.lastLogin) : 'N/A' },
            { label: 'Account Status', value: 'Active' },
            { label: 'Access Level', value: user?.role === 'admin' ? 'Full Access' : 'Staff Access' }
          ].map(item => (
            <div key={item.label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
              <p className="text-sm font-semibold text-gray-700">{item.value}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <FiUser className="text-emerald-600" /> Edit Profile
          </h3>
          <div>
            <label className="form-label">Full Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Email Address</label>
            <input className="form-input bg-gray-50" value={user?.email} disabled />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed. Contact admin if needed.</p>
          </div>
          <div>
            <label className="form-label">Assigned Municipality</label>
            <select className="form-select" value={form.municipality} onChange={e => setForm(f => ({ ...f, municipality: e.target.value }))}>
              <option value="">All Municipalities</option>
              {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={savingProfile}>
            {savingProfile ? <><div className="spinner w-4 h-4" /> Saving...</> : <><FiSave /> Save Changes</>}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-4">
          <FiLock className="text-emerald-600" /> Change Password
        </h3>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div>
            <label className="form-label">New Password</label>
            <input
              className="form-input"
              type="password"
              value={passForm.newPass}
              onChange={e => setPassForm(f => ({ ...f, newPass: e.target.value }))}
              placeholder="Minimum 6 characters"
              required minLength={6}
            />
          </div>
          <div>
            <label className="form-label">Confirm New Password</label>
            <input
              className="form-input"
              type="password"
              value={passForm.confirm}
              onChange={e => setPassForm(f => ({ ...f, confirm: e.target.value }))}
              placeholder="Re-enter new password"
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={savingPass}>
            {savingPass ? <><div className="spinner w-4 h-4" /> Changing...</> : <><FiLock /> Change Password</>}
          </button>
        </form>
      </div>
    </div>
  );
}
