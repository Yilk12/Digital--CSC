"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocalization } from "@/app/hooks/use-localization";

interface WomenInclusionReport {
  id: string;
  typeOfMisconduct: string;
  dateTime: string;
  location: string | null;
  detailDescriptionOfIncident: string | null;
}

// Third-Party Sexual Assault Report page
export default function ThirdPartySexualAssaultReportPage() {
  const { t } = useLocalization();

  const [reports, setReports] = useState<WomenInclusionReport[]>([]);
  const [selectedIncidentType, setSelectedIncidentType] = useState<string>("");
  const [incidentSearch, setIncidentSearch] = useState("");

  // Form fields matching CreateThirdPartySexualAssaultInput
  const [reporterName, setReporterName] = useState("");
  const [relationshipToVictim, setRelationshipToVictim] = useState("");
  const [descriptionOfWhatWasObserved, setDescriptionOfWhatWasObserved] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [location, setLocation] = useState("");
  const [victimId, setVictimId] = useState("");

  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string>("");
  const [submitOk, setSubmitOk] = useState<boolean | null>(null);

  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return (
      localStorage.getItem("accessToken") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("token") ||
      ""
    );
  }, []);

  const apiBase = useMemo(() => {
    const env = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");
    return env;
  }, []);

  async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit) {
    const headers = new Headers(init?.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    return fetch(input, { ...init, headers });
  }

  // Load Women & Social Inclusion reports to select from
  useEffect(() => {
    let cancelled = false;
    const loadReports = async () => {
      try {
        const res = await fetchWithAuth(`${apiBase}/api/submissions/women-social-inclusion`);
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data?.message || "Failed to load reports");
        if (!cancelled && Array.isArray(data)) {
          setReports(data);
        }
      } catch (err) {
        console.error("Failed to load women & social inclusion reports", err);
      }
    };
    loadReports();
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  const selectedReport = useMemo(
    () => reports.find((r) => r.typeOfMisconduct === selectedIncidentType) || null,
    [reports, selectedIncidentType]
  );

  const filteredReports = useMemo(() => {
    const q = incidentSearch.trim().toLowerCase();
    const base = reports; // use all identified incidents regardless of exact type label
    if (!q) return base;
    return base.filter((r) => {
      const desc = (r.detailDescriptionOfIncident || "").toLowerCase();
      const loc = (r.location || "").toLowerCase();
      const dateStr = new Date(r.dateTime).toLocaleDateString().toLowerCase();
      return desc.includes(q) || loc.includes(q) || dateStr.includes(q);
    });
  }, [reports, incidentSearch]);

  // Distinct incident types (የጥቃቱ አይነት) for the Incident dropdown
  const incidentTypeOptions = useMemo(
    () => Array.from(new Set(filteredReports.map((r) => r.typeOfMisconduct))).filter(Boolean),
    [filteredReports]
  );

  // Auto-fill form when incident is selected
  useEffect(() => {
    if (selectedReport) {
      if (!dateTime) setDateTime(selectedReport.dateTime);
      if (!location && selectedReport.location) setLocation(selectedReport.location);
    }
  }, [selectedReport, dateTime, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedIncidentType) {
      setSubmitMsg("Please select an incident type to attach your third-party report to.");
      setSubmitOk(false);
      return;
    }

    if (!descriptionOfWhatWasObserved.trim()) {
      setSubmitMsg("Please describe what you observed or were told.");
      setSubmitOk(false);
      return;
    }

    if (!consent) {
      setSubmitMsg("Please confirm that you consent to use of the information for investigation.");
      setSubmitOk(false);
      return;
    }

    setSubmitting(true);
    setSubmitMsg("");
    setSubmitOk(null);

    try {
      const base = selectedReport;
      const url = `${apiBase}/api/submissions/third-party-sexual-assault`;

      // Updated payload - removed requesterUserId as it will be taken from req.user
      const payload = {
        misconductId: base?.id || "",
        typeOfMisconduct: base?.typeOfMisconduct || "",
        dateTime: dateTime || base?.dateTime || new Date().toISOString(),
        location: location || base?.location || null,
        descriptionOfWhatWasObserved: descriptionOfWhatWasObserved || null,
        victimUserId: victimId || null, // Note: changed from victimId to victimUserId to match your backend
      };

      console.log("this is the payload", payload);

      const res = await fetchWithAuth(url, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || "Failed to create third-party report");

      setSubmitMsg(" " + t("feedback.success"));
      setSubmitOk(true);

      // Reset form
      setSelectedIncidentType("");
      setReporterName("");
      setDescriptionOfWhatWasObserved("");
      setDateTime("");
      setLocation("");
      setVictimId("");
      setConsent(false);
    } catch (e: any) {
      console.error(" Third-party Sexual Assault submission error:", e);
      setSubmitMsg(e?.message || "Failed to submit third-party report");
      setSubmitOk(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-teal-400 text-white">
            <h1 className="text-2xl font-bold">Third-Party Sexual Assault Report</h1>
            <p className="mt-1 text-sm opacity-90">
              Select an existing incident and describe what you observed or were told. This report is
              submitted on behalf of someone else.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Select incident (from identified reports የጥቃቱ አይነት) */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-gray-800">Select Incident</h2>
              <div className="space-y-2">
                <label className="block text-sm font-medium mb-1">Incident *</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
                  placeholder="Search incidents by date, location, or description..."
                  value={incidentSearch}
                  onChange={(e) => setIncidentSearch(e.target.value)}
                />
                <select
                  value={selectedIncidentType}
                  onChange={(e) => setSelectedIncidentType(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value="">Choose an incident type...</option>
                  {incidentTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* Incident Details */}
            <section className="space-y-4 border-t border-gray-100 pt-4">
              <h2 className="text-sm font-semibold text-gray-800">Incident Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={dateTime ? new Date(dateTime).toISOString().slice(0, 16) : ""}
                    onChange={(e) => setDateTime(new Date(e.target.value).toISOString())}
                  />
                  {selectedReport && (
                    <p className="text-xs text-gray-500 mt-1">
                      Original: {new Date(selectedReport.dateTime).toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter incident location"
                  />
                  {selectedReport?.location && (
                    <p className="text-xs text-gray-500 mt-1">
                      Original: {selectedReport.location}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Observation Details */}
            <section className="space-y-4 border-t border-gray-100 pt-4">
              <h2 className="text-sm font-semibold text-gray-800">Observation Details</h2>
              <div>
                <label className="block text-sm font-medium mb-1">Description of What You Observed or Were Told *</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 min-h-[140px] text-sm"
                  value={descriptionOfWhatWasObserved}
                  onChange={(e) => setDescriptionOfWhatWasObserved(e.target.value)}
                  placeholder="Please provide a detailed description of what you witnessed, heard, or were told about the incident. Include specific details, conversations, behaviors, or circumstances that you observed."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Be as specific as possible. Include dates, times, locations, people involved, and what exactly was said or done.
                </p>
              </div>
            </section>

            {/* Consent */}
            <section className="space-y-3 border-t border-gray-100 pt-4">
              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5"
                  required
                />
                <span>
                  I confirm that the information I provide is accurate to the best of my knowledge and may
                  be used for assessment and investigation in line with organizational policy. I understand
                  that this report will be associated with the selected incident. *
                </span>
              </label>
            </section>

            {submitMsg && (
              <div
                className={`p-3 rounded text-sm border ${
                  submitOk
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {submitMsg}
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border text-sm text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => {
                  setSelectedIncidentType("");
                  setReporterName("");
                  setRelationshipToVictim("");
                  setDescriptionOfWhatWasObserved("");
                  setDateTime("");
                  setLocation("");
                  setVictimId("");
                  setConsent(false);
                }}
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Third-Party Report"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}