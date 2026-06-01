import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * usePDFExport
 * Downloads a PDF for a record using authenticated fetch.
 * Tries backend PDF first (Puppeteer). Falls back to html2pdf.js client-side rendering.
 */
export function usePDFExport(type, record) {
  const [generating, setGenerating] = useState(false);

  const getFilename = useCallback(() => {
    const code = record?.attractionCode ||
      `${type.toUpperCase()}-${String(record?._id || '').slice(-6).toUpperCase()}`;
    const name = (
      record?.nameOfEstablishment || record?.taName || record?.nameOfEnterprise || 'record'
    ).replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').slice(0, 40);
    return `${name}_${code}.pdf`;
  }, [type, record]);

  const getToken = () => localStorage.getItem('token');

  /** Load html2pdf.js from CDN */
  const loadHtml2Pdf = () => new Promise((resolve, reject) => {
    if (window.html2pdf) return resolve(window.html2pdf);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    s.onload = () => resolve(window.html2pdf);
    s.onerror = () => reject(new Error('Failed to load html2pdf.js from CDN'));
    document.head.appendChild(s);
  });

  /** Fetch HTML template and render it client-side with html2pdf */
  const frontendRender = useCallback(async () => {
    const res = await fetch(`/api/export/html/${type}/${record._id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const html = await res.text();

    const h2pdf = await loadHtml2Pdf();

    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:white;z-index:-1;';
    container.innerHTML = html;
    document.body.appendChild(container);

    // Wait for images
    const imgs = container.querySelectorAll('img');
    await Promise.allSettled(Array.from(imgs).map(img =>
      new Promise(r => {
        if (img.complete) return r();
        img.onload = r; img.onerror = r;
        setTimeout(r, 3000);
      })
    ));

    await h2pdf().set({
      margin: 0,
      filename: getFilename(),
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        scrollX: 0,
        scrollY: 0,
      },
      jsPDF: {
        unit: 'px',
        format: 'a4',
        orientation: 'portrait',
        hotfixes: ['px_scaling'],
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    }).from(container.querySelector('.page') || container).save();

    document.body.removeChild(container);
  }, [type, record, getFilename]);

  const downloadPDF = useCallback(async () => {
    if (!record?._id) { toast.error('No record selected'); return; }
    if (generating) return;
    setGenerating(true);

    const toastId = toast.loading('Generating PDF…');
    try {
      // Try backend Puppeteer PDF
      const res = await fetch(`/api/export/pdf/${type}/${record._id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      const contentType = res.headers.get('content-type') || '';

      if (res.ok && contentType.includes('application/pdf')) {
        // ✅ Puppeteer PDF — direct download
        const buf = await res.arrayBuffer();
        const blob = new Blob([buf], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = getFilename(); a.click();
        URL.revokeObjectURL(url);
        toast.success('PDF downloaded!', { id: toastId });
      } else {
        // Backend returned HTML fallback — render client-side
        toast.loading('Rendering PDF in browser…', { id: toastId });
        await frontendRender();
        toast.success('PDF downloaded!', { id: toastId });
      }
    } catch {
      // Last resort: html2pdf fallback
      try {
        toast.loading('Rendering PDF…', { id: toastId });
        await frontendRender();
        toast.success('PDF downloaded!', { id: toastId });
      } catch (e2) {
        toast.error('PDF generation failed: ' + (e2.message || 'Unknown error'), { id: toastId });
      }
    } finally {
      setGenerating(false);
    }
  }, [record, type, generating, getFilename, frontendRender]);

  return { downloadPDF, generating };
}
