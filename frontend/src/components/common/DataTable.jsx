import React, { useState } from 'react';
import { FiSearch, FiChevronUp, FiChevronDown, FiChevronsLeft, FiChevronsRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function DataTable({
  columns, data, loading, totalCount, page, limit, onPageChange,
  onSearch, onSort, searchPlaceholder, emptyText, filters
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [search, setSearch] = useState('');

  const handleSort = (key) => {
    if (!key) return;
    const newDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDir(newDir);
    onSort?.(key, newDir);
  };

  const handleSearch = (val) => {
    setSearch(val);
    onSearch?.(val);
  };

  const totalPages = Math.ceil((totalCount || 0) / limit);
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalCount || 0);

  return (
    <div className="card p-0 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 min-w-0">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder={searchPlaceholder || 'Search records...'}
            className="form-input pl-10 w-full"
          />
        </div>
        {filters && <div className="flex gap-2 flex-wrap">{filters}</div>}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="spinner w-8 h-8 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Loading records...</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="text-5xl mb-3">📋</div>
              <p className="text-gray-500 font-medium">{emptyText || 'No records found'}</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={col.sortable ? 'cursor-pointer select-none hover:bg-emerald-900 transition-colors' : ''}
                    style={{ width: col.width }}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && (
                        <span className="opacity-60">
                          {sortKey === col.key
                            ? sortDir === 'asc' ? <FiChevronUp /> : <FiChevronDown />
                            : <FiChevronDown className="opacity-30" />
                          }
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={row._id || i}>
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-700">{start}–{end}</span> of{' '}
            <span className="font-semibold text-gray-700">{totalCount}</span> records
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(1)}
              disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-emerald-100 disabled:opacity-30 disabled:cursor-not-allowed text-emerald-700"
            >
              <FiChevronsLeft />
            </button>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-emerald-100 disabled:opacity-30 disabled:cursor-not-allowed text-emerald-700"
            >
              <FiChevronLeft />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p;
              if (totalPages <= 5) p = i + 1;
              else if (page <= 3) p = i + 1;
              else if (page >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    page === p
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'hover:bg-emerald-100 text-gray-600'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg hover:bg-emerald-100 disabled:opacity-30 disabled:cursor-not-allowed text-emerald-700"
            >
              <FiChevronRight />
            </button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg hover:bg-emerald-100 disabled:opacity-30 disabled:cursor-not-allowed text-emerald-700"
            >
              <FiChevronsRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
