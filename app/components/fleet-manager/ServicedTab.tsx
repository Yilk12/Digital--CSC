'use client';

import { useState, useEffect } from 'react';

const APPROVAL_ROLES = [
  'Mechanic / Technician',
  'Service Supervisor',
  'Fleet Manager',
] as const;

type ApprovalRole = typeof APPROVAL_ROLES[number];

interface PartRow {
  partName: string;
  quantity: string;
  cost: string;
  remarks: string;
}

interface ApprovalRow {
  role: ApprovalRole;
  name: string;
  signature: string;
  date: string;
}

interface ServicedHistoryRow {
  parts: PartRow[];
  laborCost: string;
  partsCost: string;
  totalCost: string;
  nextServiceKm: string;
  nextServiceDate: string;
  approvals: ApprovalRow[];
  savedAt: string;
}

export default function ServicedTab() {
  const [history, setHistory] = useState<ServicedHistoryRow[]>([]);

  // Load persisted service registrations created from /fleet/service-time
  async function loadHistory() {
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken') ||
            localStorage.getItem('jwt') ||
            localStorage.getItem('token')
          : null;

      const res = await fetch('/api/fleet/service-registrations', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        console.error('Failed to load service registrations', await res.text());
        return;
      }

      const data = await res.json();
      const items: any[] = Array.isArray(data) ? data : data?.items || data?.data || [];

      // Only show service registrations that have been completed/approved.
      const completed = items.filter((r) => {
        if (!r) return false;
        const raw = (r.status || 'PENDING').toString().toUpperCase();
        return raw === 'COMPLETED' || raw === 'APPROVED';
      });

      const mapped: ServicedHistoryRow[] = completed.map((r) => ({
        parts: [],
        laborCost: '',
        partsCost: '',
        totalCost: '',
        // Use odometerKm as the KM value at time of service completion.
        nextServiceKm: String(r.odometerKm ?? ''),
        // Use serviceEnd or reachedDate5000 as the "next service" reference date.
        nextServiceDate: r.serviceEnd
          ? new Date(r.serviceEnd).toISOString().slice(0, 10)
          : r.reachedDate5000
            ? new Date(r.reachedDate5000).toISOString().slice(0, 10)
            : '',
        approvals: [],
        savedAt: r.updatedAt || r.serviceEnd || r.createdAt || new Date().toISOString(),
      }));

      setHistory(mapped);
    } catch (err) {
      console.error('Error loading service records history', err);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const parts: PartRow[] = [0, 1, 2].map(i => ({
      partName: (fd.get(`partName_${i}`) as string | null) || '',
      quantity: (fd.get(`quantity_${i}`) as string | null) || '',
      cost: (fd.get(`cost_${i}`) as string | null) || '',
      remarks: (fd.get(`remarks_${i}`) as string | null) || '',
    })).filter(p => p.partName || p.quantity || p.cost || p.remarks);

    const approvals: ApprovalRow[] = APPROVAL_ROLES.map(role => {
      const slug = role.replace(/\s+/g, '_').toLowerCase();
      return {
        role,
        name: (fd.get(`approval_${slug}_name`) as string | null) || '',
        signature: (fd.get(`approval_${slug}_signature`) as string | null) || '',
        date: (fd.get(`approval_${slug}_date`) as string | null) || '',
      };
    });

    const row: ServicedHistoryRow = {
      parts,
      laborCost: (fd.get('laborCost') as string | null) || '',
      partsCost: (fd.get('partsCost') as string | null) || '',
      totalCost: (fd.get('totalMaintenanceCost') as string | null) || '',
      nextServiceKm: (fd.get('nextServiceKm') as string | null) || '',
      nextServiceDate: (fd.get('nextServiceDate') as string | null) || '',
      approvals,
      savedAt: new Date().toISOString(),
    };

    setHistory(prev => [row, ...prev]);
    form.reset();
  }

  useEffect(() => {
    loadHistory();
  }, []);

  function formatDate(d: string) {
    if (!d) return '';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleString('en-GB');
  }

  return (
    <div className="bg-white rounded-lg shadow border">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-medium text-gray-900">ሰርቪስ የተደረገ መኪና መመዝገቢያ ቅፅ</h3>
        <p className="text-sm text-gray-600 mt-1">
          Register details of maintenance already performed on a vehicle: work done, parts, costs, approvals and next service.
        </p>
      </div>
      <div className="p-6 text-sm text-gray-800">
        <form className="space-y-6 max-w-4xl" onSubmit={handleSubmit}>
          {/* 5. Maintenance Performed */}
          <section className="space-y-3">
            <h4 className="font-semibold text-gray-900">5. Maintenance Performed (Mechanic Section)<span className="text-red-500 ml-1">*</span></h4>

            <p className="text-xs text-gray-600">Tick all maintenance activities that were completed and add short remarks.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {["Engine oil change", "Oil filter replacement", "Air filter cleaning / replacement", "Tire rotation", "Transmission check", "Brake check / adjustment", "Coolant check / top-up", "Battery check", "General inspection"].map(label => (
                <label key={label} className="flex flex-col border rounded p-3 bg-gray-50">
                  <span className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="font-medium text-gray-800 text-xs md:text-sm">{label}</span>
                  </span>
                  <input
                    placeholder="Remarks"
                    className="mt-2 w-full border rounded px-2 py-1 text-xs"
                  />
                </label>
              ))}

              <label className="flex flex-col border rounded p-3 bg-gray-50 md:col-span-2">
                <span className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="font-medium text-gray-800 text-xs md:text-sm">Other</span>
                </span>
                <input
                  placeholder="Describe other maintenance performed"
                  className="mt-2 w-full border rounded px-2 py-1 text-xs"
                />
              </label>
            </div>
          </section>

          {/* 6. Parts Replaced */}
          <section className="space-y-3">
            <h4 className="font-semibold text-gray-900">6. Parts Replaced (If Any)<span className="text-red-500 ml-1">*</span></h4>

            <p className="text-xs text-gray-600">Record each part with quantity, cost and remarks.</p>
            <table className="w-full text-xs border rounded overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left border">Part Name<span className="text-red-500 ml-0.5">*</span></th>
                  <th className="px-2 py-1 text-left border">Quantity<span className="text-red-500 ml-0.5">*</span></th>
                  <th className="px-2 py-1 text-left border">Cost<span className="text-red-500 ml-0.5">*</span></th>
                  <th className="px-2 py-1 text-left border">Remarks<span className="text-red-500 ml-0.5">*</span></th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2].map(i => (
                  <tr key={i}>
                    <td className="border px-2 py-1"><input name={`partName_${i}`} className="w-full border-none focus:outline-none text-xs" /></td>
                    <td className="border px-2 py-1"><input name={`quantity_${i}`} className="w-full border-none focus:outline-none text-xs" /></td>
                    <td className="border px-2 py-1"><input name={`cost_${i}`} className="w-full border-none focus:outline-none text-xs" /></td>
                    <td className="border px-2 py-1"><input name={`remarks_${i}`} className="w-full border-none focus:outline-none text-xs" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* 7. Service Cost Summary */}
          <section className="space-y-3">
            <h4 className="font-semibold text-gray-900">7. Service Cost Summary<span className="text-red-500 ml-1">*</span></h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Labor Cost<span className="text-red-500 ml-0.5">*</span></label>

                <input name="laborCost" className="mt-1 w-full border rounded px-2 py-1 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Parts Cost<span className="text-red-500 ml-0.5">*</span></label>

                <input name="partsCost" className="mt-1 w-full border rounded px-2 py-1 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Total Maintenance Cost<span className="text-red-500 ml-0.5">*</span></label>

                <input name="totalMaintenanceCost" className="mt-1 w-full border rounded px-2 py-1 text-xs" />
              </div>
            </div>
          </section>

          {/* 8. Approvals */}
          <section className="space-y-3">
            <h4 className="font-semibold text-gray-900">8. Approvals</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {APPROVAL_ROLES.map(role => {
                const slug = role.replace(/\s+/g, '_').toLowerCase();
                return (
                  <div key={role} className="border rounded p-3 text-xs">
                    <h5 className="font-semibold mb-2">{role}</h5>
                    <label className="block text-[11px] text-gray-700">Name<span className="text-red-500 ml-0.5">*</span></label>

                    <input name={`approval_${slug}_name`} className="mt-1 w-full border rounded px-2 py-1 text-[11px]" />
                    <label className="block text-[11px] text-gray-700 mt-2">Date<span className="text-red-500 ml-0.5">*</span></label>

                    <input name={`approval_${slug}_date`} type="date" className="mt-1 w-full border rounded px-2 py-1 text-[11px]" />
                  </div>
                );
              })}
            </div>
          </section>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" className="px-4 py-2 rounded border text-xs">Reset</button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
            >
              Save Record (UI Only)
            </button>
          </div>
        </form>
        <div className="mt-8">
          <h4 className="text-md font-medium text-gray-900 mb-3">
            Service Records History
            {history.length > 0 && (
              <span className="ml-2 text-sm text-gray-600">({history.length} records)</span>
            )}
          </h4>

          <div className="overflow-x-auto text-xs">
            <table className="min-w-full border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border px-2 py-1 text-left">#</th>
                  <th className="border px-2 py-1 text-left">Saved At</th>
                  <th className="border px-2 py-1 text-left">Labor Cost</th>
                  <th className="border px-2 py-1 text-left">Parts Cost</th>
                  <th className="border px-2 py-1 text-left">Total Cost</th>
                  <th className="border px-2 py-1 text-left">Next Service (KM)</th>
                  <th className="border px-2 py-1 text-left">Next Service Date</th>
                  <th className="border px-2 py-1 text-left">Parts Detail</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td className="border px-2 py-3 text-center text-gray-500" colSpan={8}>
                      No service records saved in this session.
                    </td>
                  </tr>
                ) : (
                  history.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 align-top">
                      <td className="border px-2 py-1">{history.length - index}</td>
                      <td className="border px-2 py-1 whitespace-nowrap">{formatDate(row.savedAt)}</td>
                      <td className="border px-2 py-1">{row.laborCost || '-'}</td>
                      <td className="border px-2 py-1">{row.partsCost || '-'}</td>
                      <td className="border px-2 py-1">{row.totalCost || '-'}</td>
                      <td className="border px-2 py-1">{row.nextServiceKm || '-'}</td>
                      <td className="border px-2 py-1 whitespace-nowrap">{row.nextServiceDate || '-'}</td>
                      <td className="border px-2 py-1 whitespace-pre-wrap">
                        {row.parts.length === 0
                          ? '-'
                          : row.parts.map((p, i) => (
                              <div key={i} className="mb-1 last:mb-0">
                                <span className="font-semibold">{p.partName || 'Part'}:</span>{' '}
                                {p.quantity && <span>Qty {p.quantity}; </span>}
                                {p.cost && <span>Cost {p.cost}; </span>}
                                {p.remarks && <span>Notes: {p.remarks}</span>}
                              </div>
                            ))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}