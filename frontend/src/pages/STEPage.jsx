import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import { MdBusiness } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import RecordDetailModal from '../components/common/RecordDetailModal';
import PDFDownloadButton from '../components/common/PDFDownloadButton';
import ExcelDownloadButton from '../components/common/ExcelDownloadButton';
import STEForm from '../components/forms/STEForm';
import { MUNICIPALITIES, REPORT_YEARS, getBadgeClass } from '../utils/constants';

export default function STEPage() {
  const { isAdmin } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ cityMun: '', year: '' });
  const [modal, setModal] = useState({ open: false, mode: 'add', record: null });
  const [detail, setDetail] = useState({ open: false, record: null });
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const searchTimer = useRef(null);
  const LIMIT = 15;

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (search) params.append('search', search);
      if (filters.cityMun) params.append('cityMun', filters.cityMun);
      if (filters.year) params.append('year', filters.year);
      const { data } = await api.get(`/ste?${params}`);
      setRecords(data.data);
      setTotal(data.total);
    } catch { toast.error('Failed to load records'); }
    finally { setLoading(false); }
  }, [page, search, filters]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleSearch = (val) => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(val); setPage(1); }, 400);
  };

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (modal.mode === 'add') { await api.post('/ste', form); toast.success('Record added!'); }
      else { await api.put(`/ste/${modal.record._id}`, form); toast.success('Record updated!'); }
      setModal({ open: false, mode: 'add', record: null });
      fetchRecords();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/ste/${confirm.id}`);
      toast.success('Record deleted');
      setConfirm({ open: false, id: null });
      fetchRecords();
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  };

  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const columns = [
    { key: 'nameOfEnterprise', label: 'Enterprise Name', sortable: true,
      render: (v, row) => <button className="font-medium text-emerald-700 hover:underline text-left" onClick={() => setDetail({ open: true, record: row })}>{v}</button>
    },
    { key: 'type', label: 'Type', render: v => <span className={getBadgeClass(v)}>{v}</span> },
    { key: 'cityMun', label: 'Municipality', sortable: true },
    { key: 'seatsUnit', label: 'Seats/Units', render: v => v ?? '—' },
    { key: 'totalEmployees', label: 'Employees', render: v => <span className="font-semibold text-emerald-700">{v ?? '—'}</span> },
    { key: 'femaleEmployees', label: 'Female', render: v => v ?? '—' },
    { key: 'maleEmployees', label: 'Male', render: v => v ?? '—' },
    { key: 'reportMonth', label: 'Month', render: v => v ? MONTHS_SHORT[v-1] : '—' },
    { key: 'reportYear', label: 'Year' },
    { key: 'classification', label: 'Classification', render: v => <span className="text-xs text-gray-500">{v || '—'}</span> },
    { key: '_id', label: 'Actions', width: '130px',
      render: (_, row) => (
        <div className="flex gap-1 items-center">
          <button onClick={() => setDetail({ open: true, record: row })} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><FiEye className="text-sm" /></button>
          <button onClick={() => setModal({ open: true, mode: 'edit', record: row })} className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600"><FiEdit2 className="text-sm" /></button>
          <PDFDownloadButton type="ste" record={row} variant="icon" />
          {isAdmin && <button onClick={() => setConfirm({ open: true, id: row._id })} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500"><FiTrash2 className="text-sm" /></button>}
        </div>
      )
    }
  ];

  const filterControls = (
    <>
      <select className="form-select w-auto text-xs py-2" value={filters.cityMun} onChange={e => { setFilters(f => ({ ...f, cityMun: e.target.value })); setPage(1); }}>
        <option value="">All Municipalities</option>
        {MUNICIPALITIES.map(m => <option key={m}>{m}</option>)}
      </select>
      <select className="form-select w-auto text-xs py-2" value={filters.year} onChange={e => { setFilters(f => ({ ...f, year: e.target.value })); setPage(1); }}>
        <option value="">All Years</option>
        {REPORT_YEARS.map(y => <option key={y}>{y}</option>)}
      </select>
    </>
  );

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center"><MdBusiness className="text-amber-600 text-lg" /></div>
            <h1 className="page-title">Tourism Enterprises</h1>
          </div>
          <p className="page-subtitle ml-12">Supply of Tourism Enterprises (STE) — Form STE1</p>
        </div>
        <div className="flex gap-2">
          <ExcelDownloadButton type="ste" municipality={filters.cityMun} year={filters.year} />
          <button className="btn-primary" onClick={() => setModal({ open: true, mode: 'add', record: null })}><FiPlus /> Add Record</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Enterprises', value: total },
          { label: 'This Page', value: records.length },
          { label: 'Enterprise Types', value: [...new Set(records.map(r => r.type).filter(Boolean))].length }
        ].map(s => (
          <div key={s.label} className="card py-4 text-center">
            <p className="text-2xl font-bold font-display text-amber-600">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <DataTable columns={columns} data={records} loading={loading} totalCount={total} page={page} limit={LIMIT}
        onPageChange={setPage} onSearch={handleSearch} searchPlaceholder="Search enterprises..."
        emptyText="No enterprise records found" filters={filterControls} />

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, mode: 'add', record: null })}
        title={modal.mode === 'add' ? 'Add Tourism Enterprise' : 'Edit Tourism Enterprise'} size="lg">
        <STEForm initial={modal.record} onSubmit={handleSave} loading={saving} />
      </Modal>

      <RecordDetailModal isOpen={detail.open} onClose={() => setDetail({ open: false, record: null })}
        type="ste" record={detail.record} onEdit={(rec) => setModal({ open: true, mode: 'edit', record: rec })} />

      <ConfirmDialog isOpen={confirm.open} onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={handleDelete} loading={deleting} title="Delete Enterprise?" message="This enterprise record will be permanently deleted." />
    </div>
  );
}
