import { Suspense } from 'react';
import FleetManagerClient from './FleetManagerClient';

export default function FleetManagerPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-600">Loading fleet manager...</div>}>
      <FleetManagerClient />
    </Suspense>
  );
}