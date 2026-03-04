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
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [endDay, setEndDay] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('regular');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setTitle('');
    setYear('');
    setEndYear('');
    setMonth('');
    setDay('');
    setEndMonth('');
    setEndDay('');
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
          month: month ? Number(month) : null,
          day: day ? Number(day) : null,
          endMonth: endMonth ? Number(endMonth) : null,
          endDay: endDay ? Number(endDay) : null,
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
            className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 flex flex-col gap-4"
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

            {/* Inizio */}
            <fieldset className="flex flex-col gap-1">
              <span className="text-xs font-medium text-stone-500">Inizio *</span>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="Anno"
                  className="border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 w-24"
                />
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="border border-stone-300 rounded-lg px-2 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white flex-1"
                >
                  <option value="">Mese</option>
                  <option value="1">Gen</option>
                  <option value="2">Feb</option>
                  <option value="3">Mar</option>
                  <option value="4">Apr</option>
                  <option value="5">Mag</option>
                  <option value="6">Giu</option>
                  <option value="7">Lug</option>
                  <option value="8">Ago</option>
                  <option value="9">Set</option>
                  <option value="10">Ott</option>
                  <option value="11">Nov</option>
                  <option value="12">Dic</option>
                </select>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="border border-stone-300 rounded-lg px-2 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white w-20"
                >
                  <option value="">Giorno</option>
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                  ))}
                </select>
              </div>
            </fieldset>

            {/* Fine */}
            <fieldset className="flex flex-col gap-1">
              <span className="text-xs font-medium text-stone-500">Fine</span>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                  placeholder="Anno"
                  className="border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 w-24"
                />
                <select
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  className="border border-stone-300 rounded-lg px-2 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white flex-1"
                >
                  <option value="">Mese</option>
                  <option value="1">Gen</option>
                  <option value="2">Feb</option>
                  <option value="3">Mar</option>
                  <option value="4">Apr</option>
                  <option value="5">Mag</option>
                  <option value="6">Giu</option>
                  <option value="7">Lug</option>
                  <option value="8">Ago</option>
                  <option value="9">Set</option>
                  <option value="10">Ott</option>
                  <option value="11">Nov</option>
                  <option value="12">Dic</option>
                </select>
                <select
                  value={endDay}
                  onChange={(e) => setEndDay(e.target.value)}
                  className="border border-stone-300 rounded-lg px-2 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white w-20"
                >
                  <option value="">Giorno</option>
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                  ))}
                </select>
              </div>
            </fieldset>

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
