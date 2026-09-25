"use client";

import { useState } from "react";
import Link from "next/link";
import { SRC_RUBRICS } from "@/domain/src-rubrics";
import type { ProjectType } from "@/domain/types";
import { cld } from "@/ui/cld";
import { Button } from "@/ui/Button";
import { QrCode, Plus, MapPin, Check, ExternalLink, Calendar, Landmark, CheckCircle2 } from "lucide-react";

export function SetupClient({
  projects,
  currentProjectId,
  sites,
  claims,
  acceptedPhotosBySite,
  baselineHistoriesBySite,
}: {
  projects: { id: string; name: string; type: string }[];
  currentProjectId: string;
  sites: {
    id: string;
    projectId: string;
    name: string;
    description: string;
    location: { lat: number; lon: number };
    radiusM: number;
    baselineAssetId: string | null;
    qrSlug: string | null;
  }[];
  claims: {
    id: string;
    projectId: string;
    siteId: string | null;
    periodStart: string;
    periodEnd: string;
    text: string;
  }[];
  acceptedPhotosBySite: Record<string, { assetId: string; secureUrl: string; timepoint?: string }[]>;
  baselineHistoriesBySite: Record<string, { assetId: string; setAt: string | Date }[]>;
}) {
  const [activeTab, setActiveTab] = useState<"projects" | "sites" | "claims" | "baselines">("sites");

  // Project form state
  const [projId, setProjId] = useState("");
  const [projName, setProjName] = useState("");
  const [projType, setProjType] = useState<ProjectType>("plantation");
  const [projLoading, setProjLoading] = useState(false);
  const [projError, setProjError] = useState<string | null>(null);

  // Site form state
  const [siteId, setSiteId] = useState("");
  const [siteName, setSiteName] = useState("");
  const [siteDesc, setSiteDesc] = useState("");
  const [siteLat, setSiteLat] = useState("28.6139");
  const [siteLon, setSiteLon] = useState("77.2090");
  const [siteRadius, setSiteRadius] = useState("100");
  const [siteLoading, setSiteLoading] = useState(false);
  const [siteError, setSiteError] = useState<string | null>(null);

  // Claim form state
  const [claimId, setClaimId] = useState("");
  const [claimSiteId, setClaimSiteId] = useState("");
  const [claimStart, setClaimStart] = useState("2026-09-01");
  const [claimEnd, setClaimEnd] = useState("2026-09-30");
  const [claimText, setClaimText] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Baseline selection state
  const [selectedBaselineSiteId, setSelectedBaselineSiteId] = useState<string>(sites[0]?.id ?? "");
  const [baselineLoading, setBaselineLoading] = useState(false);

  // Use my location
  function locateUser() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSiteLat(pos.coords.latitude.toFixed(5));
          setSiteLon(pos.coords.longitude.toFixed(5));
        },
        (err) => {
          alert(`Location error: ${err.message}`);
        }
      );
    }
  }

  // Handle Project create
  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    setProjLoading(true);
    setProjError(null);
    try {
      const res = await fetch("/api/setup/project", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: projId, name: projName, type: projType }),
      });
      if (!res.ok) throw new Error(await res.text());
      window.location.reload();
    } catch (err) {
      setProjError((err as Error).message);
    } finally {
      setProjLoading(false);
    }
  }

  // Handle Site create
  async function handleCreateSite(e: React.FormEvent) {
    e.preventDefault();
    setSiteLoading(true);
    setSiteError(null);
    try {
      const res = await fetch("/api/setup/site", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: siteId,
          projectId: currentProjectId,
          name: siteName,
          description: siteDesc,
          lat: parseFloat(siteLat),
          lon: parseFloat(siteLon),
          radiusM: parseInt(siteRadius, 10),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      window.location.reload();
    } catch (err) {
      setSiteError((err as Error).message);
    } finally {
      setSiteLoading(false);
    }
  }

  // Handle Claim create
  async function handleCreateClaim(e: React.FormEvent) {
    e.preventDefault();
    setClaimLoading(true);
    setClaimError(null);
    try {
      const res = await fetch("/api/setup/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: claimId,
          projectId: currentProjectId,
          siteId: claimSiteId || null,
          periodStart: claimStart,
          periodEnd: claimEnd,
          text: claimText,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      window.location.reload();
    } catch (err) {
      setClaimError((err as Error).message);
    } finally {
      setClaimLoading(false);
    }
  }

  // Handle Set Baseline
  async function handleSetBaseline(assetId: string) {
    if (!selectedBaselineSiteId) return;
    setBaselineLoading(true);
    try {
      const res = await fetch(`/api/sites/${selectedBaselineSiteId}/baseline`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assetId }),
      });
      if (!res.ok) throw new Error(await res.text());
      window.location.reload();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBaselineLoading(false);
    }
  }

  const activeRubric = SRC_RUBRICS[projType] ?? SRC_RUBRICS.plantation;
  const currentBaselineSite = sites.find((s) => s.id === selectedBaselineSiteId);
  const acceptedPhotos = acceptedPhotosBySite[selectedBaselineSiteId] ?? [];
  const baselineHistory = baselineHistoriesBySite[selectedBaselineSiteId] ?? [];

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-surface-0">
      {/* Top Header */}
      <div className="border-b border-line bg-surface-1 px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight text-text">Project & Site Setup</h1>
        <p className="mt-1 text-[13px] text-text-2">
          Configure project rubrics, sites with geo-fencing, claim periods, and photographic baselines.
        </p>

        {/* Tab switch */}
        <div className="mt-6 flex gap-2 border-b border-line">
          {(
            [
              { key: "sites", label: `Sites (${sites.length})` },
              { key: "baselines", label: "Baselines" },
              { key: "claims", label: `Claims (${claims.length})` },
              { key: "projects", label: `Projects (${projects.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 px-4 py-2 font-mono text-[12px] font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-measure text-text font-semibold"
                  : "border-transparent text-text-3 hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8 max-w-6xl">
        {/* --- TAB 1: SITES --- */}
        {activeTab === "sites" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sites List (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-base font-semibold text-text">Configured Monitoring Sites</h2>
              {sites.length === 0 ? (
                <div className="rounded-[2px] border border-line bg-surface-1 p-6 text-center text-[13px] text-text-3">
                  No sites created yet. Use the form to configure your first site.
                </div>
              ) : (
                <div className="divide-y divide-line rounded-[2px] border border-line bg-surface-1">
                  {sites.map((s) => (
                    <div key={s.id} className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-text text-[14px]">{s.name}</span>
                          <span className="font-mono text-[11px] text-text-3">({s.id})</span>
                        </div>
                        <p className="text-[12px] text-text-2 mt-0.5">{s.description || "No landmark notes."}</p>
                        <div className="flex items-center gap-3 font-mono text-[11px] text-text-3 mt-1.5">
                          <span>
                            {s.location.lat.toFixed(4)}, {s.location.lon.toFixed(4)} (r={s.radiusM}m)
                          </span>
                          <span>·</span>
                          <span>
                            Baseline: {s.baselineAssetId ? "Set" : "Pending"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {s.qrSlug && (
                          <Link
                            href={`/plaque/${s.qrSlug}`}
                            target="_blank"
                            className="inline-flex h-8 items-center gap-1.5 rounded-[2px] border border-line bg-surface-0 px-2.5 font-mono text-[11px] text-text hover:bg-surface-2"
                          >
                            <QrCode className="h-3.5 w-3.5 text-measure" />
                            <span>Plaque</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        )}
                        <Link
                          href={`/sites/${s.id}`}
                          className="inline-flex h-8 items-center gap-1 rounded-[2px] border border-line bg-surface-0 px-2.5 font-mono text-[11px] text-text hover:bg-surface-2"
                        >
                          <span>Chart</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create Site Form (1 col) */}
            <div className="rounded-[2px] border border-line bg-surface-1 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-text flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-measure" />
                <span>Add Site</span>
              </h3>

              <form onSubmit={handleCreateSite} className="space-y-3">
                <div>
                  <label className="block font-mono text-[11px] text-text-3 mb-1">Site ID (slug)</label>
                  <input
                    type="text"
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    placeholder="plot-b"
                    required
                    className="w-full rounded-[2px] border border-line bg-surface-0 p-2 font-mono text-[12px] text-text"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-text-3 mb-1">Site Name</label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="Plot B: Floodplain Nursery"
                    required
                    className="w-full rounded-[2px] border border-line bg-surface-0 p-2 text-[12px] text-text"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-text-3 mb-1">
                    Landmark Description (helps Jev align)
                  </label>
                  <textarea
                    value={siteDesc}
                    onChange={(e) => setSiteDesc(e.target.value)}
                    placeholder="Bordered by mud embankment on north, electric pylon visible..."
                    rows={2}
                    className="w-full rounded-[2px] border border-line bg-surface-0 p-2 text-[12px] text-text"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-mono text-[10px] text-text-3 mb-1">Latitude</label>
                    <input
                      type="text"
                      value={siteLat}
                      onChange={(e) => setSiteLat(e.target.value)}
                      required
                      className="w-full rounded-[2px] border border-line bg-surface-0 p-1.5 font-mono text-[11px] text-text"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] text-text-3 mb-1">Longitude</label>
                    <input
                      type="text"
                      value={siteLon}
                      onChange={(e) => setSiteLon(e.target.value)}
                      required
                      className="w-full rounded-[2px] border border-line bg-surface-0 p-1.5 font-mono text-[11px] text-text"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={locateUser}
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-measure hover:underline"
                  >
                    <MapPin className="h-3 w-3" />
                    <span>Use my location</span>
                  </button>

                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-text-3">Radius:</span>
                    <input
                      type="number"
                      value={siteRadius}
                      onChange={(e) => setSiteRadius(e.target.value)}
                      className="w-16 rounded-[2px] border border-line bg-surface-0 p-1 font-mono text-[11px] text-text"
                    />
                    <span className="text-text-3">m</span>
                  </div>
                </div>

                {siteError && <div className="text-[11px] text-flag">{siteError}</div>}

                <Button
                  type="submit"
                  variant="primary"
                  disabled={siteLoading}
                  className="w-full"
                >
                  {siteLoading ? "Saving..." : "Create Site"}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* --- TAB 2: BASELINES --- */}
        {activeTab === "baselines" && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <label className="font-mono text-[12px] text-text-3">Select Site:</label>
              <select
                value={selectedBaselineSiteId}
                onChange={(e) => setSelectedBaselineSiteId(e.target.value)}
                className="rounded-[2px] border border-line bg-surface-1 px-3 py-1.5 font-medium text-[13px] text-text"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id})
                  </option>
                ))}
              </select>
            </div>

            {currentBaselineSite && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pick from accepted photos */}
                <div className="rounded-[2px] border border-line bg-surface-1 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-text">Choose Baseline Photo</h3>
                    <span className="font-mono text-[11px] text-text-3">
                      {acceptedPhotos.length} accepted photos
                    </span>
                  </div>
                  <p className="text-[12px] text-text-2">
                    Pick a sharp, representative photo that future follow-up photos will be registered against via SIFT + MAGSAC++.
                  </p>

                  {acceptedPhotos.length === 0 ? (
                    <div className="rounded-[2px] border border-line bg-surface-0 p-6 text-center text-[12px] text-text-3">
                      No accepted photos for this site yet. Ingest or review photos first.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 max-h-[360px] overflow-y-auto p-1">
                      {acceptedPhotos.map((p) => {
                        const isCurrent = currentBaselineSite.baselineAssetId === p.assetId;
                        return (
                          <div
                            key={p.assetId}
                            role="button"
                            onClick={() => !isCurrent && handleSetBaseline(p.assetId)}
                            className={`group relative aspect-4/3 cursor-pointer overflow-hidden rounded-[2px] border bg-surface-2 ${
                              isCurrent
                                ? "border-measure ring-2 ring-measure"
                                : "border-line hover:border-text-3"
                            }`}
                          >
                            <img
                              src={cld.thumb(p.assetId, 160)}
                              alt={p.assetId}
                              className="h-full w-full object-cover"
                            />
                            {isCurrent && (
                              <div className="absolute top-1 right-1 rounded-full bg-measure p-1 text-surface-0">
                                <Check className="h-3 w-3 stroke-[3]" />
                              </div>
                            )}
                            <div className="absolute bottom-0 inset-x-0 bg-black/70 p-1 font-mono text-[9px] text-white truncate">
                              {p.timepoint ?? p.assetId.slice(0, 10)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Current Baseline & History */}
                <div className="rounded-[2px] border border-line bg-surface-1 p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-text">Current Baseline & History</h3>

                  {currentBaselineSite.baselineAssetId ? (
                    <div className="space-y-4">
                      <div className="relative aspect-4/3 w-full max-w-sm overflow-hidden rounded-[2px] border border-line bg-surface-2">
                        <img
                          src={cld.plate(currentBaselineSite.baselineAssetId, 480)}
                          alt="Current baseline"
                          className="h-full w-full object-contain"
                        />
                        <div className="absolute bottom-2 left-2 rounded bg-black/80 px-2 py-0.5 font-mono text-[11px] text-white">
                          Current Active Baseline
                        </div>
                      </div>

                      <div>
                        <span className="font-mono text-[11px] text-text-3 uppercase tracking-wider block mb-2">
                          Baseline Audit History
                        </span>
                        <div className="space-y-1 font-mono text-[12px] text-text-2">
                          {baselineHistory.map((h, i) => (
                            <div key={i} className="flex justify-between border-b border-line py-1">
                              <span className="truncate max-w-[200px]">{h.assetId}</span>
                              <span className="text-text-3">{new Date(h.setAt).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[13px] text-text-3">
                      No baseline set for this site yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 3: CLAIMS --- */}
        {activeTab === "claims" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-base font-semibold text-text">Project Commitments & Claims</h2>
              {claims.length === 0 ? (
                <div className="rounded-[2px] border border-line bg-surface-1 p-6 text-center text-[13px] text-text-3">
                  No claims added yet. Use the form to record restoration claims.
                </div>
              ) : (
                <div className="divide-y divide-line rounded-[2px] border border-line bg-surface-1">
                  {claims.map((c) => (
                    <div key={c.id} className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between font-mono text-[11px] text-text-3">
                        <span className="text-measure font-medium">Claim: {c.id}</span>
                        <span>
                          {c.periodStart} → {c.periodEnd}
                        </span>
                      </div>
                      <p className="text-[13px] text-text font-serif leading-relaxed">{c.text}</p>
                      <div className="font-mono text-[10px] text-text-3">
                        Scope: {c.siteId ? `Site ${c.siteId}` : "Entire Project"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[2px] border border-line bg-surface-1 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-text flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-measure" />
                <span>Add Claim</span>
              </h3>

              <form onSubmit={handleCreateClaim} className="space-y-3">
                <div>
                  <label className="block font-mono text-[11px] text-text-3 mb-1">Claim ID</label>
                  <input
                    type="text"
                    value={claimId}
                    onChange={(e) => setClaimId(e.target.value)}
                    placeholder="claim-2026-q3"
                    required
                    className="w-full rounded-[2px] border border-line bg-surface-0 p-2 font-mono text-[12px] text-text"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-text-3 mb-1">Scope</label>
                  <select
                    value={claimSiteId}
                    onChange={(e) => setClaimSiteId(e.target.value)}
                    className="w-full rounded-[2px] border border-line bg-surface-0 p-2 text-[12px] text-text"
                  >
                    <option value="">Entire Project</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-mono text-[10px] text-text-3 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={claimStart}
                      onChange={(e) => setClaimStart(e.target.value)}
                      required
                      className="w-full rounded-[2px] border border-line bg-surface-0 p-1.5 font-mono text-[11px] text-text"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] text-text-3 mb-1">End Date</label>
                    <input
                      type="date"
                      value={claimEnd}
                      onChange={(e) => setClaimEnd(e.target.value)}
                      required
                      className="w-full rounded-[2px] border border-line bg-surface-0 p-1.5 font-mono text-[11px] text-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-text-3 mb-1">Claim Statement</label>
                  <textarea
                    value={claimText}
                    onChange={(e) => setClaimText(e.target.value)}
                    placeholder="We planted 1,200 native saplings and achieved >80% survival rate..."
                    rows={3}
                    required
                    className="w-full rounded-[2px] border border-line bg-surface-0 p-2 text-[12px] text-text"
                  />
                </div>

                {claimError && <div className="text-[11px] text-flag">{claimError}</div>}

                <Button
                  type="submit"
                  variant="primary"
                  disabled={claimLoading}
                  className="w-full"
                >
                  {claimLoading ? "Saving..." : "Add Claim"}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* --- TAB 4: PROJECTS & RUBRIC PREVIEW --- */}
        {activeTab === "projects" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-text">Registered Projects</h2>
              <div className="divide-y divide-line rounded-[2px] border border-line bg-surface-1">
                {projects.map((p) => (
                  <div key={p.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[14px] text-text">{p.name}</div>
                      <div className="font-mono text-[11px] text-text-3 mt-0.5">
                        ID: {p.id} · Type: {p.type}
                      </div>
                    </div>
                    {p.id === currentProjectId && (
                      <span className="rounded bg-measure/10 px-2 py-0.5 font-mono text-[11px] text-measure">
                        Active
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Create project form */}
              <div className="rounded-[2px] border border-line bg-surface-1 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-text">Register New Project</h3>
                <form onSubmit={handleCreateProject} className="space-y-3">
                  <div>
                    <label className="block font-mono text-[11px] text-text-3 mb-1">Project ID</label>
                    <input
                      type="text"
                      value={projId}
                      onChange={(e) => setProjId(e.target.value)}
                      placeholder="aravali-biodiversity"
                      required
                      className="w-full rounded-[2px] border border-line bg-surface-0 p-2 font-mono text-[12px] text-text"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] text-text-3 mb-1">Project Name</label>
                    <input
                      type="text"
                      value={projName}
                      onChange={(e) => setProjName(e.target.value)}
                      placeholder="Aravali Biodiversity Corridor"
                      required
                      className="w-full rounded-[2px] border border-line bg-surface-0 p-2 text-[12px] text-text"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] text-text-3 mb-1">Rubric Domain</label>
                    <select
                      value={projType}
                      onChange={(e) => setProjType(e.target.value as ProjectType)}
                      className="w-full rounded-[2px] border border-line bg-surface-0 p-2 text-[12px] text-text"
                    >
                      <option value="plantation">Afforestation / Plantation</option>
                      <option value="cleanup">Waste & Riverbed Cleanup</option>
                      <option value="water_point">Water Points / Wells</option>
                      <option value="sanitation">Sanitation Infrastructure</option>
                      <option value="construction">Rural Construction</option>
                    </select>
                  </div>

                  {projError && <div className="text-[11px] text-flag">{projError}</div>}

                  <Button type="submit" variant="primary" disabled={projLoading} className="w-full">
                    {projLoading ? "Creating..." : "Create Project"}
                  </Button>
                </form>
              </div>
            </div>

            {/* Rubric Preview (US-7) */}
            <div className="rounded-[2px] border border-line bg-surface-1 p-5 space-y-4">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-text-3 block">
                  SRC Rubric Preview (US-7)
                </span>
                <h3 className="text-base font-semibold text-text capitalize">
                  {projType.replace("_", " ")} Assessment Scale
                </h3>
              </div>

              <div className="space-y-3">
                {activeRubric.levels.map((desc: string, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-[2px] border border-line bg-surface-0 p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono text-[12px]">
                      <span className="font-semibold text-measure">
                        Grade {idx + 1}: {activeRubric.labels[idx]}
                      </span>
                      <span className="text-text-3">Level {idx + 1}</span>
                    </div>
                    <p className="text-[12px] text-text-2 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
