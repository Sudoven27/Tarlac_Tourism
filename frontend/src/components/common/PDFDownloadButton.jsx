import React from 'react';
import { FiDownload, FiLoader } from 'react-icons/fi';
import { usePDFExport } from '../../hooks/usePDFExport';

/**
 * PDFDownloadButton
 *
 * Props:
 *   type     - 'sae' | 'sta' | 'ste'
 *   record   - full record object
 *   variant  - 'button' (default) | 'icon' | 'menu-item'
 *   size     - 'sm' | 'md' (default)
 */
export default function PDFDownloadButton({ type, record, variant = 'button', size = 'md' }) {
  const { downloadPDF, generating } = usePDFExport(type, record);

  if (variant === 'icon') {
    return (
      <button
        onClick={e => { e.stopPropagation(); downloadPDF(); }}
        disabled={generating}
        title="Download PDF"
        className={`
          p-1.5 rounded-lg transition-all duration-200
          ${generating
            ? 'bg-amber-50 text-amber-400 cursor-not-allowed'
            : 'hover:bg-amber-100 text-amber-600 hover:text-amber-700'
          }
        `}
      >
        {generating
          ? <FiLoader className="text-sm animate-spin" />
          : <FiDownload className="text-sm" />
        }
      </button>
    );
  }

  if (variant === 'menu-item') {
    return (
      <button
        onClick={downloadPDF}
        disabled={generating}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-amber-50 text-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {generating
          ? <FiLoader className="text-base animate-spin flex-shrink-0" />
          : <FiDownload className="text-base flex-shrink-0" />
        }
        {generating ? 'Generating PDF…' : 'Download as PDF'}
      </button>
    );
  }

  // Default: full button
  const sizeClass = size === 'sm'
    ? 'px-3 py-1.5 text-xs gap-1.5'
    : 'px-4 py-2 text-sm gap-2';

  return (
    <button
      onClick={downloadPDF}
      disabled={generating}
      className={`
        inline-flex items-center font-semibold rounded-xl transition-all duration-200
        ${sizeClass}
        ${generating
          ? 'bg-amber-100 text-amber-500 cursor-not-allowed'
          : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow-md'
        }
      `}
      style={generating ? {} : { boxShadow: '0 2px 8px rgba(217,119,6,0.3)' }}
    >
      {generating ? (
        <>
          <FiLoader className="animate-spin flex-shrink-0" />
          Generating…
        </>
      ) : (
        <>
          <FiDownload className="flex-shrink-0" />
          Download PDF
        </>
      )}
    </button>
  );
}
