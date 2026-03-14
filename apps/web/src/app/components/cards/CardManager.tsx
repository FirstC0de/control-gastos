'use client';

import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Card } from '@controlados/shared';
import ConfirmModal from '../ui/ConfirmModal';
import { ToastContainer, useToast } from '../ui/Toast';

const CARD_COLORS = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];

export default function CardManager() {
  const { cards, addCard, updateCard, deleteCard } = useFinance();
  const { toasts, show, remove } = useToast();

  const [editing, setEditing]   = useState<Card | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [form, setForm] = useState<Omit<Card, 'id'>>({
    name: '', color: '#6366f1', lastFour: '', closingDay: 15, dueDay: 5,
  });

  const resetForm = () => {
    setForm({ name: '', color: '#6366f1', lastFour: '', closingDay: 15, dueDay: 5 });
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setLoading(true);
    try {
      if (editing) {
        await updateCard(editing.id, form);
        show('Tarjeta actualizada', 'success');
      } else {
        await addCard(form);
        show('Tarjeta agregada', 'success');
      }
      resetForm();
    } catch { show('Error al guardar', 'error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteCard(deletingId);
      show('Tarjeta eliminada', 'warning');
      setDeletingId(null);
    } catch { show('Error al eliminar', 'error'); }
  };

  const inputClass = "w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelClass = "block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5";

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-5">
          {editing ? 'Editar tarjeta' : 'Nueva tarjeta'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nombre *</label>
              <input type="text" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className={inputClass} placeholder="Visa Galicia" required />
            </div>
            <div>
              <label className={labelClass}>Últimos 4 dígitos</label>
              <input type="text" value={form.lastFour || ''}
                onChange={e => setForm({ ...form, lastFour: e.target.value.slice(0, 4) })}
                className={inputClass} placeholder="1234" maxLength={4} />
            </div>
            <div>
              <label className={labelClass}>Día de cierre</label>
              <input type="number" value={form.closingDay}
                onChange={e => setForm({ ...form, closingDay: Number(e.target.value) })}
                className={inputClass} min={1} max={31} />
            </div>
            <div>
              <label className={labelClass}>Día de vencimiento</label>
              <input type="number" value={form.dueDay}
                onChange={e => setForm({ ...form, dueDay: Number(e.target.value) })}
                className={inputClass} min={1} max={31} />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className={labelClass}>Color</label>
            <div className="flex gap-2 flex-wrap">
              {CARD_COLORS.map(color => (
                <button key={color} type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    form.color === color ? 'border-slate-800 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl p-4 text-white flex justify-between items-center"
            style={{ background: `linear-gradient(135deg, ${form.color}, ${form.color}99)` }}>
            <div>
              <p className="text-xs opacity-70 mb-1">Tarjeta</p>
              <p className="font-semibold">{form.name || 'Nombre tarjeta'}</p>
            </div>
            {form.lastFour && (
              <p className="text-sm font-mono opacity-80">•••• {form.lastFour}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {editing && (
              <button type="button" onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                Cancelar
              </button>
            )}
            <button type="submit" disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 transition-colors">
              {loading ? 'Guardando...' : editing ? 'Actualizar' : 'Agregar tarjeta'}
            </button>
          </div>
        </form>

        {/* Lista de tarjetas */}
        {cards.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Tus tarjetas</h3>
            {cards.map(card => (
              <div key={card.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-5 rounded" style={{ backgroundColor: card.color }} />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{card.name}</p>
                    <p className="text-xs text-slate-400">
                      {card.lastFour && `•••• ${card.lastFour} · `}
                      Cierre día {card.closingDay} · Vence día {card.dueDay}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(card); setForm({ name: card.name, color: card.color, lastFour: card.lastFour, closingDay: card.closingDay, dueDay: card.dueDay }); }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-xs">✏️</button>
                  <button onClick={() => setDeletingId(card.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-xs">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal isOpen={!!deletingId} title="Eliminar tarjeta"
        message="¿Eliminar esta tarjeta? Los gastos asociados quedarán sin tarjeta."
        confirmLabel="Eliminar" danger
        onConfirm={handleDelete} onCancel={() => setDeletingId(null)} />
      <ToastContainer toasts={toasts} onRemove={remove} />
    </>
  );
}