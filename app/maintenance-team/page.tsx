import { Suspense } from 'react';
import MaintenanceTeamDashboardClient from './maintenance-team.client';

export default function MaintenanceTeamDashboardPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-600">Loading...</div>}>
      <MaintenanceTeamDashboardClient />
    </Suspense>
  );
}
