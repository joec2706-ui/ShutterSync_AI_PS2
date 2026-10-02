import { useState } from 'react';
import { DOCUMENTS } from '../utils/constants';
import { api } from '../services/api';
import { inr } from '../utils/profile';

/**
 * Document status system: tick "I have it" or upload a PDF/TXT/image.
 * Uploading is optional — eligibility works from the checkboxes alone.
 */
export default function DocumentUploader({ documents, onChange, onApplyExtracted }) {
  const [uploads, setUploads] = useState({});
  const [busy, setBusy] = useState(null);
  const [errors, setErrors] = useState({});

  const toggle = (key, value) => onChange({ ...documents, [key]: value });

  async function handleFile(key, file) {
    if (!file) return;
    setErrors((e) => ({ ...e, [key]: null }));
    if (file.size > 5 * 1024 * 1024) { setErrors((e) => ({ ...e, [key]: 'File is larger than 5 MB.' })); return; }
    setBusy(key);
    try {
      const out = await api.uploadDocument(key, file);
      setUploads((u) => ({ ...u, [key]: out }));
      toggle(key, true);
    } catch (err) {
      setErrors((e) => ({ ...e, [key]: err.message }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {DOCUMENTS.map((d) => {
        const up = uploads[d.key];
        const has = documents[d.key] === true;
        return (
          <li key={d.key} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={has} onChange={(e) => toggle(d.key, e.target.checked)} />
                {d.label}
              </label>
              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${has ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-100 text-slate-600'}`}>
                {up ? '✓ Uploaded' : has ? '✓ Available' : 'Not uploaded'}
              </span>
            </div>
            <div className="mt-2">
              <label className="text-xs text-slate-600">
                <span className="sr-only">Upload {d.label}</span>
                <input type="file" accept=".pdf,.txt,.png,.jpg,.jpeg,application/pdf,text/plain,image/png,image/jpeg" disabled={busy === d.key}
                  onChange={(e) => { handleFile(d.key, e.target.files[0]); e.target.value = ''; }}
                  className="block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-navy-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-navy-800" />
              </label>
              {busy === d.key && <p className="mt-1 text-xs text-slate-600" role="status">Uploading…</p>}
              {errors[d.key] && <p className="field-error" role="alert">{errors[d.key]}</p>}
              {up && (
                <div className="mt-1 text-xs text-slate-700">
                  <p>{up.fileName}</p>
                  {up.extracted && (up.extracted.extractedIncome != null || up.extracted.state) && (
                    <p className="mt-1">
                      Detected{up.extracted.extractedIncome != null ? ` income ${inr(up.extracted.extractedIncome)}` : ''}{up.extracted.state ? ` · ${up.extracted.state}` : ''}{' '}
                      <button type="button" className="font-semibold text-blue-700 underline" onClick={() => onApplyExtracted(up.extracted)}>Use in profile</button>
                    </p>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
