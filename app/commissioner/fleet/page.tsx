"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
} from "chart.js";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import { Eye } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface FleetOverview {
  totalVehicles: number;
  vehiclesWithDrivers: number;
  vehiclesWithoutDrivers: number;
  totalMaintained: number;
  totalMaintenanceCost: number;
  totalIncidents: number;
  activeIncidents: number;
  utilizationRate: number;
  averageTripsPerVehicle: number;
}

interface VehicleStats {
  totalVehicles: number;
  vehiclesWithDrivers: number;
  vehiclesWithoutDrivers: number;
  vehiclesByType: any[];
  newVehicles: number;
  usedVehicles: number;
  driverAssignmentRate: number;
}

interface MaintenanceStats {
  totalMaintained: number;
  totalMaintenanceCost: number;
  avgMaintenanceCost: number;
  recentMaintenance: number;
  maintenanceByStatus: any[];
}

interface IncidentStats {
  totalIncidents: number;
  activeIncidents: number;
  resolvedIncidents: number;
  incidentsByType: any[];
  resolutionRate: number;
  avgResolutionDays: number;
}

interface CostData {
  id: string;
  date: string;
  vehicleId: string;
  category: string;
  amount: string;
  currency: string;
  reference: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  vehicle: {
    id: string;
    plate: string;
    make: string;
    model: string;
    year: number;
    userId: string | null;
    reqId: string | null;
    createdAt: string;
    type: string;
  };
}

