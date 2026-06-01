import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import { MdHotel } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import RecordDetailModal from '../components/common/RecordDetailModal';
import PDFDownloadButton from '../components/common/PDFDownloadButton';
import ExcelDownloadButton from '../components/common/ExcelDownloadButton';
import SAEForm from '../components/forms/SAEForm';
import { MUNICIPALITIES, REPORT_YEARS, formatDate, getBadgeClass } from '../utils/constants';

export default function SAEPage() {
  const { isAdmin } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ municipality: '', year: '' });
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
      if (filters.municipality) params.append('municipality', filters.municipality);
      if (filters.year) params.append('year', filters.year);
      const { data } = await api.get(`/sae?${params}`);
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
      // Map cityMun → municipality for backend compatibility
      const payload = { ...form, municipality: form.cityMun || form.municipality };
      if (modal.mode === 'add') { await api.post('/sae', payload); toast.success('Record added!'); }
      else { await api.put(`/sae/${modal.record._id}`, payload); toast.success('Record updated!'); }
      setModal({ open: false, mode: 'add', record: null });
      fetchRecords();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/sae/${confirm.id}`);
      toast.success('Record deleted');
      setConfirm({ open: false, id: null });
      fetchRecords();
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  };

  const columns = [
    { key: 'nameOfEstablishment', label: 'Establishment Name', sortable: true,
      render: (v, row) => (
        <button className="font-medium text-emerald-700 hover:underline text-left" onClick={() => setDetail({ open: true, record: row })}>{v}</button>
      )
    },
    { key: 'typeCode', label: 'Type', render: v => <span className={getBadgeClass(v)}>{v}</span> },
    { key: 'cityMun', label: 'Municipality', sortable: true, render: (v, row) => v || row.municipality },
    { key: 'noOfRooms', label: 'Rooms', render: v => <span className="font-semibold text-emerald-700">{v ?? '—'}</span> },
    { key: 'noOfEmployees', label: 'Employees', render: v => v ?? '—' },
    { key: 'femaleEmployees', label: 'Female', render: v => v ?? '—' },
    { key: 'maleEmployees', label: 'Male', render: v => v ?? '—' },
    { key: 'reportYear', label: 'Year' },
    { key: '_id', label: 'Actions', width: '130px',
      render: (_, row) => (
        <div className="flex gap-1 items-center">
          <button onClick={() => setDetail({ open: true, record: row })} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="View"><FiEye className="text-sm" /></button>
          <button onClick={() => setModal({ open: true, mode: 'edit', record: row })} className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600" title="Edit"><FiEdit2 className="text-sm" /></button>
          <PDFDownloadButton type="sae" record={row} variant="icon" />
          {isAdmin && <button onClick={() => setConfirm({ open: true, id: row._id })} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500" title="Delete"><FiTrash2 className="text-sm" /></button>}
        </div>
      )
    }
  ];

  const filterControls = (
    <>
      <select className="form-select w-auto text-xs py-2" value={filters.municipality} onChange={e => { setFilters(f => ({ ...f, municipality: e.target.value })); setPage(1); }}>
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
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center"><MdHotel className="text-emerald-600 text-lg" /></div>
            <h1 className="page-title">Accommodation Establishments</h1>
          </div>
          <p className="page-subtitle ml-12">Supply of Accommodation Establishments (SAE) — Form SAE1</p>
        </div>
        <div className="flex gap-2">
          <ExcelDownloadButton type="sae" municipality={filters.municipality} year={filters.year} />
          <button className="btn-primary" onClick={() => setModal({ open: true, mode: 'add', record: null })}><FiPlus /> Add Record</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Records', value: total, color: 'emerald' },
          { label: 'This Page', value: records.length, color: 'gold' },
          { label: 'Total Rooms', value: records.reduce((s, r) => s + (r.noOfRooms || 0), 0), color: 'emerald' }
        ].map(s => (
          <div key={s.label} className="card py-4 text-center">
            <p className={`text-2xl font-bold font-display ${s.color === 'gold' ? 'text-amber-600' : 'text-emerald-700'}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <DataTable columns={columns} data={records} loading={loading} totalCount={total} page={page} limit={LIMIT}
        onPageChange={setPage} onSearch={handleSearch} searchPlaceholder="Search by name, municipality, type..."
        emptyText="No accommodation records found" filters={filterControls} />

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, mode: 'add', record: null })}
        title={modal.mode === 'add' ? 'Add Accommodation Establishment' : 'Edit Accommodation Establishment'} size="lg">
        <SAEForm initial={modal.record ? { ...modal.record, cityMun: modal.record.cityMun || modal.record.municipality } : null} onSubmit={handleSave} loading={saving} />
      </Modal>

      <RecordDetailModal isOpen={detail.open} onClose={() => setDetail({ open: false, record: null })}
        type="sae" record={detail.record} onEdit={(rec) => setModal({ open: true, mode: 'edit', record: rec })} />

      <ConfirmDialog isOpen={confirm.open} onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={handleDelete} loading={deleting} title="Delete Record?" message="This accommodation record will be permanently deleted." />
    </div>
  );
}
