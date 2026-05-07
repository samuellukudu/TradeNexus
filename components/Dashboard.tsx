import React, { useState, useMemo } from 'react';
import { Lead, LeadStatus, SearchSession } from '../types';

interface DashboardProps {
  sessions: SearchSession[];
  onToggleAutoPilot: (sessionId: string, enabled: boolean) => void;
  onDeleteSession: (sessionId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ sessions, onToggleAutoPilot, onDeleteSession }) => {
  const [filterSessionId, setFilterSessionId] = useState<string>('ALL');
  const [filterRegion, setFilterRegion] = useState<string>('ALL');
  const [pendingAutoPilotSession, setPendingAutoPilotSession] = useState<string | null>(null);
  const [pendingDeleteSession, setPendingDeleteSession] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // 1. Filter Leads by Session first
  const sessionLeads = useMemo(() => {
    if (filterSessionId === 'ALL') {
      return sessions.flatMap(s => s.leads || []);
    }
    const session = sessions.find(s => s.id === filterSessionId);
    return session && session.leads ? session.leads : [];
  }, [sessions, filterSessionId]);

  // 2. Extract available regions from the session leads for the dropdown
  const availableRegions = useMemo(() => {
      const regions = new Set<string>();
      sessionLeads.forEach(l => {
          if (l.region) regions.add(l.region);
      });
      return Array.from(regions).sort();
  }, [sessionLeads]);

  // 3. Filter Leads by Region
  const filteredLeads = useMemo(() => {
      if (filterRegion === 'ALL') return sessionLeads;
      return sessionLeads.filter(l => l.region === filterRegion);
  }, [sessionLeads, filterRegion]);

  const activeSession = sessions.find(s => s.id === filterSessionId);

  // Metrics (Calculated based on final filtered leads)
  const totalLeads = filteredLeads.length;
  const activeNegotiations = filteredLeads.filter(l => l.status === LeadStatus.NEGOTIATING || l.status === LeadStatus.CONTACTING).length;
  const confirmedOrders = filteredLeads.filter(l => l.status === LeadStatus.CLOSED_WON).length;
  const conversionRate = totalLeads > 0 ? ((confirmedOrders / totalLeads) * 100).toFixed(1) : "0.0";
  
  // Activity Feed (Based on final filtered leads)
  const allLogs = filteredLeads.flatMap(l => (l.logs || []).map(log => ({ ...log, companyName: l.companyName, leadId: l.id })))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 20);

  const handleToggleClick = (sessionId: string, currentStatus: boolean | undefined) => {
      if (!currentStatus) {
          // Enabling: Show confirmation
          setPendingAutoPilotSession(sessionId);
      } else {
          // Disabling: Do immediately
          onToggleAutoPilot(sessionId, false);
      }
  };

  const confirmEnableAutoPilot = () => {
      if (pendingAutoPilotSession) {
          onToggleAutoPilot(pendingAutoPilotSession, true);
          setPendingAutoPilotSession(null);
      }
  };

  const confirmDeleteSession = () => {
      if (pendingDeleteSession) {
          onDeleteSession(pendingDeleteSession);
          setPendingDeleteSession(null);
          setFilterSessionId('ALL');
      }
  };

  const getExportData = () => {
      if (filteredLeads.length === 0) return { headers: [], rows: [] };

      // Define Headers - Optimized for Excel Delivery
      const headers = [
        "Company Name", 
        "Region", 
        "Map Verification Link", 
        "Website",
        "Confidence Score", 
        "Match Reasoning",
        "Contact Email", 
        "Phone Number", 
        "Address",
        "Est. Revenue", 
        "Est. Employees", 
        "Trade Volume",
        "Manufacturing Capacity",
        "Primary Social Link"
      ];

      // Map Data
      const rows = filteredLeads.map(lead => {
        // 1. Social Media: Prioritize LinkedIn for the clickable link
        let socialCell = "";
        if (lead.socialProfiles && lead.socialProfiles.length > 0) {
             // Find LinkedIn, otherwise default to first available
             const linkedIn = lead.socialProfiles.find(p => p.platform.toLowerCase().includes('linkedin'));
             const target = linkedIn || lead.socialProfiles[0];
             // Update: Display URL as the label instead of platform name
             socialCell = `=HYPERLINK("${target.url}", "${target.url}")`;
        }

        // 2. Map Link
        let mapUrlCell = "";
        if (lead.googleMapsUrl) {
            mapUrlCell = `=HYPERLINK("${lead.googleMapsUrl}", "View Map")`;
        } else if (lead.address) {
            const q = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address)}`;
            mapUrlCell = `=HYPERLINK("${q}", "Search Map")`;
        }
        
        // 3. Website Link
        let websiteCell = "";
        if (lead.website && lead.website.toLowerCase() !== 'n/a') {
             websiteCell = `=HYPERLINK("${lead.website}", "${lead.website}")`;
        }

        // 4. Email Link
        let emailCell = lead.contactEmail || "";
        if (emailCell && emailCell.includes('@')) {
             emailCell = `=HYPERLINK("mailto:${emailCell}", "${emailCell}")`;
        }

        return [
          lead.companyName || "",
          lead.region || "",
          mapUrlCell,
          websiteCell,
          `${lead.confidenceScore}%`,
          lead.summary || "",
          emailCell,
          lead.phoneNumber || "",
          lead.address || "",
          lead.revenue || "",
          lead.employeeCount || "",
          lead.tradeVolume || "",
          lead.manufacturingVolume || "",
          socialCell
        ];
      });

      return { headers, rows };
  };

  const handleCopyToClipboard = async () => {
    const { headers, rows } = getExportData();
    if (!rows || rows.length === 0) return;

    // Create TSV (Tab Separated Values) for easy pasting into Excel/Sheets
    const tsvContent = [
        headers.join('\t'),
        ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join('\t'))
    ].join('\n');

    try {
        await navigator.clipboard.writeText(tsvContent);
        setCopyFeedback("Copied to Clipboard! Ready to paste into Excel.");
        setTimeout(() => setCopyFeedback(null), 3000);
    } catch (err) {
        console.error('Failed to copy: ', err);
        setCopyFeedback("Failed to copy.");
    }
  };

  const handleExportCSV = () => {
    const { headers, rows } = getExportData();
    if (!rows || rows.length === 0) return;

    // Create CSV Content
    const csvContent = [
      headers.join(','), 
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Determine filename
    const uniqueRegions = Array.from(new Set(filteredLeads.map(l => l.region))).filter(Boolean) as string[];
    let regionLabel = "Global";

    if (uniqueRegions.length === 1) {
        regionLabel = uniqueRegions[0];
    } else if (uniqueRegions.length > 1 && uniqueRegions.length <= 3) {
        regionLabel = uniqueRegions.join('_');
    } else if (uniqueRegions.length > 3) {
        if (activeSession && activeSession.config.continent && activeSession.config.continent !== 'All') {
             regionLabel = `${activeSession.config.continent}_Region`;
        } else {
             regionLabel = "Multiple_Countries";
        }
    }

    regionLabel = regionLabel.replace(/[^a-zA-Z0-9-_]/g, '_');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LeadList_${regionLabel}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-950 relative">
      {/* Confirmation Modal */}
      {pendingAutoPilotSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-6 shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      <span className="w-3 h-3 bg-primary-500 rounded-full animate-pulse"></span>
                      Enable Auto-Pilot?
                  </h3>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                      This will authorize the AI Agent to run <strong>automated background searches</strong> every 60 seconds to find new leads for this campaign.
                      <br/><br/>
                      <span className="text-yellow-500 text-xs uppercase font-bold tracking-wide">Note:</span> This process consumes API resources.
                  </p>
                  <div className="flex justify-end gap-3">
                      <button 
                          onClick={() => setPendingAutoPilotSession(null)}
                          className="px-4 py-2 rounded text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={confirmEnableAutoPilot}
                          className="px-4 py-2 rounded text-sm font-bold bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-900/20 transition-all"
                      >
                          Confirm & Enable
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Delete Confirmation Modal */}
      {pendingDeleteSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-6 shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      <span className="text-red-500">⚠️</span>
                      Delete Campaign?
                  </h3>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                      Are you sure you want to delete this campaign and all its collected leads? This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-3">
                      <button 
                          onClick={() => setPendingDeleteSession(null)}
                          className="px-4 py-2 rounded text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={confirmDeleteSession}
                          className="px-4 py-2 rounded text-sm font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 transition-all"
                      >
                          Delete Permanently
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                Agency Delivery Hub
            </h2>
            <p className="text-slate-400 text-sm mt-1">Manage client projects and export verified lead lists.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto bg-slate-900/50 p-2 rounded-lg border border-slate-800">
              {/* Project Filter */}
              <select 
                value={filterSessionId}
                onChange={(e) => {
                    setFilterSessionId(e.target.value);
                    setFilterRegion('ALL');
                }}
                className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 flex-grow xl:w-64"
              >
                  <option value="ALL">All Client Projects ({sessions.length})</option>
                  {sessions.map(s => (
                      <option key={s.id} value={s.id}>
                          {s.name} ({new Date(s.createdAt).toLocaleDateString()})
                      </option>
                  ))}
              </select>

              {/* Region/Country Filter */}
              <select 
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 flex-grow xl:w-48"
              >
                  <option value="ALL">All Regions</option>
                  {availableRegions.map(r => (
                      <option key={r} value={r}>{r}</option>
                  ))}
              </select>

              {/* Auto Pilot Toggle */}
              {activeSession && (
                  <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded px-3 py-1.5">
                          <span className={`w-2 h-2 rounded-full ${activeSession.isAutoPilotEnabled ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></span>
                          <span className="text-xs font-bold text-slate-300">Auto-Pilot</span>
                          <button 
                              onClick={() => handleToggleClick(activeSession.id, activeSession.isAutoPilotEnabled)}
                              className={`ml-1 w-8 h-4 rounded-full transition-colors relative ${activeSession.isAutoPilotEnabled ? 'bg-primary-600' : 'bg-slate-600'}`}
                          >
                              <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${activeSession.isAutoPilotEnabled ? 'translate-x-4' : 'translate-x-0'}`}></span>
                          </button>
                      </div>
                      
                      {/* Delete Button */}
                      <button 
                          onClick={() => setPendingDeleteSession(activeSession.id)}
                          className="p-2 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 text-red-400 rounded transition-colors"
                          title="Delete Campaign"
                      >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                  </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                  <button 
                      onClick={handleCopyToClipboard}
                      disabled={filteredLeads.length === 0}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                      {copyFeedback ? (
                          <span className="text-green-400">{copyFeedback}</span>
                      ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                            Copy to Excel
                          </>
                      )}
                  </button>
                  <button 
                      onClick={handleExportCSV}
                      disabled={filteredLeads.length === 0}
                      className="px-3 py-2 bg-primary-700 hover:bg-primary-600 text-white rounded text-xs font-bold transition-colors disabled:opacity-50 disabled:bg-slate-700 flex items-center gap-2 shadow-lg shadow-primary-900/20"
                  >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Download CSV
                  </button>
              </div>
          </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total Leads</div>
              <div className="text-2xl font-mono text-white">{totalLeads}</div>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">In Negotiation</div>
              <div className="text-2xl font-mono text-yellow-400">{activeNegotiations}</div>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Closed Won</div>
              <div className="text-2xl font-mono text-green-400">{confirmedOrders}</div>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Conversion Rate</div>
              <div className="text-2xl font-mono text-blue-400">{conversionRate}%</div>
          </div>
      </div>

      {/* Activity Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-800/50">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Recent System Activity</h3>
          </div>
          <div className="divide-y divide-slate-800">
              {allLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-600 text-sm">No recent activity found.</div>
              ) : (
                  allLogs.map((log, idx) => (
                      <div key={idx} className="p-3 flex items-start gap-3 hover:bg-slate-800/30 transition-colors">
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 mt-0.5">
                              {log.timestamp}
                          </span>
                          <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                      log.actor === 'AGENT' ? 'bg-primary-900/30 text-primary-400' : 
                                      log.actor === 'SYSTEM' ? 'bg-slate-800 text-slate-400' : 'bg-green-900/30 text-green-400'
                                  }`}>
                                      {log.actor}
                                  </span>
                                  <span className="text-xs font-bold text-slate-300 truncate">{log.companyName}</span>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed break-words">{log.message}</p>
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>
    </div>
  );
};
