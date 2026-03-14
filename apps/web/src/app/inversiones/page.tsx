'use client';

import { Suspense } from 'react';
import AppShell from '../components/AppShell';
import InversionesOverview from '../components/inversiones/InversionesOverview';

export default function InversionesPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="text-slate-400 text-sm">Cargando...</div>}>
        <InversionesOverview />
      </Suspense>
    </AppShell>
  );
}
