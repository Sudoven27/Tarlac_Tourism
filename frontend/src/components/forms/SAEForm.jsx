import React, { useState, useEffect, useRef } from 'react';
import { FiUpload, FiX, FiImage } from 'react-icons/fi';
import { MUNICIPALITIES, REPORT_YEARS } from '../../utils/constants';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SAE_TYPES = ['Hotel', 'Resort', 'Motel', 'Tourist Inn', 'Pension House', 'Hostel', 'Apartelle', 'Others'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const INITIAL = {
  nameOfEstablishment: '', attractionCode: '', typeCode: '', noOfRooms: '', noOfEmployees: '',
  femaleEmployees: '', maleEmployees: '',
  reportYear: new Date().getFullYear(), reportMonth: new Date().getMonth() + 1,
  provHuc: 'Tarlac', cityMun: '', address: '', contactNumber: '', email: '', notes: '',
  images: []
};

export default function SAEForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(INITIAL);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (initial) {
      setForm({
        ...INITIAL, ...initial,
        images: Array.isArray(initial.images) ? initial.images : (initial.imageUrl ? [initial.imageUrl] : [])
      });
    }
  }, [initial]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFiles = async (files) => {
    const remaining = 2 - form.images.length;
    if (remaining <= 0) { toast.error('Maximum 2 images allowed'); return; }
    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const fd = new FormData();
      toUpload.forEach(f => fd.append('images', f));
      const { data } = await api.post('/images/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(f => ({ ...f, images: [...f.images, ...data.urls].slice(0, 2) }));
      toast.success(`${data.urls.length} image(s) uploaded`);
    } catch { toast.error('Image upload failed'); }
    finally { setUploading(false); }
  };

  const removeImage = (idx) => setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-6">

      {/* Section 1: Basic Info */}
      <div>
        <p className="section-label">Basic Information</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="form-label">Name of Establishment <span className="text-red-500">*</span></label>
            <input className="form-input" value={form.nameOfEstablishment}
              onChange={e => set('nameOfEstablishment', e.target.value)}
              placeholder="Enter complete official name" required />
          </div>
          <div>
            <label className="form-label">Attraction Code <span className="text-xs text-gray-400">(User-defined)</span></label>
            <input className="form-input" value={form.attractionCode}
              onChange={e => set('attractionCode', e.target.value)}
              placeholder="e.g. AE-2026-001" maxLength={30} />
          </div>
          <div>
            <label className="form-label">Type Code <span className="text-red-500">*</span></label>
            <select className="form-select" value={form.typeCode} onChange={e => set('typeCode', e.target.value)} required>
              <option value="">Select Type</option>
              {SAE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">City / Municipality <span className="text-red-500">*</span></label>
            <select className="form-select" value={form.cityMun} onChange={e => set('cityMun', e.target.value)} required>
              <option value="">Select Municipality</option>
              {MUNICIPALITIES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Province / HUC</label>
            <input className="form-input" value={form.provHuc} onChange={e => set('provHuc', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Section 2: Employee & Room Data */}
      <div>
        <p className="section-label">Capacity & Workforce</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="form-label">No. of Rooms</label>
            <input className="form-input" type="number" min="0" value={form.noOfRooms}
              onChange={e => set('noOfRooms', e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="form-label">No. of Employees</label>
            <input className="form-input" type="number" min="0" value={form.noOfEmployees}
              onChange={e => set('noOfEmployees', e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="form-label">Female Employees</label>
            <input className="form-input" type="number" min="0" value={form.femaleEmployees}
              onChange={e => set('femaleEmployees', e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="form-label">Male Employees</label>
            <input className="form-input" type="number" min="0" value={form.maleEmployees}
              onChange={e => set('maleEmployees', e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="form-label">Report Year</label>
            <select className="form-select" value={form.reportYear} onChange={e => set('reportYear', Number(e.target.value))}>
              {REPORT_YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Month</label>
            <select className="form-select" value={form.reportMonth} onChange={e => set('reportMonth', Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Section 3: Contact */}
      <div>
        <p className="section-label">Contact Information</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Contact Number</label>
            <input className="form-input" value={form.contactNumber}
              onChange={e => set('contactNumber', e.target.value)} placeholder="+63 xxx xxx xxxx" />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email}
              onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Address</label>
            <input className="form-input" value={form.address}
              onChange={e => set('address', e.target.value)} placeholder="Street, Barangay, Municipality" />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Notes</label>
            <textarea className="form-input resize-none" rows={2} value={form.notes}
              onChange={e => set('notes', e.target.value)} placeholder="Additional notes..." />
          </div>
        </div>
      </div>

      {/* Section 4: Images */}
      <div>
        <p className="section-label">Photos (max 2)</p>
        <div className="grid grid-cols-2 gap-4 mb-3">
          {form.images.map((url, i) => (
            <div key={i} className="relative border rounded-xl overflow-hidden bg-gray-50">
              <img src={url} alt={`Image ${i+1}`} className="w-full h-36 object-contain p-2" />
              <button type="button" onClick={() => removeImage(i)}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600">
                <FiX />
              </button>
              <p className="text-center text-xs text-gray-400 pb-1">Image {i+1}</p>
            </div>
          ))}
          {form.images.length < 2 && (
            <button type="button" onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="h-36 border-2 border-dashed border-emerald-300 rounded-xl flex flex-col items-center justify-center gap-2 text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50">
              {uploading ? <div className="spinner w-5 h-5" /> : <FiUpload className="text-xl" />}
              <span className="text-xs font-medium">{uploading ? 'Uploading...' : 'Add Image'}</span>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => handleFiles(e.target.files)} />
        <p className="text-xs text-gray-400">JPG, PNG, WebP · Max 10MB each · Maximum 2 images</p>
      </div>

      <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
        {loading ? <><div className="spinner w-4 h-4" /> Saving...</> : 'Save SAE Record'}
      </button>
    </form>
  );
}
