'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Visibility } from '@/lib/types';

interface Props {
  parentId: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateEventModal({ parentId, open, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('regular');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setTitle('');
    setYear('');
    setEndYear('');
    setVisibility('regular');
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Titolo obbligatorio');
      return;
    }
    if (!year || isNaN(Number(year))) {
      setError('Anno obbligatorio');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          year: Number(year),
          endYear: endYear ? Number(endYear) : null,
          visibility,
          parent: parentId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Errore durante il salvataggio');
        return;
      }

      // Brief delay for DatoCMS CDA propagation after CMA publish
      await new Promise((r) => setTimeout(r, 1500));
      reset();
      onClose();
      onCreated();
    } catch {
      setError('Errore di rete');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />

          {/* Modal */}
          <motion.form
            onSubmit={handleSubmit}
            className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 flex flex-col gap-4"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <h2 className="text-lg font-semibold text-stone-800">Nuovo evento</h2>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-stone-500">Titolo *</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
                autoFocus
              />
            </label>

            <div className="flex gap-3">
              <label className="flex flex-col gap-1 flex-1">
                <span className="text-xs font-medium text-stone-500">Anno inizio *</span>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
              </label>
              <label className="flex flex-col gap-1 flex-1">
                <span className="text-xs font-medium text-stone-500">Anno fine</span>
                <input
                  type="number"
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                  className="border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-stone-500">Visibilit&agrave;</span>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as Visibility)}
                className="border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
              >
                <option value="regular">Regular</option>
                <option value="main">Main</option>
                <option value="super">Super</option>
              </select>
            </label>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => { reset(); onClose(); }}
                className="px-4 py-2 text-sm text-stone-600 hover:text-stone-800 transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-stone-800 rounded-lg hover:bg-stone-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
