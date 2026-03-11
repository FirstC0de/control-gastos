'use client';

import { useState } from 'react';
import CardManager from './CardManager';
import PDFImporter from './PDFImporter';
import CardSummaryPDF from './CardSummaryPDF';

type Tab = 'summary' | 'import' | 'cards';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'summary', label: 'Resumen',   icon: '📊' },
  { id: 'import',  label: 'Importar',  icon: '📄' },
  { id: 'cards',   label: 'Tarjetas',  icon: '💳' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CardDashboardModal({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('summary');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">💳</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Gestión de tarjetas</h2>
              <p className="text-xs text-slate-400">Importá, revisá y administrá tus tarjetas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'summary' && <CardSummaryPDF />}
          {activeTab === 'import'  && <PDFImporter onClose={onClose} />}
          {activeTab === 'cards'   && <CardManager />}
        </div>
      </div>
    </div>
  );
}