import React, { useState } from 'react';
import { MarketReport, StatPoint } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface MarketReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: MarketReport | null;
  region: string;
}

// Simple Horizontal Bar Chart Component
const HorizontalBarChart = ({ 
    data, 
    colorClass, 
    valueFormatter = (v) => `${v}%` 
}: { 
    data: StatPoint[], 
    colorClass: string, 
    valueFormatter?: (val: number) => string 
}) => {
    if (!data || data.length === 0) return <div className="text-slate-500 text-xs italic">No data available</div>;
    const max = Math.max(...data.map(d => d.value));
    
    return (
        <div className="space-y-3">
            {data.map((d, i) => (
                <div key={i} className="group">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">{d.label}</span>
                        <span className="text-slate-400 font-mono">{valueFormatter(d.value)}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                        <div 
                            style={{ width: `${(d.value / max) * 100}%` }} 
                            className={`h-full rounded-full ${colorClass} transition-all duration-1000`}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Simple Vertical Bar Chart Component
const VerticalBarChart = ({ 
    data, 
    colorClass,
    valueFormatter = (v) => `${v}%`
}: { 
    data: StatPoint[], 
    colorClass: string,
    valueFormatter?: (val: number) => string
}) => {
    if (!data || data.length === 0) return <div className="text-slate-500 text-xs italic">No data available</div>;
    const max = Math.max(...data.map(d => d.value));

    return (
        <div className="flex items-end justify-between h-40 pt-6 pb-2 space-x-2">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group h-full justify-end">
                    <div className="w-full max-w-[2rem] bg-slate-800 rounded-t-sm relative flex items-end h-full group-hover:bg-slate-700 transition-colors">
                         <div 
                            style={{ height: `${Math.min((d.value / max) * 100, 100)}%` }} 
                            className={`w-full ${colorClass} rounded-t-sm transition-all duration-1000 relative`}
                         >
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 px-1 rounded whitespace-nowrap z-10">
                                {valueFormatter(d.value)}
                            </span>
                         </div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 rotate-0 truncate w-full text-center">{d.label}</span>
                </div>
            ))}
        </div>
    );
};

export const MarketReportModal: React.FC<MarketReportModalProps> = ({ isOpen, onClose, report, region }) => {
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !report) return null;

  // Helper to detect if growth stats are percentages or absolute values
  const getGrowthFormatter = () => {
      const values = report.stats?.growthTrend?.map(d => d.value) || [];
      if (values.length === 0) return (v: number) => `${v}%`;
      
      const maxVal = Math.max(...values);
      // If values are consistently small (e.g. < 50), likely percentages. 
      // If larger (e.g. > 100), likely Market Size in Millions.
      if (maxVal > 100) {
          return (v: number) => {
              if (v >= 1000) return `$${(v / 1000).toFixed(1)}B`; // Assume Billions if huge or k if Millions? Let's assume input is Millions, so 1000M = 1B
              return `$${v}M`;
          };
      }
      return (v: number) => `${v}%`;
  };

  const growthFormatter = getGrowthFormatter();

  const handleExportPDF = async () => {
      // Target the specifically designed PRINT container, not the modal UI
      const input = document.getElementById('report-print-container');
      if (!input) return;
      
      setIsExporting(true);
      try {
          // Use html2canvas to render the print template
          const canvas = await html2canvas(input, {
              scale: 2, // High resolution
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff' // Ensure white background for the document
          });

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          
          // Create PDF dimensions based on the rendered content
          const pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'px',
              format: [imgWidth, imgHeight]
          });

          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
          pdf.save(`TradeNexus_MarketReport_${region}_${new Date().toISOString().split('T')[0]}.pdf`);
      } catch (error) {
          console.error("Failed to export PDF", error);
          alert("Could not generate PDF. Please try again.");
      } finally {
          setIsExporting(false);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      {/* 
        ----------------------------------------------------------------------------------
        HIDDEN PRINT TEMPLATE 
        ----------------------------------------------------------------------------------
      */}
      <div id="report-print-container" className="fixed left-[-9999px] top-0 w-[800px] bg-white text-slate-900 p-12 font-sans z-[-1]">
            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Market Intelligence Report</h1>
                    <h2 className="text-2xl text-primary-600 font-semibold">{region}</h2>
                </div>
                <div className="text-right">
                    <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Generated By</div>
                    <div className="text-lg font-bold text-slate-900">TradeNexus AI</div>
                    <div className="text-sm text-slate-500">{new Date().toLocaleDateString()}</div>
                </div>
            </div>

            {/* Executive Metrics Grid */}
            <div className="grid grid-cols-3 gap-6 mb-10">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">HS Code Strategy</div>
                    <div className="text-xl font-mono font-bold text-slate-900 leading-tight">{report.hsCode || "N/A"}</div>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Import Duty</div>
                    <div className="text-xl font-mono font-bold text-slate-900 leading-tight">{report.importDuty || "N/A"}</div>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Shipping Time</div>
                    <div className="text-xl font-mono font-bold text-slate-900 leading-tight">{report.shippingTime || "N/A"}</div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-2 gap-10">
                {/* Left Column */}
                <div className="space-y-8">
                    <section>
                        <h3 className="text-sm font-bold text-primary-700 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">Market Overview</h3>
                        <p className="text-sm leading-relaxed text-slate-800 text-justify">{report.overview}</p>
                    </section>
                     {/* STATS: GROWTH */}
                    {report.stats?.growthTrend && report.stats.growthTrend.length > 0 && (
                        <section>
                            <h3 className="text-sm font-bold text-primary-700 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">Growth Forecast</h3>
                            <div className="h-32 flex items-end space-x-4">
                                {report.stats.growthTrend.map((d, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center">
                                        <div style={{ height: `${(d.value / Math.max(...report.stats!.growthTrend.map(g=>g.value))) * 100}%` }} className="w-full bg-primary-600 rounded-t"></div>
                                        <span className="text-[10px] mt-1">{d.label}</span>
                                        <span className="text-[10px] font-bold">{growthFormatter(d.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                    <section>
                        <h3 className="text-sm font-bold text-primary-700 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">Price Structure</h3>
                        <div className="p-3 bg-slate-50 rounded border border-slate-200 text-sm font-mono text-slate-800">
                            {report.priceStructure}
                        </div>
                    </section>
                </div>
                
                {/* Right Column */}
                <div className="space-y-8">
                    {/* STATS: COMPETITORS */}
                    <section>
                        <h3 className="text-sm font-bold text-primary-700 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">Competitor Market Share</h3>
                        <div className="space-y-2">
                             {report.stats?.competitorShare?.map((d, i) => (
                                 <div key={i}>
                                     <div className="flex justify-between text-xs mb-1">
                                         <span>{d.label}</span>
                                         <span className="font-bold">{d.value}%</span>
                                     </div>
                                     <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                         <div style={{ width: `${d.value}%` }} className="bg-red-500 h-full"></div>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </section>
                    
                     {/* STATS: SEGMENTS */}
                    <section>
                        <h3 className="text-sm font-bold text-primary-700 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">End-User Segmentation</h3>
                        <div className="space-y-2">
                             {report.stats?.userSegments?.map((d, i) => (
                                 <div key={i}>
                                     <div className="flex justify-between text-xs mb-1">
                                         <span>{d.label}</span>
                                         <span className="font-bold">{d.value}%</span>
                                     </div>
                                     <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                         <div style={{ width: `${d.value}%` }} className="bg-indigo-500 h-full"></div>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-sm font-bold text-primary-700 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">Compliance & Regulations</h3>
                        <p className="text-sm leading-relaxed text-slate-800 text-justify">{report.regulations}</p>
                    </section>
                </div>
            </div>
            
            {/* Secondary Rows */}
            <div className="grid grid-cols-2 gap-10 mt-8">
                <section>
                    <h3 className="text-sm font-bold text-primary-700 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">Localization Requirements</h3>
                    <p className="text-sm leading-relaxed text-slate-800">{report.localization}</p>
                </section>
                <section>
                    <h3 className="text-sm font-bold text-primary-700 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">Key Trade Events & Expos</h3>
                    <ul className="space-y-1">
                        {report.tradeShows && report.tradeShows.length > 0 ? report.tradeShows.map((s,i) => (
                            <li key={i} className="text-sm text-slate-800 flex items-start gap-2">
                                <span className="text-slate-400 mt-0.5">🗓</span> {s}
                            </li>
                        )) : <li className="text-sm text-slate-500">No events listed</li>}
                    </ul>
                </section>
            </div>

            {/* References Footer */}
            {report.sources && report.sources.length > 0 && (
                <div className="mt-12 pt-6 border-t border-slate-200">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Grounding Sources (Google Verified)</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {report.sources.map((s, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-slate-500">
                                <span className="font-bold text-slate-700">[{i+1}]</span>
                                <div className="break-all">
                                    <div className="font-medium text-slate-800">{s.title}</div>
                                    <div className="text-slate-400">{s.url}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
      </div>

      {/* 
        ----------------------------------------------------------------------------------
        VISIBLE MODAL UI (Dark Mode)
        ----------------------------------------------------------------------------------
      */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full md:w-[95%] max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-700 bg-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-primary-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7m0 0L9.553 4.276A1 1 0 009 5.618v10.764" /></svg>
              </span>
              Market Intelligence: <span className="text-white">{region}</span>
            </h2>
            <p className="text-slate-400 text-sm mt-1">Deep Dive Report • Real-time data via Google Search</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
             <button 
                onClick={handleExportPDF} 
                disabled={isExporting}
                className="flex-1 md:flex-none justify-center flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white transition-colors disabled:opacity-50 border border-slate-600"
             >
                {isExporting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                )}
                Export PDF
             </button>
             <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>
        </div>

        {/* Modal Content (Dark Mode) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900 p-4 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-lg">
                    <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">HS Code Strategy</h4>
                    <div className="text-xl md:text-2xl font-mono text-white font-bold">{report.hsCode || "N/A"}</div>
                    <p className="text-xs text-slate-400 mt-1">Customs Classification Advice</p>
                </div>
                <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-lg">
                    <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Est. Import Duty</h4>
                    <div className="text-xl md:text-2xl font-mono text-yellow-400 font-bold">{report.importDuty || "N/A"}</div>
                    <p className="text-xs text-slate-400 mt-1">Impact on Margins</p>
                </div>
                <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-lg">
                    <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Shipping Time</h4>
                    <div className="text-xl md:text-2xl font-mono text-blue-400 font-bold">{report.shippingTime || "N/A"}</div>
                    <p className="text-xs text-slate-400 mt-1">Estimated Sea Freight Duration</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-8">
                <section>
                  <h3 className="text-primary-400 font-bold uppercase tracking-wider text-sm mb-3 border-b border-primary-900/50 pb-1">Market Overview</h3>
                  <p className="text-slate-300 leading-relaxed text-sm">{report.overview}</p>
                </section>
                
                {/* CHART: Growth Trend */}
                {report.stats?.growthTrend && report.stats.growthTrend.length > 0 && (
                    <section>
                         <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-3 border-b border-emerald-900/50 pb-1">Market Growth Forecast</h3>
                         <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                             <VerticalBarChart 
                                data={report.stats.growthTrend} 
                                colorClass="bg-emerald-500" 
                                valueFormatter={growthFormatter}
                             />
                         </div>
                    </section>
                )}

                <section>
                    <h3 className="text-green-400 font-bold uppercase tracking-wider text-sm mb-3 border-b border-green-900/50 pb-1">Price Structure Analysis</h3>
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded font-mono text-xs md:text-sm text-green-300 shadow-inner overflow-x-auto">
                        {report.priceStructure}
                    </div>
                </section>
                <section>
                  <h3 className="text-indigo-400 font-bold uppercase tracking-wider text-sm mb-3 border-b border-indigo-900/50 pb-1">Product Localization</h3>
                  <div className="p-4 bg-indigo-900/10 border border-indigo-900/30 rounded-lg">
                      <p className="text-indigo-200 leading-relaxed text-sm">{report.localization}</p>
                  </div>
                </section>
              </div>

              <div className="space-y-8">
                {/* CHART: Competitor Share */}
                {report.stats?.competitorShare && report.stats.competitorShare.length > 0 && (
                    <section>
                        <h3 className="text-red-400 font-bold uppercase tracking-wider text-sm mb-3 border-b border-red-900/50 pb-1">Competitor Market Share</h3>
                        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                             <HorizontalBarChart data={report.stats.competitorShare} colorClass="bg-red-500" />
                        </div>
                    </section>
                )}

                {/* CHART: User Segmentation */}
                {report.stats?.userSegments && report.stats.userSegments.length > 0 && (
                    <section>
                        <h3 className="text-blue-400 font-bold uppercase tracking-wider text-sm mb-3 border-b border-blue-900/50 pb-1">User Segmentation</h3>
                        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                             <HorizontalBarChart data={report.stats.userSegments} colorClass="bg-blue-500" />
                        </div>
                    </section>
                )}
                
                <section>
                  <h3 className="text-yellow-400 font-bold uppercase tracking-wider text-sm mb-3 border-b border-yellow-900/50 pb-1">Regulations & Compliance</h3>
                  <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                     <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <p className="text-slate-300 text-sm leading-relaxed">{report.regulations}</p>
                     </div>
                  </div>
                </section>
                <section>
                    <h3 className="text-slate-400 font-bold uppercase tracking-wider text-sm mb-3 border-b border-slate-700/50 pb-1">Entry Strategy</h3>
                    <p className="text-slate-300 leading-relaxed text-sm italic">"{report.entryStrategy}"</p>
                </section>
              </div>
            </div>

            {report.sources && report.sources.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-700">
                    <h3 className="text-slate-500 font-bold uppercase tracking-wider text-sm mb-3 flex items-center gap-2">
                        Data Sources
                        <span className="text-[10px] font-normal bg-slate-800 px-2 py-0.5 rounded text-slate-400">Verified by Google Search</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {report.sources.map((source, idx) => (
                            <a key={idx} href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-slate-400 hover:text-primary-400 transition-colors p-2 bg-slate-800/50 rounded border border-slate-700/50 hover:border-slate-600 group">
                                <span className="bg-slate-700 text-slate-300 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold shrink-0 group-hover:bg-primary-900 group-hover:text-primary-300 transition-colors">{idx + 1}</span>
                                <div className="flex-1 truncate">
                                    <div className="truncate font-medium text-slate-300 group-hover:text-primary-300">{source.title}</div>
                                    <div className="truncate text-[10px] opacity-60">{source.url}</div>
                                </div>
                                <svg className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                        ))}
                    </div>
                </div>
             )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800 flex justify-end">
           <button onClick={onClose} className="w-full md:w-auto px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors">
             Close Report
           </button>
        </div>
      </div>
    </div>
  );
};