import React, { useState, useEffect } from 'react';
import { FiX, FiEdit2, FiMapPin, FiCalendar, FiUsers, FiHome, FiInfo, FiImage, FiExternalLink, FiMaximize2 } from 'react-icons/fi';
import { MdHotel, MdPark, MdBusiness } from 'react-icons/md';
import PDFDownloadButton from './PDFDownloadButton';
import { formatDate, getTypeLabel, getBadgeClass } from '../../utils/constants';

const FIELD_MAPS = {
  sae: [
    { label: 'Establishment Name', key: 'nameOfEstablishment', wide: true },
    { label: 'Attraction Code', key: 'attractionCode' },
    { label: 'Type', key: 'typeCode', badge: true },
    { label: 'City/Municipality', key: 'cityMun', icon: FiMapPin, renderFn: (v, r) => v || r.municipality || '—' },
    { label: 'Province/HUC', key: 'provHuc' },
    { label: 'Address', key: 'address', wide: true },
    { label: 'No. of Rooms', key: 'noOfRooms', icon: FiHome },
    { label: 'No. of Employees', key: 'noOfEmployees', icon: FiUsers },
    { label: 'Female Employees', key: 'femaleEmployees' },
    { label: 'Male Employees', key: 'maleEmployees' },
    { label: 'Report Year', key: 'reportYear', icon: FiCalendar },
    { label: 'Month', key: 'reportMonth', transform: v => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][v-1] || v },
    { label: 'Contact', key: 'contactNumber' },
    { label: 'Email', key: 'email' },
    { label: 'Notes', key: 'notes', wide: true, multiline: true },
  ],
  sta: [
    { label: 'Attraction Name', key: 'taName', wide: true },
    { label: 'Attraction Code', key: 'attractionCode' },
    { label: 'Type', key: 'typeCode', badge: true, transform: getTypeLabel },
    { label: 'City/Municipality', key: 'cityMun', icon: FiMapPin },
    { label: 'Barangay', key: 'brgy' },
    { label: 'Province/HUC', key: 'provHuc' },
    { label: 'Year Established', key: 'yearEst', icon: FiCalendar },
    { label: 'Report Year', key: 'reportYear', icon: FiCalendar },
    { label: 'Employees', key: 'employees', icon: FiUsers },
    { label: 'Female Emp.', key: 'femaleEmp' },
    { label: 'Male Emp.', key: 'maleEmp' },
    { label: 'Dev. Level', key: 'devtLvl', badge: true },
    { label: 'TA Category', key: 'taCategory' },
    { label: 'NTDP Category', key: 'ntdpCategory' },
    { label: 'Management', key: 'mgt' },
    { label: 'Online', key: 'onlineConnectivity' },
    { label: 'Entry Fee', key: 'entryFee', prefix: '₱' },
    { label: 'Visitors/Year', key: 'visitorsPerYear', format: 'number' },
    { label: 'Contact Person', key: 'contactPerson' },
    { label: 'Contact Info', key: 'contactInfo' },
    { label: 'Description / Notes', key: 'descriptionNotes', wide: true, multiline: true },
  ],
  ste: [
    { label: 'Enterprise Name', key: 'nameOfEnterprise', wide: true },
    { label: 'Attraction Code', key: 'attractionCode' },
    { label: 'Type', key: 'type', badge: true },
    { label: 'City/Municipality', key: 'cityMun', icon: FiMapPin },
    { label: 'Province/HUC', key: 'provHuc' },
    { label: 'Seats/Units', key: 'seatsUnit' },
    { label: 'Total Employees', key: 'totalEmployees', icon: FiUsers },
    { label: 'Female Employees', key: 'femaleEmployees' },
    { label: 'Male Employees', key: 'maleEmployees' },
    { label: 'Report Year', key: 'reportYear', icon: FiCalendar },
    { label: 'Month', key: 'reportMonth', transform: v => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][v-1] || v },
    { label: 'Classification', key: 'classification' },
    { label: 'Contact', key: 'contactNumber' },
    { label: 'Email', key: 'email' },
    { label: 'Address', key: 'address', wide: true },
    { label: 'Notes', key: 'notes', wide: true, multiline: true },
  ],
};

const TYPE_ICONS = { sae: MdHotel, sta: MdPark, ste: MdBusiness };
const TYPE_LABELS = { sae: 'Accommodation Establishment', sta: 'Tourist Attraction', ste: 'Tourism Enterprise' };

function FieldValue({ field, record }) {
  let value = field.renderFn ? field.renderFn(record[field.key], record) : record[field.key];
  if (value === null || value === undefined || value === '') return <span className="text-gray-300 italic text-xs">—</span>;
  if (field.transform) value = field.transform(value);
  if (field.format === 'number') value = Number(value).toLocaleString();
  if (field.prefix) value = field.prefix + value;
  if (field.badge) return <span className={getBadgeClass(record[field.key])}>{value}</span>;
  if (field.multiline) return <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{value}</p>;
  return <span className="text-sm font-semibold text-gray-800">{value}</span>;
}

