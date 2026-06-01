import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUserCheck, FiUserX, FiShield, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { MUNICIPALITIES, formatDate } from '../utils/constants';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'staff', municipality: '', isActive: true };

function UserForm({ initial, onSubmit, loading, isEdit }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  useEffect(() => { if (initial) setForm({ ...initial, password: '' }); }, [initial]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="form-label">Full Name <span className="text-red-500">*</span></label>
          <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="First and Last Name" />
        </div>
        <div className="col-span-2">
          <label className="form-label">Email Address <span className="text-red-500">*</span></label>
          <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="user@tarlac.gov.ph" />
        </div>
        <div className="col-span-2">
          <label className="form-label">{isEdit ? 'New Password (leave blank to keep current)' : 'Password'} {!isEdit && <span className="text-red-500">*</span>}</label>
          <input
            className="form-input"
            type="password"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            required={!isEdit}
            placeholder={isEdit ? 'Leave blank to keep current' : 'Min. 6 characters'}
            minLength={form.password ? 6 : undefined}
          />
        </div>
        <div>
          <label className="form-label">Role</label>
          <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="form-label">Municipality</label>
          <select className="form-select" value={form.municipality} onChange={e => set('municipality', e.target.value)}>
            <option value="">All Municipalities</option>
            {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        {isEdit && (
          <div className="col-span-2">
            <label className="form-label">Account Status</label>
            <select className="form-select" value={form.isActive ? 'active' : 'inactive'} onChange={e => set('isActive', e.target.value === 'active')}>
              <option value="active">Active</option>
              <option value="inactive">Deactivated</option>
            </select>
          </div>
        )}
      </div>
      <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
        {loading ? <><div className="spinner w-4 h-4" /> Saving...</> : isEdit ? 'Update User' : 'Create User'}
      </button>
    </form>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'add', user: null });
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data.data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.municipality?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (form) => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (modal.mode === 'edit' && !payload.password) delete payload.password;
      if (modal.mode === 'add') {
        await api.post('/users', payload);
        toast.success('User created!');
      } else {
        const { password, ...updatePayload } = payload;
        await api.put(`/users/${modal.user._id}`, updatePayload);
        if (password) await api.put(`/users/${modal.user._id}/password`, { password });
        toast.success('User updated!');
      }
      setModal({ open: false, mode: 'add', user: null });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/users/${confirm.id}`);
      toast.success('User deleted');
      setConfirm({ open: false, id: null });
      fetchUsers();
    } catch { toast.error('Failed to delete user'); }
    finally { setDeleting(false); }
  };

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    active: users.filter(u => u.isActive).length,
    staff: users.filter(u => u.role === 'staff').length
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage admin and staff accounts</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({ open: true, mode: 'add', user: null })}>
          <FiPlus /> Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.total, icon: FiUser, color: 'text-emerald-600 bg-emerald-100' },
          { label: 'Admins', value: stats.admins, icon: FiShield, color: 'text-amber-600 bg-amber-100' },
          { label: 'Staff', value: stats.staff, icon: FiUser, color: 'text-blue-600 bg-blue-100' },
          { label: 'Active', value: stats.active, icon: FiUserCheck, color: 'text-green-600 bg-green-100' }
        ].map(s => (
          <div key={s.label} className="card py-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="text-lg" />
              </div>
              <div>
                <p className="text-xl font-bold font-display">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="card p-4">
        <input
          className="form-input"
          placeholder="Search by name, email, or municipality..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="spinner w-8 h-8" />
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Municipality</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">No users found</td></tr>
                ) : filtered.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white bg-emerald-600 flex-shrink-0">
                          {u.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{u.name}</p>
                          {u._id === currentUser?._id && <span className="text-xs text-emerald-600 font-semibold">(You)</span>}
                        </div>
                      </div>
                    </td>
                    <td className="text-gray-500">{u.email}</td>
                    <td>
                      <span className={u.role === 'admin' ? 'badge bg-amber-100 text-amber-700' : 'badge bg-blue-100 text-blue-700'}>
                        {u.role === 'admin' ? <FiShield className="text-xs" /> : <FiUser className="text-xs" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="text-gray-500">{u.municipality || 'All Areas'}</td>
                    <td>
                      <span className={u.isActive ? 'badge-green' : 'badge-red'}>
                        {u.isActive ? <FiUserCheck className="text-xs" /> : <FiUserX className="text-xs" />}
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-xs text-gray-400">{u.lastLogin ? formatDate(u.lastLogin) : 'Never'}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => setModal({ open: true, mode: 'edit', user: u })} className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors">
                          <FiEdit2 className="text-sm" />
                        </button>
                        {u._id !== currentUser?._id && (
                          <button onClick={() => setConfirm({ open: true, id: u._id })} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors">
                            <FiTrash2 className="text-sm" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, mode: 'add', user: null })}
        title={modal.mode === 'add' ? 'Add New User' : 'Edit User'}
      >
        <UserForm initial={modal.user} onSubmit={handleSave} loading={saving} isEdit={modal.mode === 'edit'} />
      </Modal>

      <ConfirmDialog
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete User?"
        message="This user account will be permanently deleted. All their records will remain."
      />
    </div>
  );
}
