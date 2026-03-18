'use client';

import { useState } from 'react';
import AppShell from '../components/AppShell';
import Dashboard from '../components/Dashboard';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';
import SummaryCard from '../components/SummaryCard';
import CardSummaryPDF from '../components/cards/CardSummaryPDF';
import CardDashboardModal from '../components/cards/CardDashboardModal';
import SavingsDashboardWidget from '../components/savings/SavingsDashboardWidget';

type ModalTab = 'summary' | 'import' | 'cards';

export default function DashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab]   = useState<ModalTab>('summary');

  const openModal = (tab: ModalTab) => {
    setModalTab(tab);
    setModalOpen(true);
  };

  return (
    <AppShell>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6 min-w-0">
          <Dashboard onOpenModal={openModal} />
          <ExpenseForm onOpenImport={() => openModal('import')} onOpenCards={() => openModal('cards')} />
          <ExpenseList />
        </div>
        <div className="xl:col-span-1 space-y-6 min-w-0">
          <SummaryCard />
          <SavingsDashboardWidget />
          <CardSummaryPDF />
        </div>
      </div>
      <CardDashboardModal isOpen={modalOpen} onClose={() => setModalOpen(false)} initialTab={modalTab} />
    </AppShell>
  );
}