// Fetch HTML via authenticated fetch → blob URL for iframe (avoids CSP issues)
async function fetchPreviewBlobUrl(type, recordId) {
  const token = localStorage.getItem('token');
  const res = await fetch(`/api/export/html/${type}/${recordId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const html = await res.text();
  const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
  return URL.createObjectURL(blob);
}

// Open PDF preview in new tab
function openInNewTab(type, recordId) {
  const token = localStorage.getItem('token');
  fetch(`/api/export/html/${type}/${recordId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.text())
    .then(html => {
      const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (!win) alert('Popup blocked. Please allow popups for this site.');
      setTimeout(() => URL.revokeObjectURL(url), 120000);
    })
    .catch(e => alert('Could not open preview: ' + e.message));
}

export default function RecordDetailModal({ isOpen, onClose, type, record, onEdit }) {
  const [tab, setTab] = useState('details');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState('');
  const [previewError, setPreviewError] = useState('');

  const Icon = TYPE_ICONS[type] || FiInfo;
  const fields = FIELD_MAPS[type] || [];

  // Reset when record changes
  useEffect(() => {
    setTab('details');
    // Revoke old blob URL to free memory
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl('');
    }
    setPreviewError('');
  }, [record?._id]);

  // Load preview when tab switches
  useEffect(() => {
    if (tab !== 'preview' || !record?._id) return;
    if (previewBlobUrl || previewError) return; // already attempted

    setPreviewLoading(true);
    fetchPreviewBlobUrl(type, record._id)
      .then(url => { setPreviewBlobUrl(url); })
      .catch(e => { setPreviewError(e.message || 'Failed to load preview'); })
      .finally(() => setPreviewLoading(false));
  }, [tab, type, record?._id]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    };
  }, [previewBlobUrl]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !record) return null;

  const recordName = record.nameOfEstablishment || record.taName || record.nameOfEnterprise || 'Record';
  const code = record.attractionCode || `${type.toUpperCase()}-${record.reportYear || 2026}-${String(record._id).slice(-6).toUpperCase()}`;
  const images = Array.isArray(record.images) ? record.images.slice(0, 2) : record.imageUrl ? [record.imageUrl] : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col"
        style={{ maxHeight: 'calc(100vh - 48px)', animation: 'fadeIn 0.2s ease' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-4 px-6 py-4 rounded-t-2xl flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)' }}>
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <Icon className="text-white text-xl" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-0.5">{TYPE_LABELS[type]}</p>
            <h2 className="text-white font-bold text-lg leading-tight truncate">{recordName}</h2>
            <p className="text-emerald-300 text-xs mt-0.5 font-mono">{code}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <PDFDownloadButton type={type} record={record} size="sm" />
            {onEdit && (
              <button onClick={() => { onClose(); onEdit(record); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all">
                <FiEdit2 /> Edit
              </button>
            )}
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/25 flex items-center justify-center text-white/70 hover:text-white transition-all">
              <FiX />
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-gray-100 px-6 flex-shrink-0 bg-white">
          {[
            { id: 'details', label: '📋 Record Details' },
            { id: 'preview', label: '📄 PDF Preview' }
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                tab === t.id ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* DETAILS TAB */}
          {tab === 'details' && (
            <div className="p-6 space-y-5">
              {/* Images */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {images.map((url, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl bg-gray-50 p-2">
                      <p className="text-xs text-gray-400 font-semibold mb-1 text-center">Image {i + 1}</p>
                      <img src={url} alt={`Image ${i + 1}`}
                        className="w-full h-44 object-contain rounded-lg"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  ))}
                  {images.length === 1 && (
                    <div className="border border-dashed border-gray-200 rounded-xl bg-gray-50 flex flex-col items-center justify-center h-48 gap-2 text-gray-300">
                      <FiImage className="text-2xl" />
                      <span className="text-xs">No second image</span>
                    </div>
                  )}
                </div>
              )}

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-1">Attraction Code</p>
                  <p className="font-mono font-bold text-emerald-800 text-sm">{code}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Date Added</p>
                  <p className="text-sm font-semibold text-gray-700">{formatDate(record.createdAt)}</p>
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {fields.map(field => (
                  <div key={field.key} className={field.wide ? 'col-span-2' : ''}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {field.icon && <field.icon className="text-emerald-500 text-xs" />}
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{field.label}</span>
                    </div>
                    <FieldValue field={field} record={record} />
                  </div>
                ))}
              </div>

              {/* PDF CTA */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-amber-50 rounded-2xl border border-emerald-100 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Export as PDF</p>
                  <p className="text-xs text-gray-400 mt-0.5">Official Tarlac Tourism Office document format</p>
                </div>
                <PDFDownloadButton type={type} record={record} />
              </div>
            </div>
          )}

          {/* PREVIEW TAB */}
          {tab === 'preview' && (
            <div className="flex flex-col" style={{ height: '580px' }}>
              {/* Preview toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className="ml-2 font-mono">PDF Template Preview — A4</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openInNewTab(type, record._id)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
                    title="Open in new tab"
                  >
                    <FiExternalLink className="text-xs" /> New Tab
                  </button>
                  <PDFDownloadButton type={type} record={record} size="sm" />
                </div>
              </div>

              {/* Preview content */}
              <div className="flex-1 relative bg-gray-100">
                {previewLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50 z-10">
                    <div className="spinner w-8 h-8" />
                    <p className="text-sm text-gray-400">Loading PDF template…</p>
                  </div>
                )}

                {previewError && !previewLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-50">
                    <div className="text-4xl">⚠️</div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Preview could not load</p>
                      <p className="text-xs text-gray-400 mb-4">{previewError}</p>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => { setPreviewError(''); setPreviewBlobUrl(''); }}
                          className="px-3 py-1.5 text-xs rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                        >
                          Retry
                        </button>
                        <button
                          onClick={() => openInNewTab(type, record._id)}
                          className="px-3 py-1.5 text-xs rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center gap-1"
                        >
                          <FiExternalLink className="text-xs" /> Open in New Tab
                        </button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <PDFDownloadButton type={type} record={record} />
                    </div>
                  </div>
                )}

                {previewBlobUrl && !previewLoading && (
                  <iframe
                    src={previewBlobUrl}
                    title="PDF Preview"
                    className="w-full h-full border-0"
                    style={{ minHeight: '520px' }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
