
import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Lead, StrategicContext, ChatMessage, LeadStatus } from '../types';
import { generateProspectingMessage } from '../services/geminiService';
import { discoverSocialForCompany, discoverLeadsFromSocial } from '../services/agent/socialDiscoveryService';
import type { SocialProfileEvidence } from '../types/evidenceTypes';
import { verifyLead } from '../services/agent/verificationService';
import { scoreLead } from '../services/agent/leadScoringService';
import { getNextBestActions } from '../services/agent/nextBestActionService';
import { getClosingStrategy, generateOutreachDraft } from '../services/agent/outreachService';
import type { LeadVerification, LeadScoreBreakdown } from '../types/evidenceTypes';
import type { AgentRecommendation, OutreachDraft } from '../types/agentTypes';
import type { ClosingStrategy } from '../server/agent/outreach/closingStrategy';

interface InteractionViewerProps {
  lead: Lead;
  productContext?: StrategicContext;
  onUpdateLead?: (lead: Lead) => void;
}

export const InteractionViewer: React.FC<InteractionViewerProps> = ({ lead, productContext, onUpdateLead }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState<'logs' | 'chat' | 'dossier'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isDiscoveringSocial, setIsDiscoveringSocial] = useState(false);
  const [socialDiscoveryError, setSocialDiscoveryError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [isGettingRecommendations, setIsGettingRecommendations] = useState(false);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [outreachError, setOutreachError] = useState<string | null>(null);

  const handleStatusChange = (newStatus: LeadStatus) => {
      if (onUpdateLead) {
          onUpdateLead({ ...lead, status: newStatus });
      }
  };

  const handleNextStepsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onUpdateLead) {
          onUpdateLead({ ...lead, nextSteps: e.target.value });
      }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lead.logs]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [lead.chatHistory, activeTab]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !onUpdateLead) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: Date.now()
    };

    // Optimistic update
    const newHistory = [...(lead.chatHistory || []), userMsg];
    const updatedLead = { ...lead, chatHistory: newHistory };
    onUpdateLead(updatedLead);
    
    setChatInput('');
    setIsChatLoading(true);

    try {
      const responseText = await generateProspectingMessage(newHistory, lead, productContext);
      
      const aiMsg: ChatMessage = {
        role: 'model',
        content: responseText,
        timestamp: Date.now()
      };

      const finalHistory = [...newHistory, aiMsg];
      onUpdateLead({ ...lead, chatHistory: finalHistory });

    } catch (error) {
      console.error("Chat failed:", error);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg border border-slate-700 overflow-hidden shadow-2xl">
        {/* Header with Title and Quick Links */}
        <div className="p-4 md:p-5 border-b border-slate-700 bg-slate-800 flex flex-col md:flex-row justify-between items-start shrink-0 gap-3">
            <div>
                <h2 className="text-lg md:text-xl text-white font-bold tracking-tight flex items-center gap-2">
                    {lead.companyName}
                    {lead.googleMapsUrl && (
                        <a href={lead.googleMapsUrl} target="_blank" rel="noreferrer" title="View on Maps" className="text-slate-400 hover:text-blue-400 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </a>
                    )}
                </h2>
                <div className="text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                    <span className="bg-slate-700 px-2 py-0.5 rounded text-xs text-slate-300">{lead.region}</span>
                    <span className="text-slate-500">•</span>
                    <span>Confidence Match: <span className="text-primary-400 font-bold">{lead.confidenceScore}%</span></span>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                 {lead.sourceUrl && (
                     <a href={lead.sourceUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-green-900/50 hover:bg-green-900/80 border border-green-700/50 rounded text-xs font-medium text-green-400 transition-colors flex items-center gap-1" title="Verified via Search Grounding">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Verified Source
                     </a>
                 )}
                 {lead.website && (
                     <a href={lead.website} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs font-medium text-white transition-colors flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        Website
                     </a>
                 )}
                 {lead.socialProfiles?.find(s => s.platform.toLowerCase().includes('linkedin')) && (
                     <a href={lead.socialProfiles?.find(s => s.platform.toLowerCase().includes('linkedin'))?.url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 rounded text-xs font-medium text-white transition-colors">
                        LinkedIn
                     </a>
                 )}
            </div>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col">
            {/* Intelligence Dossier Panel - Moved to Tabs */}
            <div className="hidden">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Intelligence Dossier</h3>
                
                {/* Deal Progress Tracking */}
                <div className="mb-6 p-4 bg-slate-800/80 rounded-lg border border-slate-700 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${lead.status === LeadStatus.CLOSED_WON ? 'bg-green-500' : lead.status === LeadStatus.CLOSED_LOST ? 'bg-red-500' : 'bg-primary-500'}`}></span>
                        Deal Progress
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1.5">Current Status</label>
                            <select 
                                value={lead.status}
                                onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-xs text-white focus:border-primary-500 focus:outline-none transition-colors"
                            >
                                {Object.values(LeadStatus).map(status => (
                                    <option key={status} value={status}>{status.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1.5">Next Steps / Notes</label>
                            <textarea
                                value={lead.nextSteps || ''}
                                onChange={handleNextStepsChange}
                                placeholder="e.g. Follow up on Tuesday regarding pricing..."
                                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-xs text-slate-300 focus:border-primary-500 focus:outline-none transition-colors min-h-[80px] resize-none placeholder-slate-600"
                            />
                        </div>
                    </div>
                </div>

                {/* Match Analysis */}
                {lead.matchDetails && (
                    <div className="mb-6 space-y-3">
                        <div className="p-3 bg-slate-800/60 rounded border border-slate-700/60 relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                             <div className="flex items-center gap-2 mb-1.5">
                                <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Industry Fit</span>
                             </div>
                             <p className="text-xs text-slate-300 leading-relaxed">{lead.matchDetails.industryFit}</p>
                        </div>

                        <div className="p-3 bg-slate-800/60 rounded border border-slate-700/60 relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                             <div className="flex items-center gap-2 mb-1.5">
                                <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Company Size Fit</span>
                             </div>
                             <p className="text-xs text-slate-300 leading-relaxed">{lead.matchDetails.sizeFit}</p>
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="space-y-4 mb-6">
                    <div className="p-3 bg-slate-800 rounded border border-slate-700">
                        <div className="text-xs text-slate-400 mb-1">Estimated Revenue</div>
                        <div className="text-sm font-mono text-white">{lead.revenue || 'Not Available'}</div>
                    </div>
                    <div className="p-3 bg-slate-800 rounded border border-slate-700">
                        <div className="text-xs text-slate-400 mb-1">Company Size</div>
                        <div className="text-sm font-mono text-white">{lead.employeeCount ? `${lead.employeeCount} Employees` : 'Not Available'}</div>
                    </div>
                </div>

                {/* Operations */}
                <div className="mb-6 space-y-3">
                     <h4 className="text-[10px] font-bold text-slate-600 uppercase">Operational Capacity</h4>
                     <div className="grid grid-cols-1 gap-3">
                         <div className="p-3 bg-slate-800 rounded border border-slate-700 flex flex-col">
                             <span className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Import Volume</span>
                             <span className="text-sm text-white font-medium">{lead.tradeVolume || 'N/A'}</span>
                         </div>
                         <div className="p-3 bg-slate-800 rounded border border-slate-700 flex flex-col">
                             <span className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Production/Capacity</span>
                             <span className="text-sm text-white font-medium">{lead.manufacturingVolume || 'N/A'}</span>
                         </div>
                     </div>
                </div>

                {/* Contact Info */}
                <div className="mb-6">
                    <h4 className="text-[10px] font-bold text-slate-600 uppercase mb-2">Contact Details</h4>
                    <ul className="space-y-2 text-sm text-slate-300">
                        <li className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            <span className="break-all">{lead.contactEmail || 'N/A'}</span>
                        </li>
                        <li className="flex items-start gap-2">
                             <svg className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            <span>{lead.phoneNumber || 'N/A'}</span>
                        </li>
                        <li className="flex items-start gap-2">
                             <svg className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                             {lead.googleMapsUrl ? (
                                <a href={lead.googleMapsUrl} target="_blank" rel="noreferrer" className="text-xs leading-relaxed text-blue-400 hover:underline">
                                    {lead.address || 'View on Google Maps'}
                                </a>
                             ) : (
                                <span className="text-xs leading-relaxed">{lead.address || 'Location not found'}</span>
                             )}
                        </li>
                    </ul>
                </div>

                {/* Socials */}
                {lead.socialProfiles && lead.socialProfiles.length > 0 && (
                    <div>
                         <h4 className="text-[10px] font-bold text-slate-600 uppercase mb-2">Social Presence</h4>
                         <div className="flex flex-wrap gap-2">
                             {lead.socialProfiles.map((social, i) => (
                                 <a key={i} href={social.url} target="_blank" rel="noreferrer" className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-slate-300 transition-colors">
                                     {social.platform}
                                 </a>
                             ))}
                         </div>
                    </div>
                )}
            </div>

            {/* Right Panel: Logs & Chat */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-950/30 min-w-0 overflow-hidden">
                 {/* Tabs */}
                 <div className="px-4 md:px-5 py-3 border-b border-slate-800/50 bg-slate-900/20 flex gap-4 overflow-x-auto scrollbar-hide shrink-0">
                    <button 
                        onClick={() => setActiveTab('dossier')}
                        className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'dossier' ? 'text-primary-400 border-primary-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                    >
                        Intelligence Dossier
                    </button>
                    <button 
                        onClick={() => setActiveTab('logs')}
                        className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'logs' ? 'text-primary-400 border-primary-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                    >
                        Discovery Logs
                    </button>
                    <button 
                        onClick={() => setActiveTab('chat')}
                        className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'chat' ? 'text-primary-400 border-primary-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                    >
                        Prospecting Assistant
                    </button>
                 </div>

                 {/* DOSSIER TAB */}
                 {activeTab === 'dossier' && (
                    <div className="flex-1 overflow-y-auto p-4 md:p-5 custom-scrollbar">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Intelligence Dossier</h3>
                        
                        {/* Deal Progress Tracking */}
                        <div className="mb-6 p-4 bg-slate-800/80 rounded-lg border border-slate-700 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${lead.status === LeadStatus.CLOSED_WON ? 'bg-green-500' : lead.status === LeadStatus.CLOSED_LOST ? 'bg-red-500' : 'bg-primary-500'}`}></span>
                                Deal Progress
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1.5">Current Status</label>
                                    <select 
                                        value={lead.status}
                                        onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                                        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-xs text-white focus:border-primary-500 focus:outline-none transition-colors"
                                    >
                                        {Object.values(LeadStatus).map(status => (
                                            <option key={status} value={status}>{status.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1.5">Next Steps / Notes</label>
                                    <textarea
                                        value={lead.nextSteps || ''}
                                        onChange={handleNextStepsChange}
                                        placeholder="e.g. Follow up on Tuesday regarding pricing..."
                                        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-xs text-slate-300 focus:border-primary-500 focus:outline-none transition-colors min-h-[80px] resize-none placeholder-slate-600"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Match Analysis */}
                        {lead.matchDetails && (
                            <div className="mb-6 space-y-3">
                                <div className="p-3 bg-slate-800/60 rounded border border-slate-700/60 relative overflow-hidden">
                                     <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                                     <div className="flex items-center gap-2 mb-1.5">
                                        <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Industry Fit</span>
                                     </div>
                                     <p className="text-xs text-slate-300 leading-relaxed">{lead.matchDetails.industryFit}</p>
                                </div>

                                <div className="p-3 bg-slate-800/60 rounded border border-slate-700/60 relative overflow-hidden">
                                     <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                     <div className="flex items-center gap-2 mb-1.5">
                                        <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Company Size Fit</span>
                                     </div>
                                     <p className="text-xs text-slate-300 leading-relaxed">{lead.matchDetails.sizeFit}</p>
                                </div>
                            </div>
                        )}

                        {/* Competitive Analysis */}
                        {lead.competitors && lead.competitors.length > 0 && (
                            <div className="mb-6 space-y-3">
                                <h4 className="text-[10px] font-bold text-slate-600 uppercase">Competitive Landscape</h4>
                                {lead.competitors.map((comp, idx) => (
                                    <div key={idx} className="p-3 bg-slate-800/60 rounded border border-slate-700/60">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-white">{comp.name}</span>
                                            <span className="text-[10px] bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded border border-red-900/50">Incumbent</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <div>
                                                <div className="text-[10px] text-slate-500 uppercase mb-1">Strengths</div>
                                                <p className="text-xs text-slate-300">{comp.strengths}</p>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-slate-500 uppercase mb-1">Weaknesses</div>
                                                <p className="text-xs text-slate-300">{comp.weaknesses}</p>
                                            </div>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-slate-700/50">
                                            <div className="text-[10px] text-emerald-500 uppercase font-bold mb-1">Displacement Strategy</div>
                                            <p className="text-xs text-slate-200 italic">"{comp.displacementStrategy}"</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Stats */}
                        <div className="space-y-4 mb-6">
                            <div className="p-3 bg-slate-800 rounded border border-slate-700">
                                <div className="text-xs text-slate-400 mb-1">Estimated Revenue</div>
                                <div className="text-sm font-mono text-white">{lead.revenue || 'Not Available'}</div>
                            </div>
                            <div className="p-3 bg-slate-800 rounded border border-slate-700">
                                <div className="text-xs text-slate-400 mb-1">Company Size</div>
                                <div className="text-sm font-mono text-white">{lead.employeeCount ? `${lead.employeeCount} Employees` : 'Not Available'}</div>
                            </div>
                        </div>

                        {/* Operations */}
                        <div className="mb-6 space-y-3">
                             <h4 className="text-[10px] font-bold text-slate-600 uppercase">Operational Capacity</h4>
                             <div className="grid grid-cols-1 gap-3">
                                 <div className="p-3 bg-slate-800 rounded border border-slate-700 flex flex-col">
                                     <span className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Import Volume</span>
                                     <span className="text-sm text-white font-medium">{lead.tradeVolume || 'N/A'}</span>
                                 </div>
                                 <div className="p-3 bg-slate-800 rounded border border-slate-700 flex flex-col">
                                     <span className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Production/Capacity</span>
                                     <span className="text-sm text-white font-medium">{lead.manufacturingVolume || 'N/A'}</span>
                                 </div>
                             </div>
                        </div>

                        {/* Contact Info */}
                        <div className="mb-6">
                            <h4 className="text-[10px] font-bold text-slate-600 uppercase mb-2">Contact Details</h4>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    <span className="break-all">{lead.contactEmail || 'N/A'}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                     <svg className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    <span>{lead.phoneNumber || 'N/A'}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                     <svg className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                     {lead.googleMapsUrl ? (
                                        <a href={lead.googleMapsUrl} target="_blank" rel="noreferrer" className="text-xs leading-relaxed text-blue-400 hover:underline">
                                            {lead.address || 'View on Google Maps'}
                                        </a>
                                     ) : (
                                        <span className="text-xs leading-relaxed">{lead.address || 'Location not found'}</span>
                                     )}
                                </li>
                            </ul>
                        </div>

                        {/* Social Presence — Enhanced for Phase 2 */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[10px] font-bold text-slate-600 uppercase">Social Presence</h4>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={async () => {
                                  if (!onUpdateLead || isDiscoveringSocial) return;
                                  setIsDiscoveringSocial(true);
                                  setSocialDiscoveryError(null);
                                  try {
                                    const profiles = await discoverSocialForCompany(
                                      lead.companyName,
                                      lead.region,
                                      lead.website,
                                      productContext
                                    );
                                    if (profiles.length > 0) {
                                      onUpdateLead({
                                        ...lead,
                                        socialDiscovery: profiles,
                                        lastAgentAction: 'socialDiscovery',
                                      });
                                    }
                                  } catch (e) {
                                    console.error('Social discovery failed:', e);
                                    setSocialDiscoveryError('Discovery failed. Try again.');
                                  } finally {
                                    setIsDiscoveringSocial(false);
                                  }
                                }}
                                disabled={isDiscoveringSocial}
                                className="px-2 py-1 bg-primary-600/20 hover:bg-primary-600/40 border border-primary-600/30 rounded text-[10px] text-primary-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isDiscoveringSocial ? 'Searching...' : 'Find Social Profiles'}
                              </button>
                              <button
                                onClick={async () => {
                                  if (!onUpdateLead || isDiscoveringSocial) return;
                                  setIsDiscoveringSocial(true);
                                  setSocialDiscoveryError(null);
                                  try {
                                    const result = await discoverLeadsFromSocial(
                                      lead.companyName,
                                      lead.region,
                                      productContext
                                    );
                                    if (result.profiles.length > 0) {
                                      onUpdateLead({
                                        ...lead,
                                        socialDiscovery: result.profiles,
                                        lastAgentAction: 'socialDiscovery',
                                      });
                                    }
                                  } catch (e) {
                                    console.error('Social lead discovery failed:', e);
                                    setSocialDiscoveryError('Discovery failed. Try again.');
                                  } finally {
                                    setIsDiscoveringSocial(false);
                                  }
                                }}
                                disabled={isDiscoveringSocial}
                                className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-600/30 rounded text-[10px] text-emerald-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isDiscoveringSocial ? 'Searching...' : 'Discover Similar'}
                              </button>
                            </div>
                          </div>

                          {socialDiscoveryError && (
                            <p className="text-[10px] text-red-400 mb-2">{socialDiscoveryError}</p>
                          )}

                          {/* Show SocialProfileEvidence if available */}
                          {lead.socialDiscovery && lead.socialDiscovery.length > 0 ? (
                            <div className="space-y-2">
                              {lead.socialDiscovery.map((sp: SocialProfileEvidence, i: number) => (
                                <a
                                  key={sp.id || i}
                                  href={sp.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block p-3 bg-slate-800/60 hover:bg-slate-800 rounded border border-slate-700/60 transition-colors"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-white capitalize">{sp.platform}</span>
                                    <div className="flex items-center gap-2">
                                      {sp.isOfficialLikely && (
                                        <span className="text-[9px] bg-emerald-900/50 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800/50">Official</span>
                                      )}
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                                        sp.activityLevel === 'HIGH' ? 'bg-green-900/30 text-green-400 border-green-800/50' :
                                        sp.activityLevel === 'MEDIUM' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50' :
                                        sp.activityLevel === 'LOW' ? 'bg-slate-700/30 text-slate-400 border-slate-700/50' :
                                        'bg-slate-800/30 text-slate-500 border-slate-700/30'
                                      }`}>
                                        {sp.activityLevel}
                                      </span>
                                    </div>
                                  </div>
                                  {sp.relevanceNotes && (
                                    <p className="text-[10px] text-slate-400 leading-relaxed">{sp.relevanceNotes}</p>
                                  )}
                                  {sp.contactHints && sp.contactHints.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {sp.contactHints.map((hint: string, j: number) => (
                                        <span key={j} className="text-[9px] bg-blue-900/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-800/30">
                                          {hint}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </a>
                              ))}
                            </div>
                          ) : (
                            /* Fallback: show legacy socialProfiles if no socialDiscovery yet */
                            lead.socialProfiles && lead.socialProfiles.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {lead.socialProfiles.map((social, i) => (
                                  <a key={i} href={social.url} target="_blank" rel="noreferrer" className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-slate-300 transition-colors">
                                    {social.platform}
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-600">No social profiles discovered yet.</p>
                            )
                          )}
                        </div>

                        {/* Verification Status — Phase 4 */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[10px] font-bold text-slate-600 uppercase">Verification</h4>
                            <button
                              onClick={async () => {
                                if (!onUpdateLead || isVerifying) return;
                                setIsVerifying(true);
                                try {
                                  const verification = await verifyLead(lead, productContext as any);
                                  onUpdateLead({
                                    ...lead,
                                    verification,
                                    lastAgentAction: 'verifyLead',
                                  });
                                } catch (e) {
                                  console.error('Verification failed:', e);
                                } finally {
                                  setIsVerifying(false);
                                }
                              }}
                              disabled={isVerifying}
                              className="px-2 py-1 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-600/30 rounded text-[10px] text-purple-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isVerifying ? 'Verifying...' : 'Verify Lead'}
                            </button>
                          </div>

                          {lead.verification ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                  lead.verification.status === 'VERIFIED' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50' :
                                  lead.verification.status === 'PARTIAL' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50' :
                                  lead.verification.status === 'FAILED' ? 'bg-red-900/30 text-red-400 border-red-800/50' :
                                  'bg-slate-800/30 text-slate-400 border-slate-700/30'
                                }`}>
                                  {lead.verification.status}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  Confidence: {Math.round(lead.verification.confidence * 100)}%
                                </span>
                              </div>
                              {lead.verification.checks && lead.verification.checks.length > 0 && (
                                <div className="space-y-1">
                                  {lead.verification.checks.map((check, i) => (
                                    <div key={check.id || i} className="flex items-center justify-between p-2 bg-slate-800/40 rounded border border-slate-700/40">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[9px] w-12 text-center px-1 py-0.5 rounded ${
                                          check.status === 'PASS' ? 'bg-emerald-900/20 text-emerald-400' :
                                          check.status === 'FAIL' ? 'bg-red-900/20 text-red-400' :
                                          check.status === 'WARNING' ? 'bg-yellow-900/20 text-yellow-400' :
                                          'bg-slate-700/20 text-slate-500'
                                        }`}>
                                          {check.status}
                                        </span>
                                        <span className="text-[10px] text-slate-400">{check.type.replace(/_/g, ' ')}</span>
                                      </div>
                                      <span className="text-[9px] text-slate-600">{Math.round(check.confidence * 100)}%</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-600">Not verified yet.</p>
                          )}
                        </div>

                        {/* Lead Scoring — Phase 4 */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[10px] font-bold text-slate-600 uppercase">Lead Score</h4>
                            <button
                              onClick={async () => {
                                if (!onUpdateLead || isScoring) return;
                                setIsScoring(true);
                                try {
                                  const scoreBreakdown = await scoreLead(lead, productContext as any);
                                  onUpdateLead({
                                    ...lead,
                                    scoreBreakdown,
                                    lastAgentAction: 'scoreLead',
                                  });
                                } catch (e) {
                                  console.error('Scoring failed:', e);
                                } finally {
                                  setIsScoring(false);
                                }
                              }}
                              disabled={isScoring}
                              className="px-2 py-1 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-600/30 rounded text-[10px] text-amber-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isScoring ? 'Scoring...' : 'Score Lead'}
                            </button>
                          </div>

                          {lead.scoreBreakdown ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg font-bold" style={{ color: lead.scoreBreakdown.overall >= 80 ? '#34d399' : lead.scoreBreakdown.overall >= 60 ? '#fbbf24' : lead.scoreBreakdown.overall >= 40 ? '#f97316' : '#ef4444' }}>
                                  {lead.scoreBreakdown.overall}/100
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {lead.scoreBreakdown.overall >= 80 ? 'Strong' : lead.scoreBreakdown.overall >= 60 ? 'Good' : lead.scoreBreakdown.overall >= 40 ? 'Fair' : 'Weak'}
                                </span>
                              </div>
                              {([
                                ['locationFit', 'Location'],
                                ['productFit', 'Product Fit'],
                                ['buyerTypeFit', 'Buyer Type'],
                                ['companySizeFit', 'Size'],
                                ['evidenceQuality', 'Evidence'],
                                ['socialActivity', 'Social'],
                                ['contactability', 'Contact'],
                                ['competitiveOpportunity', 'Competition'],
                                ['freshness', 'Freshness'],
                              ] as [string, string][]).map(([key, label]) => {
                                const value = (lead.scoreBreakdown as any)[key] as number;
                                const color = value >= 80 ? '#34d399' : value >= 60 ? '#fbbf24' : value >= 40 ? '#f97316' : '#ef4444';
                                return (
                                  <div key={key} className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400 w-20 flex-shrink-0">{label}</span>
                                    <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
                                    </div>
                                    <span className="text-[10px] text-slate-500 w-6 text-right">{value}</span>
                                  </div>
                                );
                              })}
                              {lead.scoreBreakdown.rationale && (
                                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed border-t border-slate-700/50 pt-2">
                                  {lead.scoreBreakdown.rationale}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-600">Not scored yet.</p>
                          )}
                        </div>

                        {/* Agent Recommendations — Phase 5 */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[10px] font-bold text-slate-600 uppercase">Recommendations</h4>
                            <button
                              onClick={async () => {
                                if (!onUpdateLead || isGettingRecommendations) return;
                                setIsGettingRecommendations(true);
                                try {
                                  const recommendations = await getNextBestActions(lead);
                                  onUpdateLead({
                                    ...lead,
                                    recommendations,
                                    lastAgentAction: 'recommendNextActions',
                                  });
                                } catch (e) {
                                  console.error('Recommendations failed:', e);
                                } finally {
                                  setIsGettingRecommendations(false);
                                }
                              }}
                              disabled={isGettingRecommendations}
                              className="px-2 py-1 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-600/30 rounded text-[10px] text-cyan-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isGettingRecommendations ? 'Analyzing...' : 'Get Recommendations'}
                            </button>
                          </div>

                          {lead.recommendations && lead.recommendations.length > 0 ? (
                            <div className="space-y-2">
                              {lead.recommendations.map((rec: AgentRecommendation, i: number) => (
                                <div key={rec.id || i} className="p-3 bg-slate-800/60 rounded border border-slate-700/60">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-white">{rec.title}</span>
                                    <div className="flex items-center gap-1">
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                                        rec.priority === 'HIGH' ? 'bg-red-900/30 text-red-400 border-red-800/50' :
                                        rec.priority === 'MEDIUM' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50' :
                                        'bg-slate-700/30 text-slate-400 border-slate-700/50'
                                      }`}>
                                        {rec.priority}
                                      </span>
                                      <span className="text-[9px] bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/50">
                                        {rec.type.replace(/_/g, ' ')}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-relaxed">{rec.reason}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-600">No recommendations yet.</p>
                          )}
                        </div>

                        {/* Outreach Strategy & Drafts — Phase 6 */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[10px] font-bold text-slate-600 uppercase">Outreach Strategy</h4>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={async () => {
                                  if (!onUpdateLead || isGeneratingStrategy) return;
                                  setIsGeneratingStrategy(true);
                                  setOutreachError(null);
                                  try {
                                    const strategy = await getClosingStrategy(lead, productContext as any);
                                    onUpdateLead({
                                      ...lead,
                                      lastAgentAction: 'generateClosingStrategy',
                                      ...({ _closingStrategy: strategy } as any),
                                    });
                                  } catch (e) {
                                    console.error('Strategy generation failed:', e);
                                    setOutreachError('Strategy generation failed.');
                                  } finally {
                                    setIsGeneratingStrategy(false);
                                  }
                                }}
                                disabled={isGeneratingStrategy}
                                className="px-2 py-1 bg-teal-600/20 hover:bg-teal-600/40 border border-teal-600/30 rounded text-[10px] text-teal-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isGeneratingStrategy ? 'Analyzing...' : 'Get Strategy'}
                              </button>
                              {(lead as any)._closingStrategy && (
                                <button
                                  onClick={async () => {
                                    if (!onUpdateLead || isGeneratingDraft) return;
                                    setIsGeneratingDraft(true);
                                    setOutreachError(null);
                                    try {
                                      const strategy = (lead as any)._closingStrategy as ClosingStrategy;
                                      const draft = await generateOutreachDraft(lead, strategy.recommendedPlatform, strategy, productContext);
                                      const drafts = [...(lead.outreachDrafts || []), draft];
                                      onUpdateLead({
                                        ...lead,
                                        outreachDrafts: drafts,
                                        lastAgentAction: 'generateOutreachDraft',
                                      } as any);
                                    } catch (e) {
                                      console.error('Draft generation failed:', e);
                                      setOutreachError('Draft generation failed.');
                                    } finally {
                                      setIsGeneratingDraft(false);
                                    }
                                  }}
                                  disabled={isGeneratingDraft}
                                  className="px-2 py-1 bg-pink-600/20 hover:bg-pink-600/40 border border-pink-600/30 rounded text-[10px] text-pink-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isGeneratingDraft ? 'Drafting...' : 'Generate Draft'}
                                </button>
                              )}
                            </div>
                          </div>

                          {outreachError && (
                            <p className="text-[10px] text-red-400 mb-2">{outreachError}</p>
                          )}

                          {(lead as any)._closingStrategy ? (
                            <div className="mb-3 p-3 bg-teal-900/20 rounded border border-teal-800/30">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-teal-400">
                                  {((lead as any)._closingStrategy as ClosingStrategy).type.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[9px] text-teal-600">
                                  {((lead as any)._closingStrategy as ClosingStrategy).confidence}% confidence
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 leading-relaxed mb-2">
                                {((lead as any)._closingStrategy as ClosingStrategy).rationale}
                              </p>
                              <div className="space-y-1">
                                {((lead as any)._closingStrategy as ClosingStrategy).keyTalkingPoints.map((point: string, i: number) => (
                                  <div key={i} className="flex items-start gap-1.5">
                                    <span className="text-[9px] text-teal-500 mt-0.5">•</span>
                                    <span className="text-[10px] text-slate-300">{point}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-600 mb-3">Generate a closing strategy first.</p>
                          )}

                          {lead.outreachDrafts && lead.outreachDrafts.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-[9px] font-bold text-slate-500 uppercase">Generated Drafts</h5>
                              {lead.outreachDrafts.map((draft: OutreachDraft, i: number) => (
                                <div key={draft.id || i} className="p-3 bg-slate-800/60 rounded border border-slate-700/60">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/50 capitalize">
                                        {draft.type.replace(/_/g, ' ')}
                                      </span>
                                      {draft.approved ? (
                                        <span className="text-[9px] bg-emerald-900/30 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800/50">Approved</span>
                                      ) : (
                                        <span className="text-[9px] bg-yellow-900/30 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-800/50">Pending</span>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => {
                                        if (!onUpdateLead) return;
                                        const updated = lead.outreachDrafts?.map((d, idx) =>
                                          idx === i ? { ...d, approved: !d.approved } : d
                                        ) || [];
                                        onUpdateLead({ ...lead, outreachDrafts: updated, lastAgentAction: 'toggleDraftApproval' });
                                      }}
                                      className="text-[9px] text-slate-500 hover:text-white transition-colors"
                                    >
                                      {draft.approved ? 'Unapprove' : 'Approve'}
                                    </button>
                                  </div>
                                  {draft.subject && (
                                    <p className="text-[10px] font-bold text-slate-300 mb-1">{draft.subject}</p>
                                  )}
                                  <p className="text-[10px] text-slate-400 leading-relaxed whitespace-pre-wrap">{draft.body}</p>
                                  {draft.evidenceIds && draft.evidenceIds.length > 0 && (
                                    <p className="text-[9px] text-slate-600 mt-2">
                                      Evidence: {draft.evidenceIds.length} references cited
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                    </div>
                 )}

                 {activeTab === 'logs' ? (
                     <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4" ref={scrollRef}>
                        {(!lead.logs || lead.logs.length === 0) ? (
                            <div className="text-center text-slate-500 mt-10">No discovery data available.</div>
                        ) : (
                            lead.logs.map((log, idx) => (
                                <div key={idx} className={`flex flex-col items-start`}>
                                    <div className="text-[10px] text-slate-500 mb-1 font-mono">
                                        &gt; {log.timestamp} | SYSTEM
                                    </div>
                                    <div className={`w-full rounded-lg text-sm shadow-md overflow-hidden relative border border-slate-700 bg-slate-800 text-slate-200`}>
                                        <div className="p-4">
                                            <p className="leading-relaxed whitespace-pre-wrap">{log.message}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                     </div>
                 ) : (
                     activeTab === 'chat' && (
                     <div className="flex-1 flex flex-col min-h-0">
                        {/* Chat History */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4" ref={chatScrollRef}>
                            {(!lead.chatHistory || lead.chatHistory.length === 0) ? (
                                <div className="text-center mt-10 space-y-4">
                                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-500">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-sm font-medium">Start Prospecting</p>
                                        <p className="text-slate-500 text-xs mt-1 max-w-xs mx-auto">
                                            Ask me to draft an email, research this company, or find the best contact strategy.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                lead.chatHistory.map((msg, idx) => (
                                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[85%] rounded-lg text-sm shadow-md overflow-hidden border p-3 ${
                                            msg.role === 'user' 
                                            ? 'bg-primary-900/30 border-primary-800 text-slate-200' 
                                            : 'bg-slate-800 border-slate-700 text-slate-300'
                                        }`}>
                                            <div className="leading-relaxed">
                                                <ReactMarkdown
                                                    components={{
                                                        a: ({node, ...props}) => <a {...props} className="text-blue-400 hover:underline break-all" target="_blank" rel="noopener noreferrer" />,
                                                        p: ({node, ...props}) => <p {...props} className="mb-2 last:mb-0" />,
                                                        ul: ({node, ...props}) => <ul {...props} className="list-disc list-inside mb-2 pl-2" />,
                                                        ol: ({node, ...props}) => <ol {...props} className="list-decimal list-inside mb-2 pl-2" />,
                                                        li: ({node, ...props}) => <li {...props} className="mb-1" />,
                                                        h1: ({node, ...props}) => <h1 {...props} className="text-lg font-bold mb-2 mt-4 first:mt-0" />,
                                                        h2: ({node, ...props}) => <h2 {...props} className="text-base font-bold mb-2 mt-3 first:mt-0" />,
                                                        h3: ({node, ...props}) => <h3 {...props} className="text-sm font-bold mb-2 mt-2 first:mt-0" />,
                                                        code: ({node, ...props}) => <code {...props} className="bg-slate-900/50 px-1 py-0.5 rounded font-mono text-xs" />,
                                                        pre: ({node, ...props}) => <pre {...props} className="bg-slate-900/50 p-2 rounded mb-2 overflow-x-auto font-mono text-xs" />,
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-600 mt-1">
                                            {msg.role === 'user' ? 'You' : 'Assistant'}
                                        </span>
                                    </div>
                                ))
                            )}
                            {isChatLoading && (
                                <div className="flex flex-col items-start">
                                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-75"></div>
                                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-150"></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Draft an intro email for this distributor..."
                                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder-slate-600"
                                    disabled={isChatLoading}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={isChatLoading || !chatInput.trim()}
                                    className="bg-primary-600 hover:bg-primary-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg px-4 py-2 transition-colors flex items-center justify-center"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                </button>
                            </div>
                            {!productContext && (
                                <p className="text-[10px] text-slate-500 mt-2">
                                    ℹ️ Running in general assistance mode (No product context).
                                </p>
                            )}
                        </div>
                     </div>
                     )
                 )}
            </div>
        </div>
    </div>
  );
};