export default function CommissionerFleetPage() {
  const [fleetOverview, setFleetOverview] = useState<FleetOverview | null>(null);
  const [vehicleStats, setVehicleStats] = useState<VehicleStats | null>(null);
  const [maintenanceStats, setMaintenanceStats] = useState<MaintenanceStats | null>(null);
  const [incidentStats, setIncidentStats] = useState<IncidentStats | null>(null);
  const [utilizationStats, setUtilizationStats] = useState<any>(null);
  const [maintenanceAnalytics, setMaintenanceAnalytics] = useState<any>(null);
  const [costAnalysis, setCostAnalysis] = useState<any>(null);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [costData, setCostData] = useState<CostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [reportExportFormat, setReportExportFormat] = useState<"excel" | "word" | "pdf">("excel");

  const fetchReports = useCallback(async () => {
      setLoading(true);
      setError("");
      
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("accessToken") ||
              localStorage.getItem("jwt") ||
              localStorage.getItem("token")
            : null;

        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const baseUrl = process.env.NEXT_PUBLIC_API_URL;

        const [
          overviewRes,
          vehicleRes,
          maintenanceRes,
          incidentRes,
          utilizationRes,
          analyticsRes,
          costRes,
          healthRes,
          costsRes
        ] = await Promise.all([
          fetch(`${baseUrl}/api/fleet/overview`, { headers }),
          fetch(`${baseUrl}/api/fleet/vehicle-stats`, { headers }),
          fetch(`${baseUrl}/api/fleet/maintenance-stats`, { headers }),
          fetch(`${baseUrl}/api/fleet/incident-stats`, { headers }),
          fetch(`${baseUrl}/api/fleet/utilization-stats`, { headers }),
          fetch(`${baseUrl}/api/fleet/maintenance-analytics`, { headers }),
          fetch(`${baseUrl}/api/fleet/cost-analysis`, { headers }),
          fetch(`${baseUrl}/api/fleet/health-score`, { headers }),
          fetch(`${baseUrl}/api/fleet/costs`, { headers })
        ]);

        if (!overviewRes.ok) throw new Error('Failed to load fleet reports');

        const [
          overviewData,
          vehicleData,
          maintenanceData,
          incidentData,
          utilizationData,
          analyticsData,
          costData,
          healthData,
          costsData
        ] = await Promise.all([
          overviewRes.json(),
          vehicleRes.json(),
          maintenanceRes.json(),
          incidentRes.json(),
          utilizationRes.json(),
          analyticsRes.json(),
          costRes.json(),
          healthRes.json(),
          costsRes.json()
        ]);

        setFleetOverview(overviewData);
        setVehicleStats(vehicleData);
        setMaintenanceStats(maintenanceData);
        setIncidentStats(incidentData);
        setUtilizationStats(utilizationData);
        setMaintenanceAnalytics(analyticsData);
        setCostAnalysis(costData);
        setHealthScore(healthData);
        setCostData(costsData);

      } catch (err: any) {
        console.error('Failed to fetch fleet reports:', err);
        setError(err?.message || 'Failed to load fleet reports');
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("role") || localStorage.getItem("userRole");
      setRole(storedRole);
    }
  }, []);

  // Calculate total cost registration amount
  const totalCostRegistrationAmount = costData.reduce((total, cost) => {
    return total + parseFloat(cost.amount);
  }, 0);

  // Prepare category-amount data for the graph
  const categoryAmountData = costData.reduce((acc, cost) => {
    const category = cost.category || 'Uncategorized';
    const amount = parseFloat(cost.amount);
    
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += amount;
    
    return acc;
  }, {} as Record<string, number>);

  // Analytics summary rows for tabular report
  const analyticsReportRows = [
    {
      metric: "Total Vehicles",
      value: (fleetOverview?.totalVehicles || 0).toString(),
      details: `${fleetOverview?.vehiclesWithDrivers || 0} with drivers` ,
    },
    {
      metric: "Maintenance Cost",
      value: `ETB ${(fleetOverview?.totalMaintenanceCost || 0).toLocaleString()}`,
      details: `${fleetOverview?.totalMaintained || 0} maintained`,
    },
    {
      metric: "Cost Registration",
      value: `ETB ${totalCostRegistrationAmount.toLocaleString()}`,
      details: `${costData.length} cost entries`,
    },
    {
      metric: "Active Incidents",
      value: (fleetOverview?.activeIncidents || 0).toString(),
      details: `${fleetOverview?.totalIncidents || 0} total`,
    },
    {
      metric: "Driver Assignment Rate",
      value: `${vehicleStats?.driverAssignmentRate || 0}%`,
      details: `${vehicleStats?.vehiclesWithDrivers || 0} with drivers, ${vehicleStats?.vehiclesWithoutDrivers || 0} without`,
    },
    {
      metric: "Utilization Rate",
      value: `${fleetOverview?.utilizationRate || 0}%`,
      details: `Avg trips/vehicle: ${fleetOverview?.averageTripsPerVehicle || 0}`,
    },
    {
      metric: "Resolution Rate",
      value: `${incidentStats?.resolutionRate || 0}%`,
      details: `${incidentStats?.resolvedIncidents || 0} resolved incidents`,
    },
    {
      metric: "Cost Categories",
      value: Object.keys(categoryAmountData).length.toString(),
      details: Object.keys(categoryAmountData).join(", ") || "-",
    },
  ].filter(row => row.value !== undefined);

  // Export helpers for analytics report table
  const exportAnalyticsExcel = () => {
    if (typeof window === "undefined") return;
    if (!analyticsReportRows.length) return;

    const header = ["Metric", "Value", "Details"];
    const csvLines = [
      header.join(","),
      ...analyticsReportRows.map(r => [
        `"${r.metric.replace(/"/g, '""')}"`,
        `"${r.value.replace(/"/g, '""')}"`,
        `"${(r.details || "").replace(/"/g, '""')}"`,
      ].join(",")),
    ];

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fleet-analytics-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAnalyticsWord = () => {
    if (typeof window === "undefined") return;
    if (!analyticsReportRows.length) return;

    const headerHtml = `
      <tr>
        <th style="border:1px solid #ccc;padding:4px;text-align:left;">Metric</th>
        <th style="border:1px solid #ccc;padding:4px;text-align:left;">Value</th>
        <th style="border:1px solid #ccc;padding:4px;text-align:left;">Details</th>
      </tr>`;

    const rowsHtml = analyticsReportRows
      .map(r => `
        <tr>
          <td style="border:1px solid #ccc;padding:4px;">${r.metric}</td>
          <td style="border:1px solid #ccc;padding:4px;">${r.value}</td>
          <td style="border:1px solid #ccc;padding:4px;">${r.details || ""}</td>
        </tr>`)
      .join("");

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8" /></head><body>
      <h2>Fleet Management Analytics Report</h2>
      <table style="border-collapse:collapse;width:100%;font-family:Arial, sans-serif;font-size:12px;">
        ${headerHtml}${rowsHtml}
      </table>
    </body></html>`;

    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fleet-analytics-${new Date().toISOString().slice(0,10)}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAnalyticsPdf = () => {
    if (typeof window === "undefined") return;
    if (!analyticsReportRows.length) return;

    const headerHtml = `
      <tr>
        <th style="border:1px solid #ccc;padding:4px;text-align:left;">Metric</th>
        <th style="border:1px solid #ccc;padding:4px;text-align:left;">Value</th>
        <th style="border:1px solid #ccc;padding:4px;text-align:left;">Details</th>
      </tr>`;

    const rowsHtml = analyticsReportRows
      .map(r => `
        <tr>
          <td style="border:1px solid #ccc;padding:4px;">${r.metric}</td>
          <td style="border:1px solid #ccc;padding:4px;">${r.value}</td>
          <td style="border:1px solid #ccc;padding:4px;">${r.details || ""}</td>
        </tr>`)
      .join("");

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8" /><title>Fleet Analytics Report</title></head><body>
      <h2>Fleet Management Analytics Report</h2>
      <table style="border-collapse:collapse;width:100%;font-family:Arial, sans-serif;font-size:12px;">
        ${headerHtml}${rowsHtml}
      </table>
    </body></html>`;

    const win = window.open("", "_blank", "width=1024,height=768");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleAnalyticsExport = () => {
    if (reportExportFormat === "excel") return exportAnalyticsExcel();
    if (reportExportFormat === "word") return exportAnalyticsWord();
    if (reportExportFormat === "pdf") return exportAnalyticsPdf();
  };

  // Chart data configurations
  const categoryAmountChartData = {
    labels: Object.keys(categoryAmountData),
    datasets: [
      {
        label: "Cost Amount (ETB)",
        data: Object.values(categoryAmountData),
        backgroundColor: [
          '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
          '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#64748b',
          '#14b8a6', '#f43f5e', '#84cc16', '#d946ef', '#0ea5e9'
        ],
        borderColor: [
          '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed',
          '#0891b2', '#65a30d', '#ea580c', '#db2777', '#475569'
        ],
        borderWidth: 2,
      },
    ],
  };

  const vehiclesByTypeData = vehicleStats ? {
    labels: vehicleStats.vehiclesByType.map(v => {
      const type = v.type?.toLowerCase() || 'unknown';
      return type.charAt(0).toUpperCase() + type.slice(1);
    }),
    datasets: [
      {
        label: "Vehicles",
        data: vehicleStats.vehiclesByType.map(v => v.count || 0),
        backgroundColor: [
          '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
          '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#64748b'
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  const driverAssignmentData = vehicleStats ? {
    labels: ['With Drivers', 'Without Drivers'],
    datasets: [
      {
        label: "Vehicles",
        data: [
          vehicleStats.vehiclesWithDrivers,
          vehicleStats.vehiclesWithoutDrivers
        ],
        backgroundColor: ['#10b981', '#f59e0b'],
        borderWidth: 2,
      },
    ],
  } : null;

  const incidentsByTypeData = incidentStats ? {
    labels: incidentStats.incidentsByType.map(i => i.IncidentType || 'Unknown'),
    datasets: [
      {
        label: "Incidents",
        data: incidentStats.incidentsByType.map(i => i.count || 0),
        backgroundColor: [
          '#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6',
          '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#64748b'
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  const maintenanceTrendsData = maintenanceAnalytics ? {
    labels: Object.keys(maintenanceAnalytics.monthlyTrends).slice(-6),
    datasets: [
      {
        label: "Maintenance Events",
        data: Object.values(maintenanceAnalytics.monthlyTrends).slice(-6),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return 'ETB ' + value.toLocaleString();
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading fleet reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to Load Reports</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2"></h1>
            <p className="text-slate-600"></p>
          </div>
          {role === 'Commissioner' && (
            <button
              onClick={() => fetchReports()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm"
              title="View Reports"
            >
              <Eye size={16} />
              <span className="font-semibold">View Reports</span>
            </button>
          )}
        </div>

        {/* Combined Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Total Vehicles</p>
                <p className="text-2xl font-bold text-slate-900">
                  {fleetOverview?.totalVehicles || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {fleetOverview?.vehiclesWithDrivers || 0} with drivers
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500 bg-opacity-10">
                <span className="text-2xl">🚗</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Maintenance Cost</p>
                <p className="text-2xl font-bold text-slate-900">
                  ETB {(fleetOverview?.totalMaintenanceCost || 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {fleetOverview?.totalMaintained || 0} maintained
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-500 bg-opacity-10">
                <span className="text-2xl">🔧</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Cost Registration</p>
                <p className="text-2xl font-bold text-slate-900">
                  ETB {totalCostRegistrationAmount.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {costData.length} cost entries
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500 bg-opacity-10">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Active Incidents</p>
                <p className="text-2xl font-bold text-slate-900">
                  {fleetOverview?.activeIncidents || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {fleetOverview?.totalIncidents || 0} total
                </p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500 bg-opacity-10">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle & Cost Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Cost by Category */}
          {Object.keys(categoryAmountData).length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Costs by Category</h3>
              <div className="h-80">
                <Bar 
                  data={categoryAmountChartData} 
                  options={barChartOptions} 
                />
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-slate-600">
                  Total Registered Costs: <span className="font-semibold text-green-600">
                    ETB {totalCostRegistrationAmount.toLocaleString()}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Driver Assignment */}
          {driverAssignmentData && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Driver Assignment</h3>
              <div className="h-80">
                <Doughnut data={driverAssignmentData} options={chartOptions} />
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-slate-600">
                  Assignment Rate: <span className="font-semibold text-green-600">{vehicleStats?.driverAssignmentRate || 0}%</span>
                </p>
              </div>
            </div>
          )}
        </div>

        Maintenance & Incidents
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Incidents by Type */}
          {incidentsByTypeData && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Incidents by Type</h3>
              <div className="h-80">
                <Pie data={incidentsByTypeData} options={chartOptions} />
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-slate-600">
                  Resolution Rate: <span className="font-semibold text-blue-600">{incidentStats?.resolutionRate || 0}%</span>
                </p>
              </div>
            </div>
          )}

          {/* Maintenance Trends */}
          {maintenanceTrendsData && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Maintenance Trends</h3>
              <div className="h-80">
                <Line data={maintenanceTrendsData} options={chartOptions} />
              </div>
            </div>
          )}
        </div>

        {/* Recent Cost Entries */}
        {costData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Cost Entries</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Vehicle</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Reference</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {costData.slice(0, 5).map((cost) => (
                    <tr key={cost.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {new Date(cost.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900">
                        {cost.vehicle.plate} - {cost.vehicle.make}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {cost.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{cost.reference}</td>
                      <td className="py-3 px-4 text-sm text-right font-semibold text-green-600">
                        ETB {parseFloat(cost.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <span>🔄</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">New Vehicles</p>
                <p className="text-2xl font-bold text-slate-900">{vehicleStats?.newVehicles || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <span>✅</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">Resolved Incidents</p>
                <p className="text-2xl font-bold text-slate-900">{incidentStats?.resolvedIncidents || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <span>💰</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">Cost Categories</p>
                <p className="text-2xl font-bold text-slate-900">{Object.keys(categoryAmountData).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Summary Report Table (Footer) */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Analytics Summary Report</h2>
              <p className="text-xs text-slate-500">
                Tabular summary of key fleet KPIs (vehicles, costs, incidents, utilization, and more).
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-600">Export:</span>
              <select
                className="border border-slate-300 rounded h-8 px-2 bg-white text-slate-800"
                value={reportExportFormat}
                onChange={e => setReportExportFormat(e.target.value as "excel" | "word" | "pdf")}
              >
                <option value="excel">Excel</option>
                <option value="word">Word</option>
                <option value="pdf">PDF</option>
              </select>
              <button
                type="button"
                onClick={handleAnalyticsExport}
                className="px-3 py-1.5 rounded-lg border border-emerald-500 text-emerald-700 text-xs font-medium hover:bg-emerald-50"
              >
                Export
              </button>
            </div>
          </div>
          <div className="p-4 overflow-x-auto">
            {analyticsReportRows.length === 0 ? (
              <p className="text-sm text-slate-500">No analytics data available for report.</p>
            ) : (
              <table className="min-w-full text-sm border border-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-200 px-3 py-2 text-left text-slate-700 text-xs font-semibold">
                      Metric
                    </th>
                    <th className="border border-slate-200 px-3 py-2 text-left text-slate-700 text-xs font-semibold">
                      Value
                    </th>
                    <th className="border border-slate-200 px-3 py-2 text-left text-slate-700 text-xs font-semibold">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsReportRows.map((row, idx) => (
                    <tr
                      key={row.metric + idx}
                      className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td className="border border-slate-200 px-3 py-2 align-top text-slate-800">
                        {row.metric}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 align-top text-slate-800 whitespace-nowrap">
                        {row.value}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 align-top text-slate-700 text-xs">
                        {row.details || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}