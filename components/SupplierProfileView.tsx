import React, { useEffect, useState } from 'react';
import { SupplierProfile } from '../types';

interface Props {
  profile: SupplierProfile | null;
  onSave: (profile: SupplierProfile) => void;
}

export const SupplierProfileView: React.FC<Props> = ({ profile, onSave }) => {
  const [formData, setFormData] = useState<SupplierProfile>({
    companyName: profile?.companyName || '',
    website: profile?.website || '',
    contactName: profile?.contactName || '',
    contactEmail: profile?.contactEmail || '',
    contactPhone: profile?.contactPhone || '',
    companyDescription: profile?.companyDescription || '',
    valueProposition: profile?.valueProposition || '',
  });

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setFormData({
      companyName: profile?.companyName || '',
      website: profile?.website || '',
      contactName: profile?.contactName || '',
      contactEmail: profile?.contactEmail || '',
      contactPhone: profile?.contactPhone || '',
      companyDescription: profile?.companyDescription || '',
      valueProposition: profile?.valueProposition || '',
    });
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (isSaved) setIsSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950 h-full">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Supplier Profile (Optional)</h1>
          <p className="text-slate-400">
            Configure your company details. Providing this information helps TradeNexus 
            personalize outbound messages and negotiate more effectively with prospects.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8">
          {/* Grid layout for fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Company Name</label>
              <input 
                 type="text" 
                 name="companyName" 
                 value={formData.companyName} 
                 onChange={handleChange}
                 className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
                 placeholder="e.g. Acme Corp"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Website</label>
              <input 
                 type="url" 
                 name="website" 
                 value={formData.website} 
                 onChange={handleChange}
                 className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
                 placeholder="https://acmecorp.com"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Primary Contact Name</label>
              <input 
                 type="text" 
                 name="contactName" 
                 value={formData.contactName} 
                 onChange={handleChange}
                 className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
                 placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Primary Contact Email</label>
              <input 
                 type="email" 
                 name="contactEmail" 
                 value={formData.contactEmail} 
                 onChange={handleChange}
                 className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
                 placeholder="john@acmecorp.com"
              />
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Primary Contact Phone (Optional)</label>
             <input 
                type="tel" 
                name="contactPhone" 
                value={formData.contactPhone} 
                onChange={handleChange}
                className="w-full md:w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
                placeholder="+1 (555) 000-0000"
             />
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Company Description</label>
             <textarea 
                name="companyDescription" 
                value={formData.companyDescription} 
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors h-24 resize-none"
                placeholder="What does your company do? What is your core business?"
             />
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Unique Value Proposition</label>
             <textarea 
                name="valueProposition" 
                value={formData.valueProposition} 
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors h-24 resize-none"
                placeholder="Why should buyers choose you over competitors? (e.g. Fast shipping, highest quality, lifetime warranty)"
             />
          </div>

          <div className="flex justify-end items-center gap-4 pt-4 border-t border-slate-800">
             {isSaved && <span className="text-green-500 text-sm font-medium animate-pulse">Profile saved successfully!</span>}
             <button 
                type="submit" 
                className="bg-primary-600 hover:bg-primary-500 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-lg shadow-primary-500/20"
             >
                 Save Profile
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};
