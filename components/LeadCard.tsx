
import React from 'react';
import { Lead, LeadStatus } from '../types';

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  isActive: boolean;
}

const statusColors = {
  [LeadStatus.DISCOVERED]: 'bg-slate-700 text-slate-300',
  [LeadStatus.CONTACTING]: 'bg-yellow-900 text-yellow-100',
  [LeadStatus.NEGOTIATING]: 'bg-purple-900 text-purple-100',
  [LeadStatus.CLOSED_WON]: 'bg-green-900 text-green-100',
  [LeadStatus.CLOSED_LOST]: 'bg-red-900 text-red-100',
};

// Helper to assign colors to dynamic territory vectors
const getVectorColor = (vectorName?: string) => {
    if (!vectorName) return "text-slate-400 bg-slate-800 border-slate-700";
    
    // Legacy / Static mapping
    if (vectorName.includes("Commercial")) return "text-blue-400 bg-blue-900/30 border-blue-800";
    if (vectorName.includes("Competitor")) return "text-orange-400 bg-orange-900/30 border-orange-800";
    
    // Dynamic Territory Mapping (Matches the 4 squads based on order or content)
    // We can't know the exact city names, so we hash or rotate.
    // Simple heuristic: 
    const hash = vectorName.length;
    if (hash % 4 === 0) return "text-blue-400 bg-blue-900/30 border-blue-800"; // Alpha
    if (hash % 4 === 1) return "text-teal-400 bg-teal-900/30 border-teal-800"; // Bravo
    if (hash % 4 === 2) return "text-purple-400 bg-purple-900/30 border-purple-800"; // Charlie
    return "text-pink-400 bg-pink-900/30 border-pink-800"; // Delta
};

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onClick, isActive }) => {
  const vectorClass = getVectorColor(lead.searchVector);

  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-lg relative ${
        isActive 
          ? 'bg-slate-800 border-primary-500 shadow-primary-500/20' 
          : 'bg-slate-900 border-slate-700 hover:border-slate-600'
      }`}
    >
      {lead.isNew && (
        <span className="absolute top-0 right-0 -mt-2 -mr-2 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-primary-500 text-[8px] text-white items-center justify-center font-bold">N</span>
        </span>
      )}
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-white text-lg truncate flex-1 pr-2">{lead.companyName}</h3>
        <div className="flex items-center gap-1 shrink-0">
            {!lead.website && (
                <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded flex items-center gap-1" title="Offline / Maps Only">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" /></svg>
                </span>
            )}
            {lead.googleMapsUrl && (
                <a href={lead.googleMapsUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-500 hover:text-blue-400 transition-colors" title="View on Google Maps">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </a>
            )}
            {lead.sourceUrl && (
                 <a href={lead.sourceUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-green-500 hover:text-green-400 transition-colors" title="Verified via Search">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </a>
            )}
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase ${statusColors[lead.status]}`}>
            {lead.status.replace('_', ' ')}
          </span>
          {lead.searchVector && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold tracking-tight truncate max-w-[120px] ${vectorClass}`}>
                  📍 {lead.searchVector.replace('Territory Scout: ', '')}
              </span>
          )}
      </div>
      
      <p className="text-slate-400 text-sm mb-3 line-clamp-2">
        {lead.summary || "No summary available."}
      </p>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {lead.region}
        </div>
        <div className="flex items-center gap-1" title="AI Match Confidence">
            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            {lead.confidenceScore}%
        </div>
      </div>
    </div>
  );
};
