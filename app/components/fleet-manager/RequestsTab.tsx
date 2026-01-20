'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useToast } from "@/app/components/toast-provider";
import { FleetRequestDTO } from './types';

interface RequestsTabProps {
  requests: FleetRequestDTO[];
  onRequestsUpdate: (requests: FleetRequestDTO[]) => void;
}

export default function RequestsTab({ requests, onRequestsUpdate }: RequestsTabProps) {
  const { show: toast } = useToast();
  const router = useRouter();
  const [reqLoading, setReqLoading] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifItems, setNotifItems] = useState<FleetRequestDTO[]>([]);
  const [seenIds, setSeenIds] = useState<Record<string, boolean>>({});
  const [selectedRequestIds, setSelectedRequestIds] = useState<number[]>([]);
  const [assignMode, setAssignMode] = useState<'single' | 'multi'>('single');

  const loadRequests = async () => {
    try {
      setReqLoading(true);
      const token = localStorage.getItem('accessToken') || '';
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/fleet/manager/requests/approved`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();
      const arr = (data?.data || data?.items || data) as any;
      const list: FleetRequestDTO[] = Array.isArray(arr) ? arr : [];
      onRequestsUpdate(list);
    } catch (err) {
      console.error('Error fetching approved requests:', err);
      toast({
        title: 'Error',
        description: 'Failed to load approved requests.',
        variant: 'destructive',
      });
    } finally {
      setReqLoading(false);
    }
  };

  // Poll for new requests
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const token = localStorage.getItem('accessToken') || '';
        const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/manager/requests/approved`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const d = await r.json();
        const items: FleetRequestDTO[] = Array.isArray(d?.items) ? d.items : [];
        const approved = items.filter((x: any) => String(x.status).toUpperCase() === 'APPROVED');
        const tripLike = approved.filter((x: any) => {
          const t = String(x.type || '').toUpperCase();
          const c = String(x.category || '').toUpperCase();
          const p = String(x.purpose || x.title || '').toUpperCase();
          return t.includes('TRIP') || c.includes('TRIP') || p.includes('TRIP') || t.includes('VEHICLE') || c.includes('VEHICLE');
        });
        const fresh = tripLike.filter((x: any) => !seenIds[String(x.id)]);
        if (fresh.length > 0) {
          setNotifItems(fresh.slice(0, 5));
          setNotifOpen(true);
          setSeenIds(prev => ({ ...prev, ...Object.fromEntries(fresh.map((f: any) => [String(f.id), true])) }));
        }
      } catch { }
    }, 15000);
    return () => clearInterval(id);
  }, [seenIds]);

  return (
    <div id="requests-section" className="space-y-4">

      {/* Header Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4">

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Approved Trip Requests</h2>
                <p className="text-blue-100 mt-0.5 text-sm">Assign drivers to approved trips</p>
              </div>

            </div>
            <button
              onClick={loadRequests}
              disabled={reqLoading}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 text-sm"
            >
              <svg className={`w-4 h-4 ${reqLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{reqLoading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-blue-100 p-4 text-sm text-gray-700">
        <div className="font-semibold mb-1 text-gray-900">
          የመኪና መመደብ ዘዴዎች
        </div>
        <div className="mt-2 flex items-center space-x-2 text-xs">
          <span className="text-gray-600">መመደቢያ ዓይነት:</span>
          <select
            value={assignMode}
            onChange={(e) => {
              const mode = e.target.value === 'multi' ? 'multi' : 'single';
              setAssignMode(mode);

              // If switching to single mode, clear any multi-selection so user picks one
              if (mode === 'single' && selectedRequestIds.length !== 1) {
                setSelectedRequestIds([]);
              }

              // Update URL to reflect current mode while staying on the same page
              try {
                const url = new URL(window.location.href);
                url.searchParams.set('tab', 'requests');
                url.searchParams.set('mode', mode);
                router.push(url.pathname + url.search);
              } catch {}

              const grid = document.getElementById('fleet-requests-grid');
              if (grid) {
                grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}

            className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="single">ለአንድ ሰዉ መመደቢያ</option>
            <option value="multi">ለብዙ ሰዉ መመደቢያ</option>
          </select>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            የተመረጡ ጥያቄዎች: <span className="font-semibold">{selectedRequestIds.length}</span>
          </div>
          <button
            type="button"
            disabled={
              assignMode === 'single'
                ? selectedRequestIds.length !== 1
                : selectedRequestIds.length < 2
            }
            onClick={() => {
              if (assignMode === 'single') {
                if (selectedRequestIds.length !== 1) return;
                const id = selectedRequestIds[0];
                router.push(`/fleet/manager/assign/${encodeURIComponent(String(id))}`);
              } else {
                if (selectedRequestIds.length < 2) return;
                const query = selectedRequestIds.join(',');
                router.push(`/fleet/manager/assign?requestIds=${encodeURIComponent(query)}`);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              (assignMode === 'single' && selectedRequestIds.length !== 1) ||
              (assignMode === 'multi' && selectedRequestIds.length < 2)
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            የተመረጡን ጥያቄዎች ለሹፌር መመደብ
          </button>
        </div>
      </div>

      {/* Requests Grid */}
      <div
        id="fleet-requests-grid"
        className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4"
      >

        {requests.length === 0 ? (
          <div className="col-span-full">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-1">No Approved Requests</h3>
              <p className="text-gray-400 text-sm">All approved trips have been assigned drivers.</p>

            </div>
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200 group text-sm">
              {/* Status Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[11px] font-semibold text-white">

                    {request.status || 'APPROVED'}
                  </span>
                  <span className="text-white text-xs font-medium">

                    {request.date ? new Date(request.date).toLocaleDateString() : 'No date'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">

                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-500">Request #{request.id}</div>
                  <label className="inline-flex items-center space-x-1 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedRequestIds.includes(Number(request.id))}
                      onChange={() => {
                        const idNum = Number(request.id);
                        if (Number.isNaN(idNum)) return;

                        // In single mode, only one requester can be selected at a time
                        if (assignMode === 'single') {
                          setSelectedRequestIds([idNum]);
                          return;
                        }

                        // In multi mode, toggle selection
                        setSelectedRequestIds(prev =>
                          prev.includes(idNum)
                            ? prev.filter(x => x !== idNum)
                            : [...prev, idNum]
                        );
                      }}
                    />
                    <span>በቡድን ለመመደብ</span>
                  </label>
                </div>

                {/* Requestor Info */}
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">

                      {request.requestor?.firstName?.[0] || 'U'}{request.requestor?.lastName?.[0] || 'S'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">

                      {request.requestor?.firstName || 'Unknown'} {request.requestor?.lastName || 'User'}
                    </h3>
                    <p className="text-xs text-gray-500">{request.department?.name || 'No department'}</p>

                  </div>
                </div>

                {/* Trip Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Purpose</span>
                    <span className="text-xs text-gray-900 capitalize">

                      {request.purpose ? request.purpose.replace('_', ' ') : 'Not specified'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Trip Type</span>
                    <span className="text-xs text-gray-900 capitalize">{request.tripType || 'Not specified'}</span>

                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Destination</span>
                    <span className="text-xs text-gray-900">{request.destination || 'Not specified'}</span>

                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Department</span>
                    <span className="text-xs text-gray-900">{request.department?.name || 'Not specified'}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Link
                    href={`/fleet/manager/assign/${encodeURIComponent(request.id)}`}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2 rounded-lg transition-all duration-200 flex items-center justify-center space-x-1.5 group-hover:shadow-md text-xs"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <span className="font-medium">Assign Driver</span>
                  </Link>

                  <button
                    onClick={() => {
                      console.log('No driver available for request:', request.id);
                      toast({
                        title: "Noted",
                        description: "Marked as no driver available",
                        variant: "default",
                      });
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-all duration-200 flex items-center justify-center space-x-1.5 text-xs"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="font-medium">No Driver</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Real-time Notification Toast */}
      {notifOpen && notifItems.length > 0 && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 max-w-sm">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">New Approved Requests</h4>
                <p className="text-sm text-gray-600">{notifItems.length} new trip(s) need drivers</p>
              </div>
              <button
                onClick={() => setNotifOpen(false)}
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <button
              onClick={() => {
                loadRequests();
                setNotifOpen(false);
              }}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
            >
              View New Requests
            </button>
          </div>
        </div>
      )}
    </div>
  );
}