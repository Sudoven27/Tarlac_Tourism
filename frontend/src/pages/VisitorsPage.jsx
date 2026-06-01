import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FiPlus, FiEdit2, FiTrash2, FiEye, FiUsers, FiGlobe,
  FiUser, FiCalendar, FiMapPin, FiDownload, FiFilter
} from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import VisitorForm from '../components/forms/VisitorForm';
import PDFDownloadButton from '../components/common/PDFDownloadButton';
import { MUNICIPALITIES, REPORT_YEARS, formatDate, MUN_COLORS } from '../utils/constants';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const RESIDENCE_COLORS = { 'This Municipality': '#059669', 'This Province': '#10b981', 'Other Province': '#f59e0b', 'Foreign': '#3b82f6' };

// Visitor-specific PDF download (uses visitor endpoint)
function VisitorPDFButton({ record, variant = 'icon' }) {
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    if (!record?._id || generating) return;
    setGenerating(true);
    const toastId = toast.loading('Generating PDF…');
    try {
      const response = await api.get(`/export/pdf/visitor/${record._id}`, {
        responseType: 'blob', timeout: 30000
      });
      const ct = response.headers['content-type'] || '';
      if (ct.includes('application/pdf')) {
        const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${record.firstName}_${record.lastName}_VIS-${String(record._id).slice(-6).toUpperCase()}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('PDF downloaded!', { id: toastId });
      } else {
        // Fallback: fetch HTML and use html2pdf
        const htmlResp = await api.get(`/export/html/visitor/${record._id}`, {
          responseType: 'text', transformResponse: [(d) => d]
        });
        await generateHtml2Pdf(htmlResp.data, `${record.firstName}_${record.lastName}`);
        toast.success('PDF downloaded!', { id: toastId });
      }
    } catch {
      try {
        const htmlResp = await api.get(`/export/html/visitor/${record._id}`, {
          responseType: 'text', transformResponse: [(d) => d]
        });
        await generateHtml2Pdf(htmlResp.data, `${record.firstName}_${record.lastName}`);
        toast.success('PDF downloaded!', { id: toastId });
      } catch (e) {
        toast.error('PDF generation failed', { id: toastId });
      }
    } finally { setGenerating(false); }
  };

  async function generateHtml2Pdf(html, name) {
    if (!window.html2pdf) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:white;';
    container.innerHTML = html;
    document.body.appendChild(container);
    await window.html2pdf().set({
      margin: 0, filename: `${name}_visitor.pdf`,
      image: { type: 'jpeg', quality: 0.9 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'px', format: 'a4', orientation: 'portrait', hotfixes: ['px_scaling'] }
    }).from(container.querySelector('.page') || container).save();
    document.body.removeChild(container);
  }

  if (variant === 'icon') {
    return (
      <button onClick={handleDownload} disabled={generating} title="Download PDF"
        className={`p-1.5 rounded-lg transition-all ${generating ? 'text-amber-300 cursor-not-allowed' : 'hover:bg-amber-100 text-amber-600'}`}>
        {generating ? <div className="spinner w-3.5 h-3.5" /> : <FiDownload className="text-sm" />}
      </button>
    );
  }
  return (
    <button onClick={handleDownload} disabled={generating}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${generating ? 'bg-amber-100 text-amber-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'}`}>
      {generating ? <><div className="spinner w-4 h-4" /> Generating…</> : <><FiDownload /> Download PDF</>}
    </button>
  );
}

export default function VisitorsPage() {
  const { isAdmin } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ municipality: '', year: new Date().getFullYear(), month: '' });
  const [stats, setStats] = useState(null);
  const [modal, setModal] = useState({ open: false, mode: 'add', record: null });
  const [detailModal, setDetailModal] = useState({ open: false, record: null });
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCharts, setShowCharts] = useState(true);
  const searchTimer = useRef(null);
  const LIMIT = 15;

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (search) params.append('search', search);
      if (filters.municipality) params.append('municipality', filters.municipality);
      if (filters.year) params.append('year', filters.year);
      if (filters.month) params.append('month', filters.month);
      const { data } = await api.get(`/visitors?${params}`);
      setRecords(data.data);
      setTotal(data.total);
    } catch { toast.error('Failed to load visitor records'); }
    finally { setLoading(false); }
  }, [page, search, filters]);

  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.year) params.append('year', filters.year);
      if (filters.month) params.append('month', filters.month);
      if (filters.municipality) params.append('municipality', filters.municipality);
      const { data } = await api.get(`/visitors/stats?${params}`);
      setStats(data.data);
    } catch { /* stats are optional */ }
  }, [filters]);

  useEffect(() => { fetchRecords(); fetchStats(); }, [fetchRecords, fetchStats]);

  const handleSearch = (val) => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(val); setPage(1); }, 400);
  };

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        await api.post('/visitors', form);
        toast.success('Visitor record saved!');
      } else {
        await api.put(`/visitors/${modal.record._id}`, form);
        toast.success('Record updated!');
      }
      setModal({ open: false, mode: 'add', record: null });
      fetchRecords(); fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/visitors/${confirm.id}`);
      toast.success('Record deleted');
      setConfirm({ open: false, id: null });
      fetchRecords(); fetchStats();
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  };

  // Chart data
  const monthlyData = (stats?.byMonth || []).map(m => ({
    name: MONTHS[(m._id?.month || 1) - 1],
    Local: m.local || 0,
    Foreign: m.foreign || 0,
    Total: m.count || 0
  }));

  const residencePie = (stats?.byResidence || []).map(r => ({
    name: r._id || 'Unknown', value: r.count
  }));

  const spotData = (stats?.bySpot || []).map(s => ({
    name: s._id?.length > 14 ? s._id.slice(0, 14) + '…' : s._id || 'Unknown',
    fullName: s._id || 'Unknown',
    Visitors: s.count
  }));

  const columns = [
    {
      key: 'firstName', label: 'Visitor Name', sortable: true,
      render: (_, row) => (
        <button className="font-medium text-emerald-700 hover:underline text-left"
          onClick={() => setDetailModal({ open: true, record: row })}>
          {row.firstName} {row.lastName}
        </button>
      )
    },
    {
      key: 'gender', label: 'Gender',
      render: v => (
        <span className={`badge ${v === 'Male' ? 'badge-blue' : v === 'Female' ? 'bg-pink-100 text-pink-700 badge' : 'badge-gray'}`}>{v}</span>
      )
    },
    {
      key: 'residenceType', label: 'Residence',
      render: v => (
        <span className={`badge ${v === 'Foreign' ? 'badge-gold' : 'badge-green'}`}>{v}</span>
      )
    },
    { key: 'touristSpot', label: 'Tourist Spot', render: v => <span className="text-sm text-gray-700">{v}</span> },
    { key: 'municipality', label: 'Municipality' },
    {
      key: 'visitDate', label: 'Visit Date',
      render: v => <span className="text-xs text-gray-500">{formatDate(v)}</span>
    },
    {
      key: 'rating', label: 'Rating',
      render: v => v ? <span className="text-amber-400">{'★'.repeat(v)}{'☆'.repeat(5 - v)}</span> : <span className="text-gray-300 text-xs">—</span>
    },
    {
      key: '_id', label: 'Actions', width: '110px',
      render: (_, row) => (
        <div className="flex gap-1 items-center">
          <button onClick={() => setDetailModal({ open: true, record: row })} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="View">
            <FiEye className="text-sm" />
          </button>
          <button onClick={() => setModal({ open: true, mode: 'edit', record: row })} className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600">
            <FiEdit2 className="text-sm" />
          </button>
          <VisitorPDFButton record={row} variant="icon" />
          {isAdmin && (
            <button onClick={() => setConfirm({ open: true, id: row._id })} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500">
              <FiTrash2 className="text-sm" />
            </button>
          )}
        </div>
      )
    }
  ];

  const filterControls = (
    <>
      <select className="form-select w-auto text-xs py-2" value={filters.municipality} onChange={e => { setFilters(f => ({ ...f, municipality: e.target.value })); setPage(1); }}>
        <option value="">All Municipalities</option>
        {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <select className="form-select w-auto text-xs py-2" value={filters.year} onChange={e => { setFilters(f => ({ ...f, year: e.target.value })); setPage(1); }}>
        <option value="">All Years</option>
        {REPORT_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <select className="form-select w-auto text-xs py-2" value={filters.month} onChange={e => { setFilters(f => ({ ...f, month: e.target.value })); setPage(1); }}>
        <option value="">All Months</option>
        {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
      </select>
    </>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
              <FiUsers className="text-emerald-600 text-lg" />
            </div>
            <h1 className="page-title">Visitor Management</h1>
          </div>
          <p className="page-subtitle ml-12">Tarlac Tourism Office – Visitor Records System</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCharts(v => !v)} className="btn-outline text-xs py-2 px-3">
            {showCharts ? 'Hide Charts' : 'Show Charts'}
          </button>
          <button className="btn-primary" onClick={() => setModal({ open: true, mode: 'add', record: null })}>
            <FiPlus /> Add Visitor
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Visitors', value: stats?.total ?? total, icon: FiUsers, color: 'bg-emerald-100 text-emerald-600' },
          { label: 'Male', value: stats?.totalMale ?? '—', icon: FiUser, color: 'bg-blue-100 text-blue-600' },
          { label: 'Female', value: stats?.totalFemale ?? '—', icon: FiUser, color: 'bg-pink-100 text-pink-600' },
          { label: 'Foreign', value: stats?.totalForeign ?? '—', icon: FiGlobe, color: 'bg-amber-100 text-amber-600' }
        ].map(s => (
          <div key={s.label} className="card py-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color} flex-shrink-0`}>
                <s.icon className="text-lg" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {showCharts && (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Monthly trend */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-5 bg-emerald-500 rounded-full" />
              Monthly Visitor Trend
            </h3>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="Local" fill="#059669" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="Foreign" fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="a" />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex items-center justify-center text-gray-300 text-sm">No monthly data yet</div>
            )}
          </div>

          {/* Residence pie */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-5 bg-amber-500 rounded-full" />
              Visitor Distribution by Residence
            </h3>
            {residencePie.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={residencePie} cx="50%" cy="50%" outerRadius={80} dataKey="value" labelLine={false}
                    label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                    {residencePie.map((entry, i) => (
                      <Cell key={i} fill={Object.values(RESIDENCE_COLORS)[i % 4]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex items-center justify-center text-gray-300 text-sm">No residence data yet</div>
            )}
          </div>

          {/* Top spots */}
          {spotData.length > 0 && (
            <div className="card lg:col-span-2">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                Visitors per Tourist Spot (Top 8)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={spotData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} labelFormatter={(_, p) => p?.[0]?.payload?.fullName || ''} />
                  <Bar dataKey="Visitors" fill="#059669" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        totalCount={total}
        page={page}
        limit={LIMIT}
        onPageChange={setPage}
        onSearch={handleSearch}
        searchPlaceholder="Search by name, tourist spot, municipality..."
        emptyText="No visitor records found"
        filters={filterControls}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, mode: 'add', record: null })}
        title={modal.mode === 'add' ? 'Add Visitor Record' : 'Edit Visitor Record'}
        size="lg"
      >
        <VisitorForm initial={modal.record} onSubmit={handleSave} loading={saving} />
      </Modal>

      {/* Detail Modal */}
      {detailModal.record && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetailModal({ open: false, record: null })}>
          <div className="modal-content mx-4 max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 rounded-t-2xl"
              style={{ background: 'linear-gradient(135deg,#065f46,#059669)' }}>
              <div>
                <p className="text-white/70 text-xs uppercase tracking-wider">Visitor Record</p>
                <h2 className="text-white font-bold text-lg">{detailModal.record.firstName} {detailModal.record.lastName}</h2>
                <p className="text-emerald-300 font-mono text-xs mt-0.5">VIS-{detailModal.record.reportYear}-{String(detailModal.record._id).slice(-6).toUpperCase()}</p>
              </div>
              <div className="flex items-center gap-2">
                <VisitorPDFButton record={detailModal.record} variant="button" />
                <button onClick={() => { setDetailModal({ open: false, record: null }); setModal({ open: true, mode: 'edit', record: detailModal.record }); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white/15 hover:bg-white/25 text-white">
                  <FiEdit2 /> Edit
                </button>
                <button onClick={() => setDetailModal({ open: false, record: null })}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/25 flex items-center justify-center text-white">✕</button>
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 gap-x-8 gap-y-4">
              {[
                { label: 'Full Name', value: `${detailModal.record.firstName} ${detailModal.record.lastName}` },
                { label: 'Gender / Age', value: `${detailModal.record.gender}${detailModal.record.age ? ', ' + detailModal.record.age + ' yrs' : ''}` },
                { label: 'Residence', value: detailModal.record.residenceType },
                { label: 'Province / Country', value: detailModal.record.province || detailModal.record.country || '—' },
                { label: 'Nationality', value: detailModal.record.nationality || '—' },
                { label: 'Tourist Spot', value: detailModal.record.touristSpot, wide: true },
                { label: 'Municipality', value: detailModal.record.municipality },
                { label: 'Visit Date', value: formatDate(detailModal.record.visitDate) },
                { label: 'Purpose', value: detailModal.record.purpose },
                { label: 'Group Size', value: detailModal.record.groupSize },
                { label: 'Transportation', value: detailModal.record.transportation },
                { label: 'Stay Duration', value: detailModal.record.stayDuration || '—' },
                { label: 'Est. Spend', value: detailModal.record.estimatedSpend ? '₱' + Number(detailModal.record.estimatedSpend).toLocaleString() : '—' },
                { label: 'Rating', value: detailModal.record.rating ? '★'.repeat(detailModal.record.rating) + '☆'.repeat(5 - detailModal.record.rating) : '—' },
                { label: 'Feedback', value: detailModal.record.feedback || '—', wide: true },
              ].map(f => (
                <div key={f.label} className={f.wide ? 'col-span-2' : ''}>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{f.label}</p>
                  <p className={`text-sm font-semibold ${f.label === 'Rating' ? 'text-amber-400 text-base' : 'text-gray-700'}`}>{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Visitor Record?"
        message="This visitor record will be permanently deleted."
      />
    </div>
  );
}
