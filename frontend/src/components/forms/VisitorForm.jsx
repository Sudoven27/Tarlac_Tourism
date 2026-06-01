import React, { useState, useEffect } from 'react';
import { MUNICIPALITIES } from '../../utils/constants';

const RESIDENCE_TYPES = ['This Municipality', 'This Province', 'Other Province', 'Foreign'];
const PURPOSES = ['Leisure/Recreation', 'Cultural/Heritage', 'Adventure', 'Business', 'Religious', 'Education', 'Others'];
const TRANSPORTS = ['Private Vehicle', 'Bus', 'Motorcycle', 'Walk', 'Tricycle', 'Other'];

const INITIAL = {
  firstName: '', lastName: '', gender: 'Male', age: '',
  residenceType: 'This Province', province: '', country: 'Philippines', nationality: 'Filipino',
  touristSpot: '', municipality: '', visitDate: new Date().toISOString().slice(0, 10),
  purpose: 'Leisure/Recreation', groupSize: 1, stayDuration: '',
  transportation: 'Private Vehicle', estimatedSpend: '', rating: '', feedback: '', notes: ''
};

export default function VisitorForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(initial || INITIAL);
  useEffect(() => { if (initial) setForm({ ...INITIAL, ...initial, visitDate: initial.visitDate ? new Date(initial.visitDate).toISOString().slice(0, 10) : INITIAL.visitDate }); }, [initial]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-5">
      {/* Personal Info */}
      <div>
        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">1</span>
          Personal Information
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">First Name <span className="text-red-500">*</span></label>
            <input className="form-input" value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="First name" required />
          </div>
          <div>
            <label className="form-label">Last Name <span className="text-red-500">*</span></label>
            <input className="form-input" value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Last name" required />
          </div>
          <div>
            <label className="form-label">Gender <span className="text-red-500">*</span></label>
            <select className="form-select" value={form.gender} onChange={e => set('gender', e.target.value)} required>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="form-label">Age</label>
            <input className="form-input" type="number" min="0" max="120" value={form.age} onChange={e => set('age', e.target.value)} placeholder="e.g. 28" />
          </div>
        </div>
      </div>

      {/* Origin */}
      <div>
        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">2</span>
          Origin / Residence
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Residence Type <span className="text-red-500">*</span></label>
            <select className="form-select" value={form.residenceType} onChange={e => set('residenceType', e.target.value)} required>
              {RESIDENCE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">{form.residenceType === 'Foreign' ? 'Country' : 'Province/Region'}</label>
            <input className="form-input" value={form.residenceType === 'Foreign' ? form.country : form.province}
              onChange={e => set(form.residenceType === 'Foreign' ? 'country' : 'province', e.target.value)}
              placeholder={form.residenceType === 'Foreign' ? 'e.g. Japan' : 'e.g. Metro Manila'} />
          </div>
          <div>
            <label className="form-label">Nationality</label>
            <input className="form-input" value={form.nationality} onChange={e => set('nationality', e.target.value)} placeholder="Filipino" />
          </div>
        </div>
      </div>

      {/* Visit Details */}
      <div>
        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">3</span>
          Visit Details
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="form-label">Tourist Spot Visited <span className="text-red-500">*</span></label>
            <input className="form-input" value={form.touristSpot} onChange={e => set('touristSpot', e.target.value)} placeholder="e.g. Capas National Shrine" required />
          </div>
          <div>
            <label className="form-label">Municipality <span className="text-red-500">*</span></label>
            <select className="form-select" value={form.municipality} onChange={e => set('municipality', e.target.value)} required>
              <option value="">Select Municipality</option>
              {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Visit Date <span className="text-red-500">*</span></label>
            <input className="form-input" type="date" value={form.visitDate} onChange={e => set('visitDate', e.target.value)} required />
          </div>
          <div>
            <label className="form-label">Purpose</label>
            <select className="form-select" value={form.purpose} onChange={e => set('purpose', e.target.value)}>
              {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Group Size</label>
            <input className="form-input" type="number" min="1" value={form.groupSize} onChange={e => set('groupSize', e.target.value)} placeholder="1" />
          </div>
          <div>
            <label className="form-label">Transportation</label>
            <select className="form-select" value={form.transportation} onChange={e => set('transportation', e.target.value)}>
              {TRANSPORTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Stay Duration</label>
            <input className="form-input" value={form.stayDuration} onChange={e => set('stayDuration', e.target.value)} placeholder="e.g. 1 day, 2 nights" />
          </div>
          <div>
            <label className="form-label">Estimated Spend (₱)</label>
            <input className="form-input" type="number" min="0" value={form.estimatedSpend} onChange={e => set('estimatedSpend', e.target.value)} placeholder="0" />
          </div>
        </div>
      </div>

      {/* Feedback */}
      <div>
        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">4</span>
          Feedback & Satisfaction
        </p>
        <div className="space-y-4">
          <div>
            <label className="form-label">Satisfaction Rating</label>
            <div className="flex gap-2 mt-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => set('rating', n)}
                  className={`w-10 h-10 rounded-xl text-lg transition-all ${
                    Number(form.rating) >= n
                      ? 'bg-amber-400 text-white shadow-sm scale-105'
                      : 'bg-gray-100 text-gray-300 hover:bg-amber-100 hover:text-amber-400'
                  }`}
                >
                  ★
                </button>
              ))}
              {form.rating && <span className="self-center text-sm text-gray-500 ml-1">{form.rating}/5</span>}
            </div>
          </div>
          <div>
            <label className="form-label">Feedback / Comments</label>
            <textarea className="form-input resize-none" rows={3} value={form.feedback} onChange={e => set('feedback', e.target.value)} placeholder="Visitor's comments or suggestions..." />
          </div>
          <div>
            <label className="form-label">Additional Notes</label>
            <textarea className="form-input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional observations..." />
          </div>
        </div>
      </div>

      <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
        {loading ? <><div className="spinner w-4 h-4" /> Saving...</> : 'Save Visitor Record'}
      </button>
    </form>
  );
}
