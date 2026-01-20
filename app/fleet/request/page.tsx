import { Suspense } from 'react';
import VehicleAssignmentRequestClient from './VehicleAssignmentRequestClient';

export default function VehicleAssignmentRequestPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-600">Loading vehicle request...</div>}>
      <VehicleAssignmentRequestClient />
    </Suspense>
  );
}