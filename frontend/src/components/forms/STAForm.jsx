import React, { useState, useEffect, useRef } from 'react';
import { FiUpload, FiX } from 'react-icons/fi';
import { MUNICIPALITIES, REPORT_YEARS } from '../../utils/constants';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STA_TYPES = ['Nature', 'History_and_Culture', 'Man-Made', 'Events_and_Festivals', 'Sports_and_Recreation', 'Others'];
const DEVT_LEVELS = ['Undeveloped', 'Developing', 'Developed', 'Highly Developed'];
const MGT_OPTIONS = ['LGU', 'Private', 'National Government', 'Community-Based', 'Mixed', 'Others'];
const ONLINE_OPTIONS = ['Yes', 'No', 'N/A'];
const TA_CATEGORIES = ['Beach/Coastal', 'Mountain/Highland', 'Cave', 'Waterfall', 'River/Lake', 'Heritage Site', 'Religious', 'Wildlife', 'Festival', 'Sports', 'Others'];
const NTDP_CATEGORIES = ['Ecotourism', 'Cultural Tourism', 'Adventure Tourism', 'Wellness Tourism', 'Business Tourism', 'Others'];

const INITIAL = {
  taName: '', attractionCode: '', typeCode: '', yearEst: '',
  region: 'Region III', provHuc: 'Tarlac', cityMun: '', reportYear: new Date().getFullYear(),
  employees: '', femaleEmp: '', maleEmp: '', brgy: '',
  latitude: '', longitude: '', altitudeM: '',
  taCategory: '', ntdpCategory: '', devtLvl: 'Developed',
  mgt: '', onlineConnectivity: 'N/A',
  descriptionNotes: '', contactPerson: '', contactInfo: '',
  entryFee: '', visitorsPerYear: '', images: []
};

export default function STAForm({ initial, onSubmit, loading }) {
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

      {/* Row 1: Basic */}
      <div>
        <p className="section-label">Tourist Attraction — Basic Info (Form STA1 Row 1)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="form-label">TA Name <span className="text-red-500">*</span></label>
            <input className="form-input" value={form.taName} onChange={e => set('taName', e.target.value)}
              placeholder="Complete official name of the Tourist Attraction" required />
          </div>
          <div>
            <label className="form-label">Attraction Code <span className="text-xs text-gray-400">(User-defined)</span></label>
            <input className="form-input" value={form.attractionCode}
              onChange={e => set('attractionCode', e.target.value)}
              placeholder="e.g. TA-2026-001" maxLength={30} />
          </div>
          <div>
            <label className="form-label">Type Code <span className="text-red-500">*</span></label>
            <select className="form-select" value={form.typeCode} onChange={e => set('typeCode', e.target.value)} required>
              <option value="">Select Type</option>
              {STA_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Year Established</label>
            <input className="form-input" type="number" min="1800" max="2030" value={form.yearEst}
              onChange={e => set('yearEst', e.target.value)} placeholder="e.g. 1995" />
          </div>
          <div>
            <label className="form-label">Region</label>
            <input className="form-input" value={form.region} onChange={e => set('region', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Province / HUC</label>
            <input className="form-input" value={form.provHuc} onChange={e => set('provHuc', e.target.value)} />
          </div>
          <div>
            <label className="form-label">City / Municipality <span className="text-red-500">*</span></label>
            <select className="form-select" value={form.cityMun} onChange={e => set('cityMun', e.target.value)} required>
              <option value="">Select Municipality</option>
              {MUNICIPALITIES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Report Year</label>
            <select className="form-select" value={form.reportYear} onChange={e => set('reportYear', Number(e.target.value))}>
              {REPORT_YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Employees */}
      <div>
        <p className="section-label">Workforce</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="form-label">Employees</label>
            <input className="form-input" type="number" min="0" value={form.employees}
              onChange={e => set('employees', e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="form-label">Female Emp.</label>
            <input className="form-input" type="number" min="0" value={form.femaleEmp}
              onChange={e => set('femaleEmp', e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="form-label">Male Emp.</label>
            <input className="form-input" type="number" min="0" value={form.maleEmp}
              onChange={e => set('maleEmp', e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="form-label">Barangay</label>
            <input className="form-input" value={form.brgy} onChange={e => set('brgy', e.target.value)}
              placeholder="Specify barangay where the TA is located" />
          </div>
        </div>
      </div>

      {/* Row 2: Coordinates & Classification */}
      <div>
        <p className="section-label">Location & Classification (Form STA1 Row 2)</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Latitude</label>
            <input className="form-input" type="number" step="any" value={form.latitude}
              onChange={e => set('latitude', e.target.value)} placeholder="15.4754" />
          </div>
          <div>
            <label className="form-label">Longitude</label>
            <input className="form-input" type="number" step="any" value={form.longitude}
              onChange={e => set('longitude', e.target.value)} placeholder="120.5965" />
          </div>
          <div>
            <label className="form-label">Altitude (m)</label>
            <input className="form-input" type="number" min="0" value={form.altitudeM}
              onChange={e => set('altitudeM', e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="form-label">TA Category</label>
            <select className="form-select" value={form.taCategory} onChange={e => set('taCategory', e.target.value)}>
              <option value="">Select Category</option>
              {TA_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">NTDP Category</label>
            <select className="form-select" value={form.ntdpCategory} onChange={e => set('ntdpCategory', e.target.value)}>
              <option value="">Select NTDP Category</option>
              {NTDP_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Development Level</label>
            <select className="form-select" value={form.devtLvl} onChange={e => set('devtLvl', e.target.value)}>
              {DEVT_LEVELS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Management</label>
            <select className="form-select" value={form.mgt} onChange={e => set('mgt', e.target.value)}>
              <option value="">Select Management</option>
              {MGT_OPTIONS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Online Connectivity</label>
            <select className="form-select" value={form.onlineConnectivity} onChange={e => set('onlineConnectivity', e.target.value)}>
              {ONLINE_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Entry Fee (₱)</label>
            <input className="form-input" type="number" min="0" value={form.entryFee}
              onChange={e => set('entryFee', e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="form-label">Visitors Per Year</label>
            <input className="form-input" type="number" min="0" value={form.visitorsPerYear}
              onChange={e => set('visitorsPerYear', e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="form-label">Contact Person</label>
            <input className="form-input" value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)}
              placeholder="Full name" />
          </div>
          <div>
            <label className="form-label">Contact Information</label>
            <input className="form-input" value={form.contactInfo} onChange={e => set('contactInfo', e.target.value)}
              placeholder="Phone / email" />
          </div>
          <div className="sm:col-span-3">
            <label className="form-label">Description / Important Notes</label>
            <textarea className="form-input resize-none" rows={3} value={form.descriptionNotes}
              onChange={e => set('descriptionNotes', e.target.value)}
              placeholder="Brief description of the site, establishment, or festival. Include important facts, unique features, and significance." />
          </div>
        </div>
      </div>

      {/* Images */}
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
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
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
        {loading ? <><div className="spinner w-4 h-4" /> Saving...</> : 'Save STA Record'}
      </button>
    </form>
  );
}
